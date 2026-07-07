# backend/services/email_service.py
# Epic 2 Slice 3 (E2-S3-BE-02) — Wrapper Resend API untuk email notifikasi.
#
# Dipakai oleh:
#   - POST /contact/send (Slice 3 — sekarang)
#   - Epic 4: RFQ notification
#   - Epic 5: Supplier registration notification
#
# Domain `rekaciptaindonesia.com` BELUM di-verify di Resend dashboard.
# Sementara kirim dari `onboarding@resend.dev` (default testing domain
# Resend, otomatis verified tanpa setup DNS). GANTI DEFAULT_FROM ke
# alamat @rekaciptaindonesia.com setelah domain di-verify (lihat
# Resend dashboard → Domains).

import base64
import resend
import logging
from typing import Any, Optional
from core.config import settings

logger = logging.getLogger(__name__)
resend.api_key = settings.RESEND_API_KEY

DEFAULT_FROM = "CV Reka Cipta Indonesia <onboarding@resend.dev>"

_FREQUENCY_LABELS = {
    'weekly': 'mingguan',
    'biweekly': 'dua minggu sekali',
    'monthly': 'bulanan',
}


def _mask_whatsapp(wa: str) -> str:
    """Mask 4 digit tengah nomor WhatsApp untuk privacy (+62812****5678)."""
    if len(wa) < 8:
        return wa
    return wa[:4] + "*" * (len(wa) - 8) + wa[-4:]


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
            logger.info(f"contact_email_sent: resend_id={response.get('id')}")
            return response
        except Exception as e:
            logger.error(f"contact_email_failed: {e!r}")
            raise

    @staticmethod
    def send_rfq_customer_confirmation(
        to_email: str,
        lead_data: dict[str, Any],
        products: list[dict[str, Any]],
        reply_to: Optional[str] = None,
    ) -> Optional[dict]:
        """Kirim email konfirmasi ke customer setelah submit RFQ (E4-CF-BE-03).

        Return: { id: str } jika sukses, None kalau gagal (sudah di-log,
        tidak raise — lihat catatan di except block, R-20).
        """
        product_names = ", ".join(f"{p['name']} ({p['code']})" for p in products)
        whatsapp_masked = _mask_whatsapp(lead_data['whatsapp'])
        frequency_label = _FREQUENCY_LABELS.get(
            lead_data['delivery_frequency'], lead_data['delivery_frequency']
        )

        subject = f"[CV Reka Cipta] Konfirmasi Permintaan Penawaran — {lead_data['company_name']}"
        html_body = f"""
        <p>Halo {lead_data['full_name']},</p>
        <p>Terima kasih atas ketertarikan Anda pada produk kami: <strong>{product_names or '-'}</strong>.</p>
        <p>Kami sudah menerima permintaan penawaran Anda dan tim kami akan
        menyiapkan proposal khusus sesuai kebutuhan {lead_data['company_name']}
        ({lead_data['volume_per_month']} ton/{frequency_label},
        pengiriman ke {lead_data['delivery_city']}).</p>
        <p>Tim kami akan menghubungi Anda via WhatsApp di {whatsapp_masked}
        dalam 1×24 jam dengan proposal lengkap.</p>
        <p>Kalau ada pertanyaan mendesak, silakan reply email ini.</p>
        <p>Salam,<br>Tim CV Reka Cipta Indonesia</p>
        """
        try:
            payload: dict[str, Any] = {
                "from": DEFAULT_FROM,
                "to": to_email,
                "subject": subject,
                "html": html_body,
            }
            if reply_to:
                payload["reply_to"] = reply_to
            response = resend.Emails.send(payload)
            logger.info(f"rfq_customer_email_sent: resend_id={response.get('id')}")
            return response
        except Exception as e:
            # Tidak raise (beda dari send_contact_notification) — ini dipanggil
            # via BackgroundTasks bersama send_rfq_admin_notification.
            # BackgroundTasks.__call__ menjalankan task secara sequential dan
            # BERHENTI kalau satu task raise, jadi kalau method ini raise,
            # notifikasi admin (task berikutnya) tidak akan pernah jalan.
            # Ditemukan saat E2E test manual (STOP GATE 1) — Resend API key
            # invalid bikin admin notification ikut tidak terkirim. R-20.
            logger.error(f"rfq_customer_email_failed: {e!r}")
            return None

    @staticmethod
    def send_rfq_admin_notification(
        to_email: str,
        lead_data: dict[str, Any],
        products: list[dict[str, Any]],
    ) -> Optional[dict]:
        """Notifikasi admin ada RFQ baru (E4-CF-BE-03). Fire-and-forget, lihat R-20."""
        product_names = ", ".join(f"{p['code']}" for p in products) or ", ".join(lead_data.get('salt_types', []))
        frequency_label = _FREQUENCY_LABELS.get(
            lead_data['delivery_frequency'], lead_data['delivery_frequency']
        )
        subject = f"RFQ baru dari {lead_data['company_name']}"
        html_body = f"""
        <h2>RFQ baru masuk</h2>
        <p><strong>Perusahaan:</strong> {lead_data['company_name']}</p>
        <p><strong>Kontak:</strong> {lead_data['full_name']} ({lead_data.get('position') or '-'})</p>
        <p><strong>Industri:</strong> {lead_data['industry_type']}</p>
        <p><strong>Produk:</strong> {product_names}</p>
        <p><strong>Volume:</strong> {lead_data['volume_per_month']} ton/{frequency_label}</p>
        <p><strong>Kota Tujuan:</strong> {lead_data['delivery_city']}</p>
        <p><strong>Email:</strong> <a href="mailto:{lead_data['email']}">{lead_data['email']}</a></p>
        <p><strong>WhatsApp:</strong> {lead_data['whatsapp']}</p>
        <p><strong>Catatan:</strong> {lead_data.get('notes') or '-'}</p>
        """
        try:
            response = resend.Emails.send({
                "from": DEFAULT_FROM,
                "to": to_email,
                "subject": subject,
                "html": html_body,
            })
            logger.info(f"rfq_admin_email_sent: resend_id={response.get('id')}")
            return response
        except Exception as e:
            # Tidak raise — lihat catatan di send_rfq_customer_confirmation (R-20).
            logger.error(f"rfq_admin_email_failed: {e!r}")
            return None

    @staticmethod
    def send_proposal_email(
        to_email: str,
        lead_data: dict[str, Any],
        pdf_bytes: bytes,
        pdf_filename: str,
    ) -> dict:
        """Kirim proposal PDF ke customer (E4B-S2-BE-08). Dipanggil dari
        POST /rfq/leads/{id}/send-proposal — RAISE kalau gagal (beda dari
        notifikasi RFQ) karena ini adalah aksi eksplisit admin klik "Kirim",
        bukan fire-and-forget background notification; admin harus tahu
        kalau gagal supaya bisa retry, bukan silent failure."""
        subject = f"Proposal Penawaran Garam Industri — CV Reka Cipta Indonesia untuk {lead_data['company_name']}"
        html_body = f"""
        <p>Halo {lead_data['full_name']},</p>
        <p>Terlampir proposal penawaran garam industri untuk {lead_data['company_name']}
        sesuai kebutuhan yang Anda sampaikan.</p>
        <p>Tim kami siap mendiskusikan detail lebih lanjut — silakan reply email ini
        atau hubungi kami via WhatsApp.</p>
        <p>Salam,<br>Tim CV Reka Cipta Indonesia</p>
        """
        try:
            response = resend.Emails.send({
                "from": DEFAULT_FROM,
                "to": to_email,
                "subject": subject,
                "html": html_body,
                "attachments": [{
                    "filename": pdf_filename,
                    "content": base64.b64encode(pdf_bytes).decode("utf-8"),
                    "content_type": "application/pdf",
                }],
            })
            logger.info(f"proposal_email_sent: resend_id={response.get('id')} to={to_email}")
            return response
        except Exception as e:
            logger.error(f"proposal_email_failed: to={to_email} error={e!r}")
            raise
