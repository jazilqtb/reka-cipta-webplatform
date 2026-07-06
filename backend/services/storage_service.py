# backend/services/storage_service.py
# Epic 3B Slice 2 (E3B-S2-BE-03) — Upload/delete file di Supabase Storage.
#
# Beda dari draft guide: signature di sini bekerja dengan PATH RELATIF
# (bukan URL absolut) — konsisten dengan photo_path/lab_doc_path yang
# sudah disimpan di DB sejak Epic 3 Slice 1 (lihat core/storage.py).
# Tidak perlu parsing URL untuk extract filename — caller (router) sudah
# punya path lama langsung dari row produk.

import logging
from core.supabase import get_supabase

logger = logging.getLogger(__name__)


def upload_to_storage(bucket: str, filename: str, file_bytes: bytes, content_type: str) -> str:
    """Upload file ke Supabase Storage. Return path relatif yang baru (mis. 'pro-yd-1720123456.jpg')."""
    supabase = get_supabase()
    supabase.storage.from_(bucket).upload(
        path=filename,
        file=file_bytes,
        file_options={
            "content-type": content_type,
            "upsert": "true",
        },
    )
    return filename


def delete_from_storage(bucket: str, path: str) -> None:
    """Delete file dari Storage berdasarkan path relatif. Raise on error —
    caller WAJIB bungkus try/except tanpa re-raise (R-17, best-effort cleanup)."""
    supabase = get_supabase()
    supabase.storage.from_(bucket).remove([path])
