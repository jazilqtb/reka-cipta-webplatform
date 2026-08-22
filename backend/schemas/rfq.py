# backend/schemas/rfq.py
# Epic 4 Customer-Facing (E4-CF-BE-01) — Schemas untuk POST /rfq/submit.
#
# ATURAN (ARCHITECTURE.md §16): setiap perubahan file ini WAJIB
# diikuti update types/api.ts DAN lib/validation/rfq-schema.ts (Zod) —
# tiga enum (industry_type, delivery_frequency) harus match char-per-char
# di ketiga tempat. Lihat R-18 di CLAUDE_CODE_GUIDE_epic4_customer-facing.md.

import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

INDUSTRY_TYPES = {
    'makanan-minuman', 'farmasi', 'kimia', 'peternakan',
    'tekstil', 'pengolahan-ikan', 'lainnya',
}

DELIVERY_FREQUENCIES = {'weekly', 'biweekly', 'monthly'}

# Single source of truth untuk lead status — dipakai RFQLeadUpdateRequest
# validator DAN lead_status_history CHECK constraint (migration). Kalau
# ubah salah satu, ubah juga yang lain (E4B-S1 R-tambahan: hindari drift).
LEAD_STATUSES = {
    'new', 'contacted', 'sample_sent',
    'negotiation', 'deal', 'lost',
}


class RFQItemIn(BaseModel):
    """Satu jenis garam dengan volume & satuannya sendiri (CP2 poin 1A/1B).

    Sebelum ini form hanya mengirim SATU `volume_per_month` untuk SEMUA
    jenis yang dicentang — angka gabungan yang tidak bisa dipecah kembali,
    sehingga mustahil menjawab "berapa ton garam halus yang diminta bulan
    ini". Sekarang tiap jenis membawa angkanya sendiri.
    """
    model_config = ConfigDict(extra='forbid')

    product_slug: str = Field(min_length=1, max_length=120)
    quantity: float = Field(gt=0)
    # Kontainer TIDAK ada dalam daftar: bobotnya berubah menurut jenis garam
    # dan cara muat, jadi konversinya ke satuan kanonik akan selalu tebakan.
    unit: Literal['kg', 'ton', 'sak_25', 'sak_50']


class RFQSubmitRequest(BaseModel):
    """Payload POST /rfq/submit — form Minta Penawaran publik."""
    model_config = ConfigDict(extra='forbid')  # security: reject unknown fields

    full_name: str = Field(min_length=3, max_length=255)
    company_name: str = Field(min_length=1, max_length=255)
    position: str | None = Field(default=None, max_length=100)
    industry_type: str
    salt_types: list[str] = Field(min_length=1)
    # DIPERTAHANKAN selama fase transisi: kolom ini masih ditulis ke
    # `rfq_leads` supaya struktur lama tetap utuh dan bisa dibaca kode lama.
    # Nilainya kini dihitung frontend sebagai TOTAL dari items (dalam ton),
    # bukan angka yang diketik pengguna.
    volume_per_month: float = Field(gt=0)
    # Sumber kebenaran yang baru. Opsional supaya klien lama (kalau ada
    # yang belum diperbarui) tidak langsung ditolak — kalau kosong, RFQ
    # tetap tersimpan, hanya tanpa rincian per jenis.
    items: list[RFQItemIn] | None = Field(default=None)
    delivery_frequency: str
    delivery_city: str = Field(min_length=1, max_length=100)
    email: EmailStr
    whatsapp: str = Field(min_length=8, max_length=20)
    notes: str | None = Field(default=None, max_length=500)

    @field_validator('industry_type')
    @classmethod
    def validate_industry(cls, v: str) -> str:
        if v not in INDUSTRY_TYPES:
            raise ValueError(f"Invalid industry type: {v}")
        return v

    @field_validator('delivery_frequency')
    @classmethod
    def validate_frequency(cls, v: str) -> str:
        if v not in DELIVERY_FREQUENCIES:
            raise ValueError(f"Invalid frequency: {v}")
        return v

    @field_validator('whatsapp')
    @classmethod
    def validate_whatsapp(cls, v: str) -> str:
        # Accept: 08xxx, +62xxx, 62xxx
        cleaned = re.sub(r'[\s\-()]', '', v)
        if not re.match(r'^(\+62|62|0)8\d{7,12}$', cleaned):
            raise ValueError("Invalid WhatsApp number format")
        return cleaned

    @field_validator('salt_types')
    @classmethod
    def validate_salt_types(cls, v: list[str]) -> list[str]:
        # Dedup + strip, preserve order
        cleaned = [s.strip() for s in v if s.strip()]
        if not cleaned:
            raise ValueError("At least one salt type required")
        return list(dict.fromkeys(cleaned))


