# backend/prompts/proposal_prompt.py
# Epic 4B Slice 2 (E4B-S2-BE-03) — System prompt + user prompt builder
# untuk Quick Mode proposal generator.
#
# INI ADALAH IP KRITIS (R-36, task breakdown AR-10): quality output
# proposal ditentukan oleh prompt ini, bukan cuma model. Versi di bawah
# adalah v1 (baseline) — WAJIB di-iterate dengan Jazil + 5 real lead data
# (Gate 2) sebelum dianggap production-ready. Jangan skip iterasi itu.
#
# Snapshot versi final harus disalin ke docs/prompts/ setelah sign-off.
#
# Epic 4B Slice 3A (E4B-S3A-BE-03/AR-10 extension): 4 constant di bawah
# adalah SUMBER TUNGGAL untuk prompt v1 — dipakai sebagai:
#   1. ProposalSettings.hardcoded_default() (R-37 fallback kalau row DB
#      proposal_settings hilang/corrupt)
#   2. Isi seed row di migration 20260711100000_create_proposal_settings.sql
#      (harus identik char-per-char dengan konstanta ini)
# Kalau prompt di-iterate lebih lanjut (Gate 2), update text di SINI dulu,
# baru re-seed/update row DB — supaya fallback tetap konsisten dengan versi
# yang sedang dipakai admin di /admin/proposal-settings.

DEFAULT_ROLE = (
    "Anda adalah proposal writer profesional untuk CV Reka Cipta Indonesia, "
    "distributor garam industri dari Surabaya."
)

DEFAULT_TASK = """Tulis proposal penawaran garam industri dalam format HTML valid untuk calon partner yang meng-submit RFQ (Request for Quotation).

STRUKTUR PROPOSAL (5 section, wajib ada semua):
1. <h1>Pembukaan personal — sapa PIC dengan nama, mention perusahaan calon partner
2. <h2>Tentang CV Reka Cipta — 1 paragraf company introduction dari data yang di-provide
3. <h2>Rekomendasi Produk — table atau list produk yang cocok berdasarkan RFQ, include spec teknis dari data produk
4. <h2>Term Penawaran — volume, frekuensi, kota tujuan (sesuai request), pricing placeholder ("Harga akan dikonfirmasi tim sales via WhatsApp")
5. <h2>Penutup — CTA follow-up dalam 1x24 jam via WhatsApp, tanda tangan tim sales"""

DEFAULT_CONSTRAINTS = """- Bahasa Indonesia formal bisnis (avoid slang)
- Tone profesional tapi hangat (bukan robot)
- Panjang: 400-800 kata
- Format HTML valid dengan inline CSS minimal
- JANGAN include informasi harga aktual — sebutkan "akan dikonfirmasi via sales"
- JANGAN mengarang spec produk — hanya pakai data yang di-provide
- JANGAN sertakan email atau WhatsApp Reka Cipta — cukup mention nama Tim Sales"""

DEFAULT_OUTPUT_FORMAT = """STYLING HTML:
Gunakan inline CSS untuk kompatibilitas WeasyPrint:
- Font: 'Liberation Sans', sans-serif
- Heading color: #0B7D6E (brand teal)
- Body text color: #1F2937
- Table borders visible, padding cell 8px
- Section spacing margin-top 24px

OUTPUT:
Return HTML dengan <html><head><style>...</style></head><body>...</body></html> lengkap.
Jangan wrap dengan markdown code block. Return raw HTML."""

# Kept for any caller yang belum migrasi ke ProposalSettings (mis. script
# adhoc) — dibangun dari 4 konstanta di atas supaya tidak pernah drift.
SYSTEM_PROMPT = f"""{DEFAULT_ROLE}

TUGAS:
{DEFAULT_TASK}

CONSTRAINTS:
{DEFAULT_CONSTRAINTS}

{DEFAULT_OUTPUT_FORMAT}
"""

_FREQUENCY_LABEL: dict[str, str] = {
    'weekly': 'minggu', 'biweekly': 'dua minggu', 'monthly': 'bulan',
}


def build_user_prompt(
    lead_data: dict,
    products: list[dict],
    company_settings: dict,
) -> str:
    """Build user prompt dengan context data (lead RFQ + produk terpilih +
    profil perusahaan). Semua data numerik/list di-stringify defensively
    supaya .format-free f-string ini tidak crash kalau field kosong."""
    frequency_label = _FREQUENCY_LABEL.get(lead_data.get('delivery_frequency', ''), 'bulan')

    product_details = "\n".join([
        f"- {p.get('name', '-')} ({p.get('code', '-')}): {p.get('tagline') or '-'}. "
        f"Spec: {p.get('specs') or {}}"
        for p in products
    ]) or "- (tidak ada produk spesifik terpilih — rekomendasikan dari katalog umum)"

    return f"""DATA CALON PARTNER:
- Nama PIC: {lead_data.get('full_name', '-')}
- Jabatan: {lead_data.get('position') or '-'}
- Perusahaan: {lead_data.get('company_name', '-')}
- Industri: {lead_data.get('industry_type', '-')}
- Volume dibutuhkan: {lead_data.get('volume_per_month', 0)} ton/{frequency_label}
- Kota tujuan: {lead_data.get('delivery_city', '-')}
- Catatan tambahan: {lead_data.get('notes') or '-'}

DATA PRODUK YANG DIPILIH:
{product_details}

DATA CV REKA CIPTA:
- Nama lengkap: CV Reka Cipta Indonesia
- Alamat: {company_settings.get('address', 'Surabaya')}
- Jumlah client: {company_settings.get('partner_count', '')} partner aktif
- Kota jangkauan: {company_settings.get('cities_served', '')} kota
- Distribusi total: {company_settings.get('total_distribution_tons', '')} ton

Tulis proposal HTML sesuai instruksi di system prompt.
"""
