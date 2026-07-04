# backend/schemas/contact.py
# Epic 2 Slice 3 (E2-S3-BE-01) — Schemas untuk POST /contact/send.
#
# ATURAN (ARCHITECTURE.md §16): setiap perubahan file ini WAJIB
# diikuti update types/api.ts → lihat task E2-S3-CONT-01.

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class ContactRequest(BaseModel):
    """Payload POST /contact/send — form kontak publik."""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, pattern=r'^(\+62|62|0)8\d{8,12}$')
    message: str = Field(..., min_length=10, max_length=1000)


class ContactResponse(BaseModel):
    """Response POST /contact/send."""
    success: bool
    message: str
    submitted_at: datetime
