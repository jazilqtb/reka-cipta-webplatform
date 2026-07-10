# backend/services/wa_templates_service.py
# Epic 4B Slice 3B (E4B-S3B-BE-02) — CRUD untuk wa_templates (admin-editable
# versi dari WA_TEMPLATES dict di wa_template_service.py Slice 1).
#
# R-37: get() tidak pernah raise — fallback ke WA_TEMPLATES hardcoded
# (single source dipindah ke sini; wa_template_service.py Slice 1 import
# balik dari sini supaya tidak ada 2 salinan berbeda).

import logging

from supabase import Client

from schemas.templates import WA_STATUS_KEYS, WATemplateSetting, WATemplateSettingUpdateRequest

logger = logging.getLogger(__name__)

# Dipindah dari backend/services/wa_template_service.py (Slice 1) —
# {name} diganti {{name}} karena render() di sini pakai literal string
# replace, bukan .format() (lihat catatan keamanan di migration
# 20260711110000_create_email_wa_templates.sql).
HARDCODED_WA_TEMPLATES: dict[str, str] = {
    "new": (
        "Halo {{full_name}},\n\n"
        "Terima kasih atas permintaan penawaran dari {{company_name}}.\n\n"
        "Kami sudah menerima detail kebutuhan Anda ({{volume}} ton/{{frequency}}). Tim kami sedang "
        "menyiapkan proposal khusus dan akan mengirim ke email {{email}} dalam 1x24 jam.\n\n"
        "Kalau ada pertanyaan mendesak, silakan reply pesan ini.\n\n"
        "Salam,\nTim CV Reka Cipta Indonesia"
    ),
    "contacted": (
        "Halo {{full_name}},\n\n"
        "Saya {{admin_name}} dari CV Reka Cipta Indonesia. Terkait permintaan penawaran garam "
        "untuk {{company_name}}, apakah proposal yang kami kirim via email sudah diterima?\n\n"
        "Kalau ada pertanyaan atau butuh diskusi lebih lanjut, saya siap membantu."
    ),
    "sample_sent": (
        "Halo {{full_name}},\n\n"
        "Update pengiriman sampel {{product_names}} untuk {{company_name}}:\n\n"
        "Nomor resi: [ISI RESI]\nEstimasi tiba: [ISI ESTIMASI]\n\n"
        "Mohon konfirmasi setelah sampel diterima. Terima kasih."
    ),
    "negotiation": (
        "Halo {{full_name}},\n\n"
        "Terkait diskusi harga garam untuk kebutuhan {{company_name}} ({{volume}} ton/{{frequency}}), "
        "berikut poin penawaran:\n\n- [POIN 1]\n- [POIN 2]\n- [POIN 3]\n\n"
        "Mohon feedback dan kita bisa lanjut ke tahap final. Terima kasih."
    ),
    "deal": (
        "Halo {{full_name}},\n\n"
        "Terima kasih atas kepercayaan {{company_name}} untuk bekerja sama dengan CV Reka Cipta "
        "Indonesia.\n\nTim kami akan segera follow up untuk proses order pertama ({{volume}} "
        "ton/{{frequency}}). Sampai jumpa!"
    ),
    "lost": (
        "Halo {{full_name}},\n\n"
        "Terima kasih atas waktu dan kesempatan diskusi dengan {{company_name}}. Kami memahami "
        "kebutuhan saat ini belum sesuai.\n\nKalau di kemudian hari {{company_name}} butuh garam "
        "industri lagi, kami siap membantu. Salam sukses."
    ),
}

_FALLBACK_TEMPLATE = (
    "Halo {{full_name}}, terkait permintaan penawaran {{company_name}}, mohon informasi lebih lanjut."
)


class WATemplatesService:
    def __init__(self, supabase: Client):
        self._supabase = supabase

    def get(self, status_key: str) -> WATemplateSetting:
        """Load 1 template dari DB. Fallback ke HARDCODED_WA_TEMPLATES
        kalau row tidak ada / query gagal (R-37)."""
        try:
            result = (
                self._supabase.table("wa_templates")
                .select("*")
                .eq("status_key", status_key)
                .limit(1)
                .execute()
            )
            if result.data:
                return WATemplateSetting(**result.data[0])
        except Exception as e:
            logger.warning(f"wa_template_load_failed_using_default: status={status_key} error={e!r}")

        return WATemplateSetting(
            status_key=status_key,
            template_text=HARDCODED_WA_TEMPLATES.get(status_key, _FALLBACK_TEMPLATE),
            available_placeholders=["{{full_name}}", "{{company_name}}"],
        )

    def list_all(self) -> list[WATemplateSetting]:
        try:
            result = self._supabase.table("wa_templates").select("*").order("status_key").execute()
            if result.data:
                return [WATemplateSetting(**row) for row in result.data]
        except Exception as e:
            logger.warning(f"wa_templates_list_failed_using_defaults: {e!r}")
        return [self.get(status) for status in sorted(WA_STATUS_KEYS)]

    def update(
        self, status_key: str, payload: WATemplateSettingUpdateRequest, updated_by: str
    ) -> WATemplateSetting:
        try:
            result = (
                self._supabase.table("wa_templates")
                .update({"template_text": payload.template_text, "updated_by": updated_by})
                .eq("status_key", status_key)
                .execute()
            )
        except Exception as e:
            logger.error(f"wa_template_update_failed: status={status_key} error={e!r}")
            raise ValueError("Gagal menyimpan template WhatsApp") from e

        if not result.data:
            raise ValueError(f"Template status '{status_key}' tidak ditemukan")

        logger.info(f"wa_template_updated: status={status_key} updated_by={updated_by}")
        return WATemplateSetting(**result.data[0])

    def reset_to_default(self, status_key: str, updated_by: str) -> WATemplateSetting:
        default_text = HARDCODED_WA_TEMPLATES.get(status_key, _FALLBACK_TEMPLATE)
        payload = WATemplateSettingUpdateRequest(template_text=default_text)
        return self.update(status_key, payload, updated_by)

    def render(self, status_key: str, context: dict[str, str]) -> str:
        """Return template_text dengan {{placeholder}} di-replace literal
        string (BUKAN .format())."""
        tmpl = self.get(status_key)
        text = tmpl.template_text
        for key, value in context.items():
            text = text.replace(f"{{{{{key}}}}}", str(value))
        return text
