# backend/routers/rfq.py
# Epic 4 Customer-Facing (E4-CF-BE-02) — Endpoint publik POST /rfq/submit.
#
# Tanpa auth (form RFQ publik). Rate limit 5/jam/IP (AR-02 — threshold
# lebih tinggi dari /contact/send karena expected legitimate volume
# rendah, tapi cukup untuk throttle spam bot).
#
# TIDAK ada LLM call di sini (AR-01/R-16) — insert + 2 email saja.
# AI proposal generation ada di Epic 4B Admin Panel Slice 2.
#
# Sama seperti contact.py: get_remote_address dari slowapi HANYA baca
# request.client.host, tidak baca X-Forwarded-For — pakai get_client_ip
# eksplisit supaya rate limit ter-enforce dengan benar di belakang
# proxy Railway.
#
# Epic 4B Slice 1 (E4B-S1-BE-02/03/04/05) — admin endpoints ditambah di
# bawah submit_rfq. PENTING route order: "/leads" HARUS dideklarasikan
# SEBELUM "/leads/{lead_id}" — FastAPI match by declaration order, kalau
# terbalik request ke /leads akan coba diinterpretasi sebagai lead_id
# (sama trap dengan products.py /admin vs /{slug}, lihat E3B R-12).

import logging
import re
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from core.supabase import get_supabase
from dependencies.auth import get_current_user
from schemas.rfq import (
    RFQLead,
    RFQLeadDetailResponse,
    RFQLeadListResponse,
    RFQLeadUpdateRequest,
    RFQSubmitRequest,
    RFQSubmitResponse,
    WATemplateRequest,
    WATemplateResponse,
    LeadStatusHistory,
)
from services.email_service import EmailService
from services.wa_template_service import generate_wa_template

router = APIRouter(prefix="/rfq", tags=["rfq"])
logger = logging.getLogger(__name__)


