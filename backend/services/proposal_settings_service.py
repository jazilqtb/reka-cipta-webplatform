# backend/services/proposal_settings_service.py
# Epic 4B Slice 3A (E4B-S3A-BE-03) — CRUD + rollback untuk proposal_settings.
#
# R-37: get() TIDAK PERNAH raise kalau row DB hilang/corrupt — selalu
# fallback ke ProposalSettings.hardcoded_default() supaya generate-proposal
# tetap jalan walau admin belum pernah save settings atau row-nya rusak.
#
# No module-level cache (R-37) — settings di-load fresh setiap call,
# supaya edit admin langsung efektif di generate berikutnya (< 60 detik
# requirement dari task breakdown, di sini instan karena tanpa cache).

import logging

from supabase import Client

from schemas.proposal_settings import (
    ProposalSettings,
    ProposalSettingsHistoryEntry,
    ProposalSettingsUpdateRequest,
)

logger = logging.getLogger(__name__)


class ProposalSettingsService:
    def __init__(self, supabase: Client):
        self._supabase = supabase

    def get(self) -> ProposalSettings:
        """Load settings dari DB. Fallback ke hardcoded default kalau
        row tidak ada / query gagal (R-37) — tidak pernah raise."""
        try:
            result = (
                self._supabase.table("proposal_settings")
                .select("*")
                .eq("id", 1)
                .limit(1)
                .execute()
            )
            if result.data:
                return ProposalSettings(**result.data[0])
        except Exception as e:
            logger.warning(f"proposal_settings_load_failed_using_default: {e!r}")
        return ProposalSettings.hardcoded_default()

    def update(self, payload: ProposalSettingsUpdateRequest, updated_by: str) -> ProposalSettings:
        """Update row id=1. Trigger DB auto-snapshot row LAMA ke history
        sebelum overwrite (lihat trigger_snapshot_proposal_settings)."""
        try:
            result = (
                self._supabase.table("proposal_settings")
                .update({**payload.model_dump(), "updated_by": updated_by})
                .eq("id", 1)
                .execute()
            )
        except Exception as e:
            logger.error(f"proposal_settings_update_failed: {e!r}")
            raise ValueError("Gagal menyimpan pengaturan proposal") from e

        if not result.data:
            raise ValueError("Gagal menyimpan pengaturan proposal — row id=1 tidak ditemukan")

        logger.info(f"proposal_settings_updated: updated_by={updated_by}")
        return ProposalSettings(**result.data[0])

    def get_history(self, limit: int = 10) -> list[ProposalSettingsHistoryEntry]:
        result = (
            self._supabase.table("proposal_settings_history")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return [ProposalSettingsHistoryEntry(**row) for row in (result.data or [])]

    def rollback(self, history_id: int, updated_by: str) -> ProposalSettings:
        """Restore settings dari 1 snapshot history (R-41 rollback)."""
        result = (
            self._supabase.table("proposal_settings_history")
            .select("snapshot")
            .eq("id", history_id)
            .limit(1)
            .execute()
        )
        if not result.data:
            raise ValueError(f"History entry {history_id} tidak ditemukan")

        snapshot = result.data[0]["snapshot"]
        allowed = set(ProposalSettingsUpdateRequest.model_fields)
        payload = ProposalSettingsUpdateRequest(
            **{k: v for k, v in snapshot.items() if k in allowed}
        )
        return self.update(payload, updated_by)

    def reset_to_default(self, updated_by: str) -> ProposalSettings:
        """Emergency rollback ke hardcoded default (R-41 — tombol wajib
        di UI supaya admin tidak perlu contact developer kalau prompt
        yang mereka edit sampai merusak output)."""
        default = ProposalSettings.hardcoded_default()
        payload = ProposalSettingsUpdateRequest(**default.model_dump())
        return self.update(payload, updated_by)
