# backend/routers/contact.py
# Epic 2 Slice 3 (E2-S3-BE-03) — Endpoint publik POST /contact/send.
#
# Tanpa auth (form kontak publik). Rate limit 5/menit/IP (slowapi,
# pola sama dengan routers/auth.py). Email tujuan dibaca dari
# company_settings saat request masuk — bukan hardcode — supaya
# perubahan admin di /admin/settings langsung terpakai.

from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from datetime import datetime, timezone
import logging

from schemas.contact import ContactRequest, ContactResponse
from services.email_service import EmailService
from core.supabase import get_supabase

router = APIRouter(prefix="/contact", tags=["contact"])
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)


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
