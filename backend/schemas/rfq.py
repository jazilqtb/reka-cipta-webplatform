# backend/schemas/rfq.py
# Epic 4 Customer-Facing (E4-CF-BE-01) — Schemas untuk POST /rfq/submit.
#
# ATURAN (ARCHITECTURE.md §16): setiap perubahan file ini WAJIB
# diikuti update types/api.ts DAN lib/validation/rfq-schema.ts (Zod) —
# tiga enum (industry_type, delivery_frequency) harus match char-per-char
# di ketiga tempat. Lihat R-18 di CLAUDE_CODE_GUIDE_epic4_customer-facing.md.

import re
from datetime import datetime
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


class RFQSubmitRequest(BaseModel):
    """Payload POST /rfq/submit — form Minta Penawaran publik."""
    model_config = ConfigDict(extra='forbid')  # security: reject unknown fields

    full_name: str = Field(min_length=3, max_length=255)
    company_name: str = Field(min_length=1, max_length=255)
    position: str | None = Field(default=None, max_length=100)
    industry_type: str
    salt_types: list[str] = Field(min_length=1)
    volume_per_month: float = Field(gt=0)
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
    created_at: datetime
    updated_at: datetime


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
