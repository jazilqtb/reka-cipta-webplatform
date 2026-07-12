# backend/schemas/supplier.py
# Epic 5 Customer-Facing (E5-CF-BE-01) — Schemas untuk POST /supplier/register.
#
# ATURAN (ARCHITECTURE.md §16): setiap perubahan enum di file ini WAJIB
# diikuti update lib/constants/supplier-salt-types.ts DAN
# lib/validation/supplier-schema.ts (Zod) DAN label map di
# services/email_service.py — 4 tempat, sync manual (R-46 di
# CLAUDE_CODE_GUIDE_epic5_cf_supplier-registration.md).

import re
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

SUPPLIER_SALT_TYPES = {
    'kasar_petani',
    'halus_yodium',
    'halus_non_yodium',
    'industri_spo_m',
    'ghpt',
}

CAPACITY_UNITS = {'ton', 'kwintal', 'kg'}


class SupplierRegisterRequest(BaseModel):
    """Payload POST /supplier/register — form Jadi Supplier publik."""
    model_config = ConfigDict(extra='forbid')  # security: reject unknown fields

    business_name: str = Field(min_length=2, max_length=255)
    location_city: str = Field(min_length=1, max_length=100)
    location_province: str = Field(min_length=1, max_length=100)
    salt_types_available: list[str] = Field(min_length=1)
    capacity_per_month: float = Field(gt=0)
    capacity_unit: str
    whatsapp: str = Field(min_length=8, max_length=20)
    email: EmailStr | None = None
    additional_notes: str | None = Field(default=None, max_length=500)

    @field_validator('capacity_unit')
    @classmethod
    def validate_capacity_unit(cls, v: str) -> str:
        if v not in CAPACITY_UNITS:
            raise ValueError(f"Invalid capacity unit: {v}")
        return v

    @field_validator('salt_types_available')
    @classmethod
    def validate_salt_types(cls, v: list[str]) -> list[str]:
        # Dedup + strip, preserve order
        cleaned = [s.strip() for s in v if s.strip()]
        if not cleaned:
            raise ValueError("At least one salt type required")
        invalid = [s for s in cleaned if s not in SUPPLIER_SALT_TYPES]
        if invalid:
            raise ValueError(f"Invalid salt types: {invalid}")
        return list(dict.fromkeys(cleaned))

    @field_validator('whatsapp')
    @classmethod
    def validate_and_normalize_whatsapp(cls, v: str) -> str:
        # Backend authoritative untuk normalisasi (R-47) — frontend Zod
        # cuma validate format, tidak normalize, supaya single source of
        # truth. Accept: 08xxx, +62xxx, 62xxx -> canonical +62xxx.
        cleaned = re.sub(r'[\s\-()]', '', v)
        if not re.match(r'^(\+62|62|0)8\d{7,12}$', cleaned):
            raise ValueError("Invalid WhatsApp number format")
        if cleaned.startswith('0'):
            cleaned = '+62' + cleaned[1:]
        elif cleaned.startswith('62'):
            cleaned = '+' + cleaned
        return cleaned


class SupplierRegisterResponse(BaseModel):
    """Response POST /supplier/register."""
    success: bool
    supplier_id: str
    message: str = "Pendaftaran supplier berhasil"
