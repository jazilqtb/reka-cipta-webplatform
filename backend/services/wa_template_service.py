# backend/services/wa_template_service.py
# Epic 4B Slice 1 (E4B-S1-BE-06) — Generate template pesan WhatsApp
# berdasarkan status lead untuk 1 lead spesifik (dipanggil dari
# POST /rfq/wa-template).
#
# Epic 4B Slice 3B (E4B-S3B-BE-03): rendering dipindah ke
# WATemplatesService (DB-backed, admin-editable di /admin/email-templates
# tab WhatsApp), fallback ke HARDCODED_WA_TEMPLATES (R-37) kalau row DB
# hilang/corrupt. WA_TEMPLATES dict lama (single-brace .format()) sudah
# dihapus dari sini — single source sekarang di wa_templates_service.py
# (double-brace {{placeholder}}, replace literal — lebih aman dari
# .format() untuk template yang admin-editable, lihat catatan di sana).

from typing import Any

from core.supabase import get_supabase
from services.wa_templates_service import WATemplatesService

_FREQUENCY_LABEL: dict[str, str] = {
    'weekly': 'minggu', 'biweekly': 'dua minggu', 'monthly': 'bulan',
}


def generate_wa_template(lead: dict[str, Any], status: str) -> str:
    """Generate WA template untuk 1 lead berdasarkan status. Template
    di-load dari DB (admin-editable), fallback ke hardcoded default
    kalau row tidak ada (R-37) — tidak pernah raise/gagal."""
    frequency_label = _FREQUENCY_LABEL.get(lead.get('delivery_frequency', ''), 'bulan')
    product_names = ", ".join(lead.get('salt_types') or [])

    context = {
        'full_name': lead.get('full_name', ''),
        'company_name': lead.get('company_name', ''),
        'volume': lead.get('volume_per_month', 0),
        'frequency': frequency_label,
        'email': lead.get('email', ''),
        'product_names': product_names,
        'admin_name': '[Nama Admin]',  # Placeholder — admin edit sebelum kirim
    }

    return WATemplatesService(get_supabase()).render(status, context)
