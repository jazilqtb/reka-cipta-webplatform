# backend/schemas/proposal_settings.py
# Epic 4B Slice 3A (E4B-S3A-BE-03) — Schemas untuk editable proposal
# prompt + Advanced Mode defaults.
# Epic 4B Slice 3C (E4B-S3C-BE-03) — extended dengan 4 field layout
# (header/footer/logo/warna) — kolom tambahan di tabel yang sama
# (proposal_settings), bukan tabel baru, jadi digabung di 1 model.
#
# ATURAN (ARCHITECTURE.md §16): setiap perubahan file ini WAJIB diikuti
# update types/api.ts.

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

DEFAULT_LAYOUT_PRIMARY_COLOR = "#0B7D6E"  # brand-teal-600 (CLAUDE.md)


class ProposalSettings(BaseModel):
    """4-section prompt (R-40) + Advanced Mode defaults + layout
    customizer (Slice 3C). Row tunggal (id=1) di public.proposal_settings."""

    model_config = ConfigDict(from_attributes=True)

    prompt_role: str = Field(min_length=1)
    prompt_task: str = Field(min_length=1)
    prompt_constraints: str = Field(min_length=1)
    prompt_output_format: str = Field(min_length=1)
    default_temperature: float = Field(ge=0, le=1.5)
    default_max_tokens: int = Field(ge=500, le=8000)
    model_id: str
    layout_header_text: str | None = None
    layout_footer_text: str | None = None
    layout_logo_url: str | None = None
    layout_primary_color: str = DEFAULT_LAYOUT_PRIMARY_COLOR

    def build_full_prompt(self) -> str:
        """Join 4 section jadi 1 system prompt string untuk Anthropic."""
        return (
            f"{self.prompt_role}\n\n"
            f"TUGAS:\n{self.prompt_task}\n\n"
            f"CONSTRAINTS:\n{self.prompt_constraints}\n\n"
            f"{self.prompt_output_format}"
        )

    @classmethod
    def hardcoded_default(cls) -> "ProposalSettings":
        """Fallback kalau row DB tidak ada / corrupt (R-37). Identik
        dengan seed row di migration 20260711100000_create_proposal_settings.sql
        (layout_* default kosong/brand teal — sama seperti kolom DEFAULT)."""
        from prompts.proposal_prompt import (
            DEFAULT_ROLE,
            DEFAULT_TASK,
            DEFAULT_CONSTRAINTS,
            DEFAULT_OUTPUT_FORMAT,
        )

        return cls(
            prompt_role=DEFAULT_ROLE,
            prompt_task=DEFAULT_TASK,
            prompt_constraints=DEFAULT_CONSTRAINTS,
            prompt_output_format=DEFAULT_OUTPUT_FORMAT,
            default_temperature=0.7,
            default_max_tokens=4096,
            model_id="claude-haiku-4-5-20251001",
            layout_header_text=None,
            layout_footer_text=None,
            layout_logo_url=None,
            layout_primary_color=DEFAULT_LAYOUT_PRIMARY_COLOR,
        )


class ProposalSettingsUpdateRequest(BaseModel):
    """Payload PUT /proposal-settings — extra='forbid' supaya field tak
    dikenal (mis. id, updated_at) di-reject 422, bukan silent-dropped."""

    model_config = ConfigDict(extra="forbid")

    prompt_role: str = Field(min_length=1)
    prompt_task: str = Field(min_length=1)
    prompt_constraints: str = Field(min_length=1)
    prompt_output_format: str = Field(min_length=1)
    default_temperature: float = Field(ge=0, le=1.5)
    default_max_tokens: int = Field(ge=500, le=8000)
    layout_header_text: str | None = Field(default=None, max_length=100)
    layout_footer_text: str | None = Field(default=None, max_length=150)
    layout_logo_url: str | None = Field(default=None, max_length=500)
    layout_primary_color: str = Field(default=DEFAULT_LAYOUT_PRIMARY_COLOR, max_length=20)


class ProposalSettingsHistoryEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    snapshot: dict[str, Any]
    created_at: datetime
    created_by: str | None = None


class GenerateProposalRequest(BaseModel):
    """Payload opsional POST /rfq/leads/{id}/generate-proposal (R-38).
    Semua field optional + default None — body kosong/absen = Quick Mode,
    behavior identik Slice 2 (backward compat, R-39)."""

    model_config = ConfigDict(extra="forbid")

    temperature: float | None = Field(default=None, ge=0, le=1.5)
    max_tokens: int | None = Field(default=None, ge=500, le=8000)
    custom_instructions: str | None = Field(default=None, max_length=2000)


class ProposalLayoutPreviewRequest(BaseModel):
    """Payload POST /proposal-settings/layout-preview (Slice 3C, R-43) —
    layout BELUM disimpan, dipakai untuk render 1 PDF sample sebelum
    admin klik save."""

    model_config = ConfigDict(extra="forbid")

    layout_header_text: str | None = Field(default=None, max_length=100)
    layout_footer_text: str | None = Field(default=None, max_length=150)
    layout_logo_url: str | None = Field(default=None, max_length=500)
    layout_primary_color: str = Field(default=DEFAULT_LAYOUT_PRIMARY_COLOR, max_length=20)
