# backend/services/email_service.py
# Epic 2 Slice 3 (E2-S3-BE-02) — Wrapper Resend API untuk email notifikasi.
#
# Dipakai oleh:
#   - POST /contact/send (Slice 3 — sekarang)
#   - Epic 4: RFQ notification
#   - Epic 5: Supplier registration notification
#
# Domain `rekaciptaindonesia.com` harus ter-verify di Resend dashboard
# sebelum go-live. Sampai itu selesai, kirim dari `onboarding@resend.dev`
# (default testing domain Resend) — lihat README.md backend.

import resend
import logging
from typing import Optional
from core.config import settings

logger = logging.getLogger(__name__)
resend.api_key = settings.RESEND_API_KEY

DEFAULT_FROM = "CV Reka Cipta Indonesia <no-reply@rekaciptaindonesia.com>"


class EmailService:
    @staticmethod
    def send_contact_notification(
        to_email: str,
        from_name: str,
        from_email: str,
        phone: Optional[str],
        message: str,
    ) -> dict:
        """Kirim email notifikasi ke admin dari form kontak.

        Return: { id: str } jika sukses. Raise Exception jika gagal.
        """
        html_body = f"""
        <h2>Pesan Kontak Baru</h2>
        <p><strong>Nama:</strong> {from_name}</p>
        <p><strong>Email:</strong> <a href="mailto:{from_email}">{from_email}</a></p>
        <p><strong>WhatsApp:</strong> {phone or '(tidak diisi)'}</p>
        <p><strong>Pesan:</strong></p>
        <blockquote style="border-left:3px solid #0B7D6E;padding-left:12px;margin:12px 0;">
          {message.replace(chr(10), '<br>')}
        </blockquote>
        <hr>
        <p style="color:#666;font-size:12px;">Pesan ini dikirim dari form kontak di rekaciptaindonesia.com/kontak</p>
        """
        try:
            response = resend.Emails.send({
                "from": DEFAULT_FROM,
                "to": to_email,
                "reply_to": from_email,
                "subject": f"[Kontak Web] Pesan baru dari {from_name}",
                "html": html_body,
            })
            logger.info("contact_email_sent", extra={"resend_id": response.get("id")})
            return response
        except Exception as e:
            logger.error("contact_email_failed", extra={"error": str(e)})
            raise
