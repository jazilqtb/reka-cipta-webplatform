# backend/schemas/templates.py
# Epic 4B Slice 3B (E4B-S3B-BE-01) — Schemas untuk editable email
# confirmation template (Epic 4 CF) + WA templates per status (Slice 1).
#
# ATURAN (ARCHITECTURE.md §16): setiap perubahan file ini WAJIB diikuti
# update types/api.ts.

from pydantic import BaseModel, ConfigDict, Field

# Sinkron dengan schemas/rfq.py LEAD_STATUSES — single source kalau bisa,
# tapi diduplikasi di sini karena Pydantic Literal butuh definisi statis
# dan kita ingin CHECK constraint DB + validator sama-sama eksplisit.
WA_STATUS_KEYS = {"new", "contacted", "sample_sent", "negotiation", "deal", "lost"}


class EmailTemplate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    template_type: str
    subject: str
    body_html: str
    body_text: str
    available_placeholders: list[str]


class EmailTemplateUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    subject: str = Field(min_length=1, max_length=200)
    body_html: str = Field(min_length=1)
    body_text: str = Field(min_length=1)


class WATemplateSetting(BaseModel):
    """Row public.wa_templates — beda dari schemas.rfq.WATemplateResponse
    (itu hasil rendering untuk 1 lead spesifik; ini raw template admin-editable)."""

    model_config = ConfigDict(from_attributes=True)

    status_key: str
    template_text: str
    available_placeholders: list[str]


class WATemplateSettingUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    template_text: str = Field(min_length=1, max_length=2000)
