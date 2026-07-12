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


# ==============================================
# Epic 5 Admin — Supplier WA Templates
# ==============================================
#
# Beda dari generate_wa_template di atas: template supplier HARDCODED
# (bukan DB-backed via WATemplatesService) — tidak ada admin-editable UI
# untuk template supplier di scope ini. Kalau nanti dibutuhkan, extend
# wa_templates table + WATemplatesService, jangan duplicate logic di sini.
#
# WARNING: label map ini duplicate dari:
# - backend/services/email_service.py (_SUPPLIER_SALT_TYPES_LABEL)
# - lib/constants/supplier-salt-types.ts
# Kalau ubah, sync manual (ARCHITECTURE.md §16).
_SUPPLIER_SALT_TYPES_LABEL_WA = {
    'kasar_petani': 'Kasar Petani',
    'halus_yodium': 'Halus Yodium',
    'halus_non_yodium': 'Halus Non-Yodium',
    'industri_spo_m': 'Industri (SPO/M)',
    'ghpt': 'GHPT',
}


def _readable_supplier_salt_types(salt_types: list[str]) -> str:
    labels = [_SUPPLIER_SALT_TYPES_LABEL_WA.get(t, t) for t in salt_types]
    return ", ".join(labels)


WA_TEMPLATES_SUPPLIER: dict[str, str] = {
    'new': (
        "Halo {business_name},\n\n"
        "Terima kasih telah mendaftar sebagai calon supplier CV Reka Cipta Indonesia.\n\n"
        "Pendaftaran Anda dari {location_city}, {location_province} untuk supply "
        "{salt_types_readable} sudah kami terima dengan kapasitas {capacity_per_month} "
        "{capacity_unit}/bulan.\n\n"
        "Tim kami akan melakukan verifikasi awal dalam 2-3 hari kerja. Setelah itu, kami akan "
        "menghubungi Anda untuk langkah selanjutnya (permintaan dokumen tambahan dan foto lokasi "
        "produksi).\n\n"
        "Kalau ada pertanyaan, silakan reply pesan ini.\n\n"
        "Salam,\nTim CV Reka Cipta Indonesia"
    ),
    'verified': (
        "Halo {business_name},\n\n"
        "Kami info bahwa data Anda sedang dalam proses verifikasi. Untuk melanjutkan, mohon "
        "kirim:\n\n"
        "1. Foto lokasi produksi garam\n"
        "2. Sample produk (min. 500 gram) untuk quality check\n"
        "3. Copy identitas pemilik usaha\n\n"
        "Alamat kirim sample akan kami info di follow-up berikutnya.\n\n"
        "Estimasi verifikasi selesai: 1-2 minggu setelah dokumen lengkap.\n\n"
        "Salam,\nTim CV Reka Cipta Indonesia"
    ),
    'active': (
        "Halo {business_name},\n\n"
        "Selamat! Anda resmi bergabung sebagai mitra supplier CV Reka Cipta Indonesia.\n\n"
        "Berikut informasi proses pembelian pertama:\n"
        "- Volume order awal: (akan dikonfirmasi tim purchasing)\n"
        "- Sistem pembayaran: (sesuai kesepakatan)\n"
        "- Kontak PIC purchasing: (akan diinfo)\n\n"
        "Tim purchasing kami akan menghubungi dalam 1-2 hari kerja untuk order pertama.\n\n"
        "Terima kasih atas kepercayaan Anda bermitra dengan kami.\n\n"
        "Salam,\nTim CV Reka Cipta Indonesia"
    ),
    # NOTE: status 'inactive' sengaja tidak ada template — frontend
    # tampilkan textarea kosong yang bisa diketik manual (task breakdown AR-04).
}


def generate_supplier_wa_template(supplier: dict, status: str) -> str:
    """Generate WA template string untuk supplier. Return empty string kalau
    status tidak ada template (mis. 'inactive') — frontend handle empty case."""
    template = WA_TEMPLATES_SUPPLIER.get(status)
    if not template:
        return ""

    return template.format(
        business_name=supplier['business_name'],
        location_city=supplier['location_city'],
        location_province=supplier['location_province'],
        salt_types_readable=_readable_supplier_salt_types(supplier['salt_types_available']),
        capacity_per_month=supplier['capacity_per_month'],
        capacity_unit=supplier['capacity_unit'],
    )
