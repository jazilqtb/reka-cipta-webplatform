# backend/core/storage.py
# Epic 3 Slice 1 — helper Supabase Storage public URL.
#
# Tabel yang menyimpan referensi file di bucket public (mis.
# products.photo_path, products.lab_doc_path) hanya menyimpan PATH
# RELATIF, bukan URL absolut — project ref tidak boleh hardcoded di
# data. Full URL selalu dikonstruksi di sini dari SUPABASE_URL env var.
# Ref: ARCHITECTURE.md §12.4.

from core.config import settings


def get_public_storage_url(bucket: str, path: str) -> str:
    """Bangun public URL Supabase Storage dari nama bucket + path relatif."""
    return f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}"
