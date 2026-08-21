"""CRM: menempatkan RFQ masuk ke dalam Company -> Contact -> RFQ.

CP1 ronde 3. Sebelum ini, form publik menulis satu baris ke `rfq_leads` dan
selesai — sehingga PT yang sama mengirim tiga kali menghasilkan tiga entitas
terpisah. Modul ini menaruh tiap RFQ di bawah perusahaan yang sudah ada bila
ditemukan, dan membuat yang baru bila tidak.

BATAS YANG TIDAK DILANGGAR: modul ini boleh MENYAMBUNGKAN RFQ ke perusahaan
yang sudah ada, tapi TIDAK PERNAH menggabungkan dua perusahaan yang sudah
terlanjur terpisah. Penggabungan selalu keputusan manusia — lihat
public.merge_companies() dan antarmuka duplikat di panel admin.
"""

from __future__ import annotations

import logging
import re

logger = logging.getLogger(__name__)

# Faktor konversi ke KILOGRAM — satuan kanonik.
# Kontainer SENGAJA tidak ada: bobotnya berubah menurut jenis garam dan cara
# muat, jadi memberinya angka tetap menghasilkan konversi yang terlihat pasti
# tapi salah. Lebih baik tidak menawarkan satuan itu sama sekali daripada
# menyimpan angka yang diam-diam keliru dan ikut terjumlah di laporan.
UNIT_TO_KG: dict[str, float] = {
    "kg": 1.0,
    "ton": 1000.0,
    "sak_25": 25.0,
    "sak_50": 50.0,
}

_FREE_EMAIL_DOMAINS = {
    "gmail.com", "yahoo.com", "yahoo.co.id", "hotmail.com", "outlook.com",
    "outlook.co.id", "icloud.com", "proton.me", "protonmail.com", "aol.com",
    "mail.com", "ymail.com", "live.com", "msn.com", "gmx.com",
}

_LEGAL_FORMS = r"(^|\s)(pt|cv|ud|pd|tbk|persero|perseroan|koperasi|kop|yayasan|fa)\.?(\s|$)"


def normalize_company_name(raw: str | None) -> str | None:
    """Cerminan Python dari public.normalize_company_name().

    Sengaja diduplikasi: pencocokan dilakukan lewat query ke kolom
    ter-generate di database, tapi fungsi ini dipakai untuk menyusun
    query-nya. Kalau keduanya berselisih, pencocokan gagal diam-diam —
    jadi definisi keduanya harus dijaga tetap sama.
    """
    s = (raw or "").strip().lower()
    if not s:
        return None
    s = re.sub(_LEGAL_FORMS, " ", s)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s or None


def work_email_domain(email: str | None) -> str | None:
    """Domain email HANYA kalau bukan penyedia gratis.

    Dua orang ber-@gmail.com bukan bukti satu perusahaan. Tanpa penjagaan
    ini, seluruh lead yang memakai gmail akan berkumpul menjadi satu
    "perusahaan" raksasa — dan data yang ada sekarang justru didominasi
    alamat gmail.
    """
    parts = (email or "").strip().lower().split("@")
    if len(parts) != 2 or not parts[1]:
        return None
    return None if parts[1] in _FREE_EMAIL_DOMAINS else parts[1]


def normalize_phone_id(raw: str | None) -> str | None:
    digits = re.sub(r"\D", "", raw or "")
    if not digits:
        return None
    if digits.startswith("62"):
        digits = "0" + digits[2:]
    return digits or None


def to_kg(quantity: float, unit: str) -> float | None:
    factor = UNIT_TO_KG.get(unit)
    return None if factor is None else round(quantity * factor, 3)


def resolve_company(supabase, company_name: str, email: str, city: str | None,
                    industry: str | None) -> str:
    """Cari perusahaan yang cocok, atau buat baru. Kembalikan id-nya.

    Urutan sinyal SENGAJA dari yang terkuat: domain email kerja lebih dapat
    dipercaya daripada nama, karena nama diketik ulang tiap kali dan ejaannya
    berubah-ubah sementara domain tidak.
    """
    domain = work_email_domain(email)
    name_key = normalize_company_name(company_name)

    if domain:
        try:
            hit = (supabase.table("companies").select("id")
                   .eq("email_domain", domain).is_("merged_into_id", "null")
                   .limit(1).execute())
            if hit.data:
                return hit.data[0]["id"]
        except Exception as e:
            logger.warning("company_lookup_by_domain_failed: %r", e)

    if name_key:
        try:
            hit = (supabase.table("companies").select("id")
                   .eq("name_key", name_key).is_("merged_into_id", "null")
                   .limit(1).execute())
            if hit.data:
                return hit.data[0]["id"]
        except Exception as e:
            logger.warning("company_lookup_by_name_failed: %r", e)

    created = supabase.table("companies").insert({
        "name": company_name,
        "email_domain": domain,
        "industry_type": industry,
        "city": city,
    }).execute()
    return created.data[0]["id"]


def resolve_contact(supabase, company_id: str, full_name: str, position: str | None,
                    email: str, phone: str) -> str | None:
    """Satu kontak per (perusahaan, email). Orang yang sama mengirim dua RFQ
    tidak boleh menjadi dua kontak."""
    email_key = (email or "").strip().lower()
    try:
        hit = (supabase.table("contacts").select("id")
               .eq("company_id", company_id).eq("email_key", email_key)
               .limit(1).execute())
        if hit.data:
            return hit.data[0]["id"]
    except Exception as e:
        logger.warning("contact_lookup_failed: %r", e)

    try:
        created = supabase.table("contacts").insert({
            "company_id": company_id,
            "full_name": full_name,
            "position": position,
            "email": email,
            "phone": phone,
        }).execute()
        return created.data[0]["id"]
    except Exception as e:
        logger.error("contact_insert_failed: %r", e)
        return None


def create_rfq_with_items(supabase, *, company_id: str, contact_id: str | None,
                          legacy_lead_id: str | None, delivery_city: str,
                          delivery_frequency: str, notes: str | None,
                          items: list[dict]) -> str | None:
    """Buat RFQ + itemnya. `items` = [{product_slug, quantity, unit}].

    Kalau ini gagal, form publik TIDAK boleh ikut gagal: baris di
    `rfq_leads` sudah tersimpan dan permintaan pelanggan sudah aman. Yang
    hilang hanya penempatannya di struktur CRM, dan itu bisa diperbaiki
    belakangan lewat migrasi ulang yang idempoten.
    """
    try:
        rfq = supabase.table("rfqs").insert({
            "company_id": company_id,
            "contact_id": contact_id,
            "legacy_lead_id": legacy_lead_id,
            "status": "new",
            "delivery_city": delivery_city,
            "delivery_frequency": delivery_frequency,
            "notes": notes,
        }).execute()
        rfq_id = rfq.data[0]["id"]
    except Exception as e:
        logger.error("rfq_insert_failed: %r", e)
        return None

    rows = []
    for it in items:
        qty = it.get("quantity")
        unit = it.get("unit")
        rows.append({
            "rfq_id": rfq_id,
            "product_slug": it["product_slug"],
            "quantity": qty,
            "unit": unit,
            "quantity_kg": to_kg(qty, unit) if qty is not None and unit else None,
        })
    if rows:
        try:
            supabase.table("rfq_items").insert(rows).execute()
        except Exception as e:
            logger.error("rfq_items_insert_failed: rfq_id=%s error=%r", rfq_id, e)

    return rfq_id
