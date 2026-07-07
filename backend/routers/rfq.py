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

import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from core.supabase import get_supabase
from schemas.rfq import RFQSubmitRequest, RFQSubmitResponse
from services.email_service import EmailService

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
