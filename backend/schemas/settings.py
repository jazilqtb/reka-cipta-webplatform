# backend/schemas/settings.py
# Epic 2 Slice 1 (E2-S1-BE-01) — Schemas untuk company_settings.
#
# Dipakai oleh:
#   - GET  /settings        (Slice 1 — endpoint ini)
#   - PATCH /settings/{key} (Slice 3 — admin update single)
#   - PATCH /settings       (Slice 3 — admin bulk update)
#
# ATURAN (ARCHITECTURE.md §16): setiap perubahan file ini WAJIB
# diikuti update types/api.ts → lihat task E2-S1-CONT-01.

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CompanySettingItem(BaseModel):
    """Satu baris company_settings."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    key: str
    value: str
    label: str
    description: Optional[str] = None
    updated_at: datetime


class CompanySettingsResponse(BaseModel):
    """Response GET /settings — semua settings."""
    data: list[CompanySettingItem]
    count: int


class CompanySettingUpdate(BaseModel):
    """Payload PATCH /settings/{key} — Slice 3."""
    value: str


class CompanySettingsBulkUpdate(BaseModel):
    """Payload PATCH /settings — bulk update, Slice 3."""
    updates: dict[str, str]  # { key: new_value }
