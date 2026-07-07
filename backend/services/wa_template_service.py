# backend/services/wa_template_service.py
# Epic 4B Slice 1 (E4B-S1-BE-06) — Generate template pesan WhatsApp
# berdasarkan status lead. Hardcoded 5 template (AR-05) — editability
# via UI adalah Slice 3 (post-MVP), jangan spec di sini.
#
# Pakai str.format() dengan {placeholder} — kalau nanti template jadi
# editable dari admin UI, ganti ke Jinja2 atau string.Template supaya
# user input tidak bisa inject format-spec yang crash .format().

from typing import Any

WA_TEMPLATES: dict[str, str] = {
    'new': """Halo {full_name},

Terima kasih atas permintaan penawaran dari {company_name}.

Kami sudah menerima detail kebutuhan Anda ({volume} ton/{frequency}). Tim kami sedang menyiapkan proposal khusus dan akan mengirim ke email {email} dalam 1x24 jam.

Kalau ada pertanyaan mendesak, silakan reply pesan ini.

Salam,
Tim CV Reka Cipta Indonesia""",

    'contacted': """Halo {full_name},

Saya {admin_name} dari CV Reka Cipta Indonesia. Terkait permintaan penawaran garam untuk {company_name}, apakah proposal yang kami kirim via email sudah diterima?

Kalau ada pertanyaan atau butuh diskusi lebih lanjut, saya siap membantu.""",

    'sample_sent': """Halo {full_name},

Update pengiriman sampel {product_names} untuk {company_name}:

Nomor resi: [ISI RESI]
Estimasi tiba: [ISI ESTIMASI]

Mohon konfirmasi setelah sampel diterima. Terima kasih.""",

    'negotiation': """Halo {full_name},

Terkait diskusi harga garam untuk kebutuhan {company_name} ({volume} ton/{frequency}), berikut poin penawaran:

- [POIN 1]
- [POIN 2]
- [POIN 3]

Mohon feedback dan kita bisa lanjut ke tahap final. Terima kasih.""",

    'deal': """Halo {full_name},

Terima kasih atas kepercayaan {company_name} untuk bekerja sama dengan CV Reka Cipta Indonesia.

Tim kami akan segera follow up untuk proses order pertama ({volume} ton/{frequency}). Sampai jumpa!""",

    'lost': """Halo {full_name},

Terima kasih atas waktu dan kesempatan diskusi dengan {company_name}. Kami memahami kebutuhan saat ini belum sesuai.

Kalau di kemudian hari {company_name} butuh garam industri lagi, kami siap membantu. Salam sukses.""",
}

_FREQUENCY_LABEL: dict[str, str] = {
    'weekly': 'minggu', 'biweekly': 'dua minggu', 'monthly': 'bulan',
}


def generate_wa_template(lead: dict[str, Any], status: str) -> str:
    """Generate WA template berdasarkan status lead. Fallback ke template
    generic kalau status tidak dikenal (mis. hardcoded dict belum di-update
    saat status baru ditambahkan)."""
    template_str = WA_TEMPLATES.get(
        status,
        "Halo {full_name}, terkait permintaan penawaran {company_name}, mohon informasi lebih lanjut.",
    )

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

    return template_str.format(**context)