def get_client_ip(request: Request) -> str:
    """IP klien asli di belakang proxy Railway (X-Forwarded-For),
    fallback ke request.client.host kalau header tidak ada."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=get_client_ip)


@router.post(
    "/submit",
    response_model=RFQSubmitResponse,
    status_code=201,
    summary="Submit RFQ (public)",
)
@limiter.limit("5/hour")
async def submit_rfq(
    request: Request,
    payload: RFQSubmitRequest,
    background_tasks: BackgroundTasks,
) -> RFQSubmitResponse:
    supabase = get_supabase()

    # 1. Insert ke DB
    try:
        result = supabase.table("rfq_leads").insert(payload.model_dump()).execute()
    except Exception as e:
        logger.error(f"rfq_insert_failed: {e!r}")
        raise HTTPException(500, detail="Gagal menyimpan permintaan. Silakan coba lagi.")

    if not result.data:
        logger.error("rfq_insert_empty_result")
        raise HTTPException(500, detail="Gagal menyimpan permintaan. Silakan coba lagi.")

    lead = result.data[0]
    lead_id = lead["id"]

    # 2. Fetch nama produk untuk personalisasi email (best-effort — kalau
    # gagal, email tetap terkirim tanpa nama produk lengkap)
    products: list[dict] = []
    try:
        products_result = (
            supabase.table("products")
            .select("slug, name, code")
            .in_("slug", payload.salt_types)
            .execute()
        )
        products = products_result.data or []
    except Exception as e:
        logger.warning(f"rfq_products_fetch_failed: lead_id={lead_id} error={e!r}")

    # 3. Fetch admin email dari company_settings (fail-open — RFQ tetap
    # saved walau admin_email tidak ketemu, AR di task breakdown)
    admin_email: str | None = None
    try:
        settings_result = (
            supabase.table("company_settings")
            .select("value")
            .eq("key", "email")
            .limit(1)
            .execute()
        )
        admin_email = settings_result.data[0]["value"] if settings_result.data else None
    except Exception as e:
        logger.warning(f"rfq_admin_email_fetch_failed: lead_id={lead_id} error={e!r}")

    if not admin_email:
        logger.warning(f"rfq_no_admin_email_configured: lead_id={lead_id}")

    # 4. Queue email via BackgroundTasks (fire-and-forget, R-20) — jangan
    # block response demi delivery guarantee, target submit < 5 detik
    logger.info(f"rfq_submitted: lead_id={lead_id} company={payload.company_name!r}")
    background_tasks.add_task(
        EmailService.send_rfq_customer_confirmation,
        to_email=payload.email,
        lead_data=lead,
        products=products,
        reply_to=admin_email,
    )
    if admin_email:
        background_tasks.add_task(
            EmailService.send_rfq_admin_notification,
            to_email=admin_email,
            lead_data=lead,
            products=products,
        )

    return RFQSubmitResponse(success=True, lead_id=lead_id)


# ── Admin: CRM Pipeline (Epic 4B Slice 1) ────────────────────


@router.get(
    "/leads",
    response_model=RFQLeadListResponse,
    dependencies=[Depends(get_current_user)],
)
async def list_leads(
    status: str | None = Query(None),
    industry: str | None = Query(None),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    search: str | None = Query(None),
) -> RFQLeadListResponse:
    """[AUTH] List semua leads untuk Kanban, dengan filter opsional."""
    supabase = get_supabase()
    query = supabase.table("rfq_leads").select("*")

    if status:
        query = query.eq("status", status)
    if industry:
        query = query.eq("industry_type", industry)
    if date_from:
        query = query.gte("created_at", date_from.isoformat())
    if date_to:
        query = query.lte("created_at", date_to.isoformat())
    if search:
        query = query.or_(f"full_name.ilike.%{search}%,company_name.ilike.%{search}%")

    try:
        result = query.order("created_at", desc=True).execute()
    except Exception as e:
        logger.error(f"rfq_leads_list_failed: {e!r}")
        raise HTTPException(500, detail="Gagal mengambil data leads")

    leads = [RFQLead(**row) for row in result.data]
    return RFQLeadListResponse(leads=leads, total=len(leads))


@router.get(
    "/leads/{lead_id}",
    response_model=RFQLeadDetailResponse,
    dependencies=[Depends(get_current_user)],
)
async def get_lead_detail(lead_id: str) -> RFQLeadDetailResponse:
    """[AUTH] Detail 1 lead + histori status (sorted terbaru dulu)."""
    supabase = get_supabase()

    try:
        lead_result = (
            supabase.table("rfq_leads").select("*").eq("id", lead_id).limit(1).execute()
        )
    except Exception as e:
        logger.error(f"rfq_lead_detail_failed: lead_id={lead_id} error={e!r}")
        raise HTTPException(500, detail="Gagal mengambil data lead")

    if not lead_result.data:
        raise HTTPException(404, detail="Lead tidak ditemukan")

    try:
        history_result = (
            supabase.table("lead_status_history")
            .select("*")
            .eq("lead_id", lead_id)
            .order("changed_at", desc=True)
            .execute()
        )
    except Exception as e:
        logger.error(f"rfq_lead_history_failed: lead_id={lead_id} error={e!r}")
        raise HTTPException(500, detail="Gagal mengambil histori lead")

    return RFQLeadDetailResponse(
        lead=RFQLead(**lead_result.data[0]),
        history=[LeadStatusHistory(**h) for h in history_result.data],
    )


@router.patch(
    "/leads/{lead_id}",
    response_model=RFQLeadDetailResponse,
    dependencies=[Depends(get_current_user)],
)
async def update_lead(lead_id: str, payload: RFQLeadUpdateRequest) -> RFQLeadDetailResponse:
    """[AUTH] Update status dan/atau admin_notes. Whitelist di-enforce oleh
    RFQLeadUpdateRequest (extra='forbid'). Histori status di-log otomatis
    oleh DB trigger — router TIDAK insert manual (R-28)."""
    supabase = get_supabase()

    # exclude_none=True krusial: tanpa ini, field yang tidak dikirim client
    # (None) akan overwrite value existing ke NULL saat partial update.
    update_data = payload.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(422, detail="Tidak ada field untuk diupdate")

    try:
        result = (
            supabase.table("rfq_leads").update(update_data).eq("id", lead_id).execute()
        )
    except Exception as e:
        logger.error(f"rfq_lead_update_failed: lead_id={lead_id} error={e!r}")
        raise HTTPException(500, detail="Gagal menyimpan perubahan lead")

    if not result.data:
        raise HTTPException(404, detail="Lead tidak ditemukan")

    logger.info(f"rfq_lead_updated: lead_id={lead_id} fields={list(update_data.keys())}")
    return await get_lead_detail(lead_id)


@router.post(
    "/wa-template",
    response_model=WATemplateResponse,
    dependencies=[Depends(get_current_user)],
)
async def generate_wa_template_endpoint(payload: WATemplateRequest) -> WATemplateResponse:
    """[AUTH] Generate template pesan WA berdasarkan status lead saat ini."""
    supabase = get_supabase()

    try:
        lead_result = (
            supabase.table("rfq_leads").select("*").eq("id", payload.lead_id).limit(1).execute()
        )
    except Exception as e:
        logger.error(f"rfq_wa_template_lookup_failed: lead_id={payload.lead_id} error={e!r}")
        raise HTTPException(500, detail="Gagal mengambil data lead")

    if not lead_result.data:
        raise HTTPException(404, detail="Lead tidak ditemukan")

    lead = lead_result.data[0]
    template = generate_wa_template(lead=lead, status=payload.status)

    # Clean nomor WA untuk wa.me link: strip spasi/dash/plus/kurung, lalu
    # normalize prefix 08xx -> 62xx (wa.me butuh format internasional
    # tanpa +). Kalau sudah 62xx atau +62xx, tidak di-double-prefix.
    whatsapp_clean = re.sub(r'[\s\-+()]', '', lead['whatsapp'])
    if whatsapp_clean.startswith('0'):
        whatsapp_clean = '62' + whatsapp_clean[1:]

    return WATemplateResponse(template=template, whatsapp_number=whatsapp_clean)
