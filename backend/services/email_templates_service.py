# backend/services/email_templates_service.py
# Epic 4B Slice 3B (E4B-S3B-BE-02) — CRUD + render untuk email_templates.
#
# R-37: get() tidak pernah raise — fallback ke hardcoded default (identik
# dengan konten asli EmailService.send_rfq_customer_confirmation sebelum
# Slice 3B, dan identik dengan seed row di migration
# 20260711110000_create_email_wa_templates.sql) kalau row DB hilang/corrupt.

import logging

from supabase import Client

from schemas.templates import EmailTemplate, EmailTemplateUpdateRequest

logger = logging.getLogger(__name__)

_RFQ_CONFIRMATION_DEFAULT = EmailTemplate(
    template_type="rfq_confirmation",
    subject="[CV Reka Cipta] Konfirmasi Permintaan Penawaran — {{company_name}}",
    body_html=(
        "<p>Halo {{full_name}},</p>\n"
        "<p>Terima kasih atas ketertarikan Anda pada produk kami: <strong>{{product_names}}</strong>.</p>\n"
        "<p>Kami sudah menerima permintaan penawaran Anda dan tim kami akan menyiapkan proposal "
        "khusus sesuai kebutuhan {{company_name}} ({{volume_per_month}} ton/{{frequency_label}}, "
        "pengiriman ke {{delivery_city}}).</p>\n"
        "<p>Tim kami akan menghubungi Anda via WhatsApp di {{whatsapp_masked}} dalam 1×24 jam "
        "dengan proposal lengkap.</p>\n"
        "<p>Kalau ada pertanyaan mendesak, silakan reply email ini.</p>\n"
        "<p>Salam,<br>Tim CV Reka Cipta Indonesia</p>"
    ),
    body_text=(
        "Halo {{full_name}},\n\n"
        "Terima kasih atas ketertarikan Anda pada produk kami: {{product_names}}.\n\n"
        "Kami sudah menerima permintaan penawaran Anda dan tim kami akan menyiapkan proposal "
        "khusus sesuai kebutuhan {{company_name}} ({{volume_per_month}} ton/{{frequency_label}}, "
        "pengiriman ke {{delivery_city}}).\n\n"
        "Tim kami akan menghubungi Anda via WhatsApp di {{whatsapp_masked}} dalam 1x24 jam "
        "dengan proposal lengkap.\n\n"
        "Kalau ada pertanyaan mendesak, silakan reply email ini.\n\n"
        "Salam,\nTim CV Reka Cipta Indonesia"
    ),
    available_placeholders=[
        "{{full_name}}", "{{product_names}}", "{{company_name}}",
        "{{volume_per_month}}", "{{frequency_label}}", "{{delivery_city}}",
        "{{whatsapp_masked}}",
    ],
)

_HARDCODED_DEFAULTS: dict[str, EmailTemplate] = {
    "rfq_confirmation": _RFQ_CONFIRMATION_DEFAULT,
}


class EmailTemplatesService:
    def __init__(self, supabase: Client):
        self._supabase = supabase

    def get(self, template_type: str) -> EmailTemplate:
        """Load 1 template dari DB. Fallback ke hardcoded default kalau
        row tidak ada / query gagal (R-37)."""
        try:
            result = (
                self._supabase.table("email_templates")
                .select("*")
                .eq("template_type", template_type)
                .limit(1)
                .execute()
            )
            if result.data:
                return EmailTemplate(**result.data[0])
        except Exception as e:
            logger.warning(f"email_template_load_failed_using_default: type={template_type} error={e!r}")

        default = _HARDCODED_DEFAULTS.get(template_type)
        if default is None:
            raise ValueError(f"Tidak ada default untuk template_type={template_type!r}")
        return default

    def list_all(self) -> list[EmailTemplate]:
        try:
            result = self._supabase.table("email_templates").select("*").order("template_type").execute()
            if result.data:
                return [EmailTemplate(**row) for row in result.data]
        except Exception as e:
            logger.warning(f"email_templates_list_failed_using_defaults: {e!r}")
        return list(_HARDCODED_DEFAULTS.values())

    def update(self, template_type: str, payload: EmailTemplateUpdateRequest, updated_by: str) -> EmailTemplate:
        try:
            result = (
                self._supabase.table("email_templates")
                .update({**payload.model_dump(), "updated_by": updated_by})
                .eq("template_type", template_type)
                .execute()
            )
        except Exception as e:
            logger.error(f"email_template_update_failed: type={template_type} error={e!r}")
            raise ValueError("Gagal menyimpan template email") from e

        if not result.data:
            raise ValueError(f"Template '{template_type}' tidak ditemukan")

        logger.info(f"email_template_updated: type={template_type} updated_by={updated_by}")
        return EmailTemplate(**result.data[0])

    def reset_to_default(self, template_type: str, updated_by: str) -> EmailTemplate:
        default = _HARDCODED_DEFAULTS.get(template_type)
        if default is None:
            raise ValueError(f"Tidak ada default untuk template_type={template_type!r}")
        payload = EmailTemplateUpdateRequest(
            subject=default.subject, body_html=default.body_html, body_text=default.body_text
        )
        return self.update(template_type, payload, updated_by)

    def render(self, template_type: str, context: dict[str, str]) -> tuple[str, str, str]:
        """Return (subject, body_html, body_text) dengan {{placeholder}}
        di-replace literal string (BUKAN .format() — lihat catatan
        keamanan di migration 20260711110000)."""
        tmpl = self.get(template_type)
        return (
            _replace_placeholders(tmpl.subject, context),
            _replace_placeholders(tmpl.body_html, context),
            _replace_placeholders(tmpl.body_text, context),
        )


def _replace_placeholders(text: str, context: dict[str, str]) -> str:
    for key, value in context.items():
        text = text.replace(f"{{{{{key}}}}}", str(value))
    return text