class RFQSubmitResponse(BaseModel):
    """Response POST /rfq/submit."""
    success: bool
    lead_id: str
    message: str = "RFQ berhasil disubmit"


# === Epic 4B Slice 1: Admin CRM Pipeline (E4B-S1-BE-01) ===
# Mirror dari sini ke types/api.ts — jaga sinkron (ARCHITECTURE.md §16).


class LeadStatusHistory(BaseModel):
    """Row lead_status_history — auto-populated oleh DB trigger, read-only."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    lead_id: str
    from_status: str | None
    to_status: str
    changed_at: datetime


class RFQLead(BaseModel):
    """Full lead data untuk admin (Kanban card + detail page)."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    company_name: str
    position: str | None
    industry_type: str
    salt_types: list[str]
    volume_per_month: float
    delivery_frequency: str
    delivery_city: str
    email: str
    whatsapp: str
    notes: str | None
    admin_notes: str | None
    status: str
    proposal_html: str | None
    proposal_generated: bool
    proposal_generated_at: datetime | None
    proposal_sent_at: datetime | None
    created_at: datetime
    updated_at: datetime
    # CP1 ronde 4 — NULL = aktif. Terisi = disembunyikan dari daftar DAN
    # dari seluruh perhitungan statistik.
    archived_at: datetime | None = None
    archived_reason: str | None = None


class RFQLeadUpdateRequest(BaseModel):
    """Whitelist untuk PATCH /rfq/leads/{id} — hanya status dan admin_notes.

    extra='forbid' (bukan 'ignore') supaya request dengan field lain
    (mis. email, proposal_html) di-reject 422, bukan silent-dropped —
    ini defense-in-depth kalau frontend punya bug kirim field ekstra.
    """
    model_config = ConfigDict(extra='forbid')

    status: str | None = None
    admin_notes: str | None = None

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in LEAD_STATUSES:
            raise ValueError(f"Invalid status: {v}")
        return v


class RFQLeadListResponse(BaseModel):
    leads: list[RFQLead]
    total: int
    # CP1 ronde 4 — jumlah lead yang diarsipkan, SELALU disertakan apa pun
    # daftar yang sedang diminta.
    #
    # Dikirim bersama daftar, BUKAN lewat permintaan kedua. Versi pertama
    # saya membiarkan frontend memanggil `?archived=true` sendiri hanya
    # untuk mengisi satu angka di chip — satu round-trip browser -> Railway
    # -> Supabase penuh (terukur ~1 detik dari mesin ini) ditambahkan ke
    # SETIAP pembukaan halaman leads, demi angka yang jarang dilihat.
    # Itu persis pola yang dibongkar CP6 ronde lalu. Di sini ia cuma satu
    # query tambahan di sisi server, pada koneksi yang sudah terbuka.
    archived_count: int = 0


class RFQLeadDetailResponse(BaseModel):
    lead: RFQLead
    history: list[LeadStatusHistory]


class WATemplateRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    lead_id: str
    status: str


class WATemplateResponse(BaseModel):
    template: str
    whatsapp_number: str  # cleaned untuk wa.me link


class LeadArchiveRequest(BaseModel):
    """Payload POST /rfq/leads/{id}/archive.

    Alasan bersifat opsional dan sengaja begitu: memaksa mengetik alasan
    untuk membuang lead uji bernama "wergew" hanya menghasilkan alasan
    asal-asalan, dan alasan asal-asalan lebih buruk daripada kolom kosong —
    ia membuat kolom itu berhenti dipercaya.
    """
    model_config = ConfigDict(extra='forbid')

    reason: str | None = Field(default=None, max_length=200)
