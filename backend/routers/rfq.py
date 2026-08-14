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
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from fastapi.responses import Response
from slowapi import Limiter
from slowapi.util import get_remote_address

from core.supabase import get_supabase
from dependencies.auth import get_current_user, require_admin
from schemas.proposal_settings import GenerateProposalRequest
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
from services.pdf_service import apply_layout, html_to_pdf
from services.proposal_generator import ProposalGeneratorError, get_proposal_service
from services.proposal_settings_service import ProposalSettingsService
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
    dependencies=[Depends(require_admin)],
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
    dependencies=[Depends(require_admin)],
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
    dependencies=[Depends(require_admin)],
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
    dependencies=[Depends(require_admin)],
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


# ── Admin: Proposal Generator (Epic 4B Slice 2) ──────────────


def _slugify(text: str) -> str:
    """'PT XYZ Corp' -> 'pt-xyz-corp' — dipakai untuk nama file PDF."""
    slug = re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')
    return slug or "lead"


async def _fetch_lead_or_404(supabase, lead_id: str) -> dict:
    result = supabase.table("rfq_leads").select("*").eq("id", lead_id).limit(1).execute()
    if not result.data:
        raise HTTPException(404, detail="Lead tidak ditemukan")
    return result.data[0]


@router.post(
    "/leads/{lead_id}/generate-proposal",
    response_model=RFQLeadDetailResponse,
    dependencies=[Depends(require_admin)],
)
async def generate_proposal(
    lead_id: str,
    payload: GenerateProposalRequest = GenerateProposalRequest(),
) -> RFQLeadDetailResponse:
    """[AUTH] Generate proposal HTML via Anthropic Haiku (blocking, R-31
    — request sengaja 10-30 detik, bukan background job untuk MVP).

    Epic 4B Slice 3A (R-38): `payload` optional — body kosong/absen
    (Slice 2 frontend belum update) = Quick Mode, behavior identik
    sebelum Slice 3A. temperature/max_tokens/custom_instructions hanya
    berlaku kalau eksplisit di-pass (Advanced Mode)."""
    supabase = get_supabase()
    lead = await _fetch_lead_or_404(supabase, lead_id)

    try:
        products_result = (
            supabase.table("products").select("*").in_("slug", lead.get("salt_types") or []).execute()
        )
        products = products_result.data or []
    except Exception as e:
        logger.warning(f"proposal_products_fetch_failed: lead_id={lead_id} error={e!r}")
        products = []

    try:
        settings_result = supabase.table("company_settings").select("key,value").execute()
        company_settings = {row["key"]: row["value"] for row in (settings_result.data or [])}
    except Exception as e:
        logger.warning(f"proposal_company_settings_fetch_failed: lead_id={lead_id} error={e!r}")
        company_settings = {}

    service = get_proposal_service()
    try:
        proposal_html = await service.generate(
            lead,
            products,
            company_settings,
            temperature=payload.temperature,
            max_tokens=payload.max_tokens,
            custom_instructions=payload.custom_instructions,
        )
    except ProposalGeneratorError as e:
        raise HTTPException(503, detail=str(e))

    try:
        supabase.table("rfq_leads").update({
            "proposal_html": proposal_html,
            "proposal_generated": True,
            "proposal_generated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", lead_id).execute()
    except Exception as e:
        logger.error(f"proposal_save_failed: lead_id={lead_id} error={e!r}")
        raise HTTPException(500, detail="Proposal digenerate tapi gagal disimpan. Coba lagi.")

    return await get_lead_detail(lead_id)


@router.post(
    "/leads/{lead_id}/send-proposal",
    response_model=RFQLeadDetailResponse,
    dependencies=[Depends(require_admin)],
)
async def send_proposal_endpoint(lead_id: str) -> RFQLeadDetailResponse:
    """[AUTH] Generate PDF dari proposal_html tersimpan + kirim ke email
    customer. Dijalankan SYNC (bukan BackgroundTasks) supaya kegagalan
    kirim email ter-propagate ke response — admin klik "Kirim" adalah
    aksi eksplisit yang butuh konfirmasi sukses/gagal real, beda dari
    notifikasi RFQ submit yang fire-and-forget (R-20 tidak apply di sini)."""
    supabase = get_supabase()
    lead = await _fetch_lead_or_404(supabase, lead_id)

    if not lead.get("proposal_html"):
        raise HTTPException(422, detail="Proposal belum di-generate")

    try:
        # Slice 3C (E4B-S3C-BE-04): suntik header/footer/logo/warna aksen
        # dari proposal_settings sebelum convert PDF. Kalau semua field
        # layout kosong (belum pernah di-customize), hasil identik Slice 2.
        layout_settings = ProposalSettingsService(supabase).get()
        pdf_bytes = html_to_pdf(apply_layout(lead["proposal_html"], layout_settings))
    except Exception:
        raise HTTPException(500, detail="Gagal membuat PDF dari proposal")

    filename = f"proposal-{_slugify(lead['company_name'])}.pdf"

    try:
        EmailService.send_proposal_email(
            to_email=lead["email"],
            lead_data=lead,
            pdf_bytes=pdf_bytes,
            pdf_filename=filename,
        )
    except Exception:
        raise HTTPException(502, detail="Gagal mengirim email ke customer. Coba lagi.")

    try:
        supabase.table("rfq_leads").update({
            "proposal_sent_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", lead_id).execute()
    except Exception as e:
        logger.error(f"proposal_sent_at_update_failed: lead_id={lead_id} error={e!r}")
        # Email sudah terkirim — jangan raise, cuma log. Admin tetap lihat
        # sukses; proposal_sent_at bisa telat ter-update tapi tidak fatal.

    return await get_lead_detail(lead_id)


@router.get(
    "/leads/{lead_id}/proposal.pdf",
    dependencies=[Depends(require_admin)],
)
async def download_proposal_pdf(lead_id: str) -> Response:
    """[AUTH] Download PDF on-demand (AR-03 — tidak di-cache/persist)."""
    supabase = get_supabase()
    result = (
        supabase.table("rfq_leads")
        .select("proposal_html,company_name")
        .eq("id", lead_id)
        .limit(1)
        .execute()
    )
    if not result.data or not result.data[0].get("proposal_html"):
        raise HTTPException(404, detail="Proposal belum di-generate")

    try:
        layout_settings = ProposalSettingsService(supabase).get()
        pdf_bytes = html_to_pdf(apply_layout(result.data[0]["proposal_html"], layout_settings))
    except Exception:
        raise HTTPException(500, detail="Gagal membuat PDF dari proposal")

    filename = f"proposal-{_slugify(result.data[0]['company_name'])}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
