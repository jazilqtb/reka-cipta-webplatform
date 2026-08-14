# backend/routers/settings.py
# Epic 2 Slice 1 (E2-S1-BE-02) — Router company_settings.
#
# GET /settings → [AUTH] untuk admin panel (Slice 3).
# Halaman publik TIDAK memakai endpoint ini — mereka fetch
# langsung dari Supabase via anon key (ARCHITECTURE.md §6.6).
#
# PATCH / ditambahkan di Slice 3 (E2-S3-BE-04).

import logging
from fastapi import APIRouter, Depends, HTTPException
from dependencies.auth import get_current_user, require_admin
from core.supabase import get_supabase
from schemas.settings import (
    CompanySettingsResponse,
    CompanySettingItem,
    CompanySettingsBulkUpdate,
)

router = APIRouter(prefix="/settings", tags=["settings"])
logger = logging.getLogger(__name__)

# Hanya key ini yang boleh diubah dari /admin/settings. Sisanya
# (partner_count, cities_served, dst.) akan di-manage otomatis dari
# CRM di Epic 4 — mencegah admin panel ini merusak data statistik.
EDITABLE_KEYS = {
    "whatsapp_1",
    "whatsapp_2",
    "email",
    "address",
    "gmaps_embed_url",
    "wa_default_message",
}


@router.get("/", response_model=CompanySettingsResponse)
async def get_all_settings(user=Depends(require_admin)):
    """
    [AUTH] Ambil semua company_settings, urut by key.
    Dipakai /admin/settings (Slice 3) untuk populate form.
    """
    supabase = get_supabase()
    try:
        response = (
            supabase.table("company_settings")
            .select("*")
            .order("key")
            .execute()
        )
    except Exception as e:
        logger.error(f"settings_fetch_failed: {e!r}")
        raise HTTPException(status_code=500, detail="Gagal mengambil data settings")

    if response.data is None:
        # Catatan: parameter `code` tidak valid di HTTPException —
        # format error {detail, code} dari ARCHITECTURE.md §3 di-handle
        # oleh exception handler global jika ada; di sini cukup detail.
        raise HTTPException(status_code=500, detail="Gagal mengambil data settings")

    return CompanySettingsResponse(
        data=[CompanySettingItem(**row) for row in response.data],
        count=len(response.data),
    )


@router.patch("/", response_model=CompanySettingsResponse)
async def update_settings(
    payload: CompanySettingsBulkUpdate,
    current_user: dict = Depends(require_admin),
):
    """
    [AUTH] Update satu atau lebih field di company_settings.
    Payload: { updates: { key: value, ... } }
    Hanya key di EDITABLE_KEYS yang boleh diupdate — mencegah admin
    accidentally atau intentionally mengubah field statistik yang
    di-manage dari CRM (Epic 4).
    """
    invalid_keys = [key for key in payload.updates if key not in EDITABLE_KEYS]
    if invalid_keys:
        raise HTTPException(
            status_code=422,
            detail=f"Field berikut tidak boleh diubah dari panel: {', '.join(invalid_keys)}",
        )

    supabase = get_supabase()

    # Update per row — Supabase Python SDK tidak native support batch
    # update via satu statement dengan multiple WHERE.
    for key, value in payload.updates.items():
        try:
            result = (
                supabase.table("company_settings")
                .update({"value": value})
                .eq("key", key)
                .execute()
            )
            if not result.data:
                raise HTTPException(status_code=404, detail=f"Key '{key}' tidak ditemukan di database.")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"settings_update_failed: key={key} error={e!r}")
            raise HTTPException(status_code=500, detail=f"Gagal update key '{key}'.")

    logger.info(
        f"settings_updated: user_id={current_user.get('sub')} keys={list(payload.updates.keys())}"
    )

    # Return semua settings terbaru (biar frontend refresh state)
    try:
        all_settings = supabase.table("company_settings").select("*").order("key").execute()
    except Exception as e:
        logger.error(f"settings_refetch_failed: {e!r}")
        raise HTTPException(status_code=500, detail="Perubahan tersimpan, tapi gagal memuat ulang data terbaru.")

    return CompanySettingsResponse(
        data=[CompanySettingItem(**row) for row in all_settings.data],
        count=len(all_settings.data),
    )
