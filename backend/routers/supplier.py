# backend/routers/supplier.py
# Epic 5 Customer-Facing (E5-CF-BE-02) — Endpoint publik POST /supplier/register.
#
# Tanpa auth (form pendaftaran supplier publik). Rate limit 5/jam/IP,
# konsisten dengan /rfq/submit (R-49).
#
# TIDAK ada LLM call di sini — insert + 1 email notifikasi admin saja.
#
# Sama seperti rfq.py: get_remote_address dari slowapi HANYA baca
# request.client.host, tidak baca X-Forwarded-For — pakai get_client_ip
# eksplisit supaya rate limit ter-enforce dengan benar di belakang
# proxy Railway.

import logging

from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from core.supabase import get_supabase
from schemas.supplier import SupplierRegisterRequest, SupplierRegisterResponse
from services.email_service import EmailService

router = APIRouter(prefix="/supplier", tags=["supplier"])
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
    "/register",
    response_model=SupplierRegisterResponse,
    status_code=201,
    summary="Register as supplier (public)",
)
@limiter.limit("5/hour")
async def register_supplier(
    request: Request,
    payload: SupplierRegisterRequest,
) -> SupplierRegisterResponse:
    supabase = get_supabase()

    # Insert blocking — kalau gagal, raise (beda severity dari email
    # notifikasi di bawah, jangan digabung try-except yang sama).
    try:
        result = supabase.table("supplier_registrations").insert(
            payload.model_dump()
        ).execute()
    except Exception as e:
        logger.error(f"supplier_insert_failed: {e!r}")
        raise HTTPException(500, detail="Gagal menyimpan pendaftaran. Silakan coba lagi.")

    if not result.data:
        logger.error("supplier_insert_empty_result")
        raise HTTPException(500, detail="Gagal menyimpan pendaftaran. Silakan coba lagi.")

    supplier = result.data[0]
    supplier_id = supplier["id"]

    logger.info(f"supplier_registered: supplier_id={supplier_id} business={payload.business_name!r}")

    # Email fire-and-forget — data sudah tersimpan, kegagalan kirim
    # email TIDAK boleh membuat submit gagal untuk supplier.
    try:
        EmailService.send_supplier_notification_to_admin(supplier=supplier)
    except Exception as e:
        logger.warning(f"supplier_notification_email_failed: supplier_id={supplier_id} error={e!r}")

    return SupplierRegisterResponse(success=True, supplier_id=supplier_id)
