# backend/routers/contact.py
# Epic 2 Slice 3 (E2-S3-BE-03) — Endpoint publik POST /contact/send.
#
# Tanpa auth (form kontak publik). Rate limit 5/menit/IP. Email tujuan
# dibaca dari company_settings saat request masuk — bukan hardcode —
# supaya perubahan admin di /admin/settings langsung terpakai.
#
# CATATAN: slowapi.util.get_remote_address HANYA baca request.client.host
# — TIDAK membaca X-Forwarded-For sama sekali (ditemukan saat QA staging:
# rate limit tidak pernah trigger di belakang proxy Railway karena
# request.client.host tidak stabil per-klien). Pakai get_client_ip di
# bawah yang eksplisit baca X-Forwarded-For dulu.

from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from datetime import datetime, timezone
import logging

from schemas.contact import ContactRequest, ContactResponse
from services.email_service import EmailService
from core.supabase import get_supabase

router = APIRouter(prefix="/contact", tags=["contact"])
logger = logging.getLogger(__name__)


def get_client_ip(request: Request) -> str:
    """IP klien asli di belakang proxy Railway (X-Forwarded-For),
    fallback ke request.client.host kalau header tidak ada."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=get_client_ip)


@router.post("/send", response_model=ContactResponse)
@limiter.limit("5/minute")
async def send_contact(request: Request, payload: ContactRequest):
    # 1. Ambil email tujuan dari company_settings
    supabase = get_supabase()
    try:
        settings_result = (
            supabase.table("company_settings")
            .select("value")
            .eq("key", "email")
            .single()
            .execute()
        )
        admin_email = settings_result.data.get("value") if settings_result.data else None
    except Exception as e:
        logger.error(f"contact_settings_fetch_failed: {e!r}")
        admin_email = None

    if not admin_email:
        logger.error("contact_missing_admin_email")
        raise HTTPException(500, detail="Gagal mengirim pesan. Silakan coba lagi atau hubungi via WhatsApp.")

    # 2. Kirim email
    try:
        EmailService.send_contact_notification(
            to_email=admin_email,
            from_name=payload.name,
            from_email=payload.email,
            phone=payload.phone,
            message=payload.message,
        )
    except Exception as e:
        logger.error(f"contact_send_failed: {e!r}")
        raise HTTPException(500, detail="Gagal mengirim pesan. Silakan coba lagi atau hubungi via WhatsApp.")

    return ContactResponse(
        success=True,
        message="Pesan Anda berhasil terkirim.",
        submitted_at=datetime.now(timezone.utc),
    )
