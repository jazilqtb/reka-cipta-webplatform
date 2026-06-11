# backend/routers/settings.py
# Epic 2 Slice 1 (E2-S1-BE-02) — Router company_settings.
#
# GET /settings → [AUTH] untuk admin panel (Slice 3).
# Halaman publik TIDAK memakai endpoint ini — mereka fetch
# langsung dari Supabase via anon key (ARCHITECTURE.md §6.6).
#
# PATCH endpoints ditambahkan di Slice 3 (E2-S3-BE-04).

from fastapi import APIRouter, Depends, HTTPException
from dependencies.auth import get_current_user
from core.supabase import get_supabase
from schemas.settings import CompanySettingsResponse, CompanySettingItem

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/", response_model=CompanySettingsResponse)
async def get_all_settings(user=Depends(get_current_user)):
    """
    [AUTH] Ambil semua company_settings, urut by key.
    Dipakai /admin/settings (Slice 3) untuk populate form.
    """
    supabase = get_supabase()
    response = (
        supabase.table("company_settings")
        .select("*")
        .order("key")
        .execute()
    )

    if response.data is None:
        # Catatan: parameter `code` tidak valid di HTTPException —
        # format error {detail, code} dari ARCHITECTURE.md §3 di-handle
        # oleh exception handler global jika ada; di sini cukup detail.
        raise HTTPException(status_code=500, detail="Gagal mengambil data settings")

    return CompanySettingsResponse(
        data=[CompanySettingItem(**row) for row in response.data],
        count=len(response.data),
    )
