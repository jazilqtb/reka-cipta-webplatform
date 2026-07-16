# backend/routers/articles.py
# Epic 6 Admin Slice 1 (E6-ADM-S1-BE-03..06) — Router CRUD artikel admin.
# Epic 6 Admin Slice 2 (E6-ADM-S2-BE-01..03) — Upload thumbnail & gambar
# konten, cleanup storage saat delete.
#
# POST /articles                          → [AUTH] buat artikel baru
# PUT /articles/{id}                       → [AUTH] update artikel (tidak sentuh is_published)
# PATCH /articles/{id}/publish             → [AUTH] toggle publish/unpublish
# DELETE /articles/{id}                    → [AUTH] hapus artikel + cleanup thumbnail (S2)
# POST /articles/upload-content-image      → [AUTH] upload gambar konten editor (S2)
# POST /articles/{id}/upload-thumbnail     → [AUTH] upload cover artikel (S2)
#
# Tidak ada endpoint GET di sini — list (/admin/articles) dan detail-untuk-
# edit (/admin/articles/[id]/edit) fetch langsung dari Supabase di Server
# Component (pola Products Admin, lihat AR-02 task breakdown). FastAPI
# cuma untuk operasi tulis, konsisten pola itu.
#
# Konten sejak Slice 2 datang sebagai HTML mentah dari Tiptap (ProseMirror
# output standar) — dikirim apa adanya, TIDAK disanitasi di write-time.
# Sanitasi ada di render-time publik (sanitizeArticleContent, Epic 6 CF
# Slice 1 AR-05) — HTML dari admin tidak pernah dipercaya blind oleh sisi
# publik terlepas dari siapa yang menulisnya.

import logging
import random
import string
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from dependencies.auth import get_current_user
from core.supabase import get_supabase
from core.storage import get_public_storage_url
from schemas.article import (
    ArticleAdmin,
    ArticleCreateRequest,
    ArticleDetailResponse,
    ArticlePublishRequest,
    ArticleUpdateRequest,
)
from services.storage_service import delete_from_storage, upload_to_storage
from utils.slugify import slugify_title

router = APIRouter(prefix="/articles", tags=["articles"])
logger = logging.getLogger(__name__)

ALLOWED_IMAGE_MIME = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB, konsisten products.py (AR-05 Slice 2)


def _row_to_article_admin(row: dict) -> ArticleAdmin:
    thumbnail_path = row.get("thumbnail_path")
    return ArticleAdmin(
        **{k: v for k, v in row.items() if k != "thumbnail_path"},
        thumbnail_url=get_public_storage_url("article-thumbnails", thumbnail_path) if thumbnail_path else None,
    )


def _ensure_unique_slug(supabase, slug: str, exclude_id: str | None = None) -> None:
    query = supabase.table("articles").select("id").eq("slug", slug)
    if exclude_id:
        query = query.neq("id", exclude_id)
    result = query.limit(1).execute()
    if result.data:
        raise HTTPException(status_code=409, detail=f"Slug '{slug}' sudah dipakai artikel lain")


@router.post("", response_model=ArticleDetailResponse, dependencies=[Depends(get_current_user)])
async def create_article(payload: ArticleCreateRequest):
    """[AUTH] Buat artikel baru. Slug auto dari judul kalau tidak dikirim."""
    supabase = get_supabase()
    slug = payload.slug.strip() if payload.slug else slugify_title(payload.title)
    if not slug:
        raise HTTPException(status_code=422, detail="Slug tidak valid, gunakan judul dengan huruf/angka")

    _ensure_unique_slug(supabase, slug)

    insert_data = {
        "title": payload.title,
        "slug": slug,
        "category": payload.category,
        "content": payload.content,
        "meta_description": payload.meta_description,
        "is_published": payload.is_published,
        "published_at": datetime.now(timezone.utc).isoformat() if payload.is_published else None,
    }

    try:
        result = supabase.table("articles").insert(insert_data).execute()
    except Exception as e:
        logger.error(f"articles_create_failed: {e!r}")
        raise HTTPException(status_code=500, detail="Gagal membuat artikel")

    return ArticleDetailResponse(article=_row_to_article_admin(result.data[0]))


@router.put("/{article_id}", response_model=ArticleDetailResponse, dependencies=[Depends(get_current_user)])
async def update_article(article_id: str, payload: ArticleUpdateRequest):
    """[AUTH] Update artikel. TIDAK menyentuh is_published/published_at —
    itu tugas endpoint publish terpisah (lihat toggle_publish_article)."""
    supabase = get_supabase()

    existing = supabase.table("articles").select("id, slug").eq("id", article_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")

    slug = payload.slug.strip()
    if slug != existing.data[0]["slug"]:
        _ensure_unique_slug(supabase, slug, exclude_id=article_id)

    update_data = {
        "title": payload.title,
        "slug": slug,
        "category": payload.category,
        "content": payload.content,
        "meta_description": payload.meta_description,
    }

    try:
        result = supabase.table("articles").update(update_data).eq("id", article_id).execute()
    except Exception as e:
        logger.error(f"articles_update_failed: id={article_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Gagal menyimpan perubahan artikel")

    return ArticleDetailResponse(article=_row_to_article_admin(result.data[0]))


@router.patch(
    "/{article_id}/publish",
    response_model=ArticleDetailResponse,
    dependencies=[Depends(get_current_user)],
)
async def toggle_publish_article(article_id: str, payload: ArticlePublishRequest):
    """[AUTH] Toggle publish/unpublish. published_at hanya di-set SEKALI
    (first publish) — unpublish lalu publish lagi TIDAK reset tanggal."""
    supabase = get_supabase()

    existing = supabase.table("articles").select("published_at").eq("id", article_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")

    update_data: dict = {"is_published": payload.is_published}
    if payload.is_published and not existing.data[0]["published_at"]:
        update_data["published_at"] = datetime.now(timezone.utc).isoformat()

    try:
        result = supabase.table("articles").update(update_data).eq("id", article_id).execute()
    except Exception as e:
        logger.error(f"articles_publish_toggle_failed: id={article_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Gagal mengubah status publish")

    return ArticleDetailResponse(article=_row_to_article_admin(result.data[0]))


@router.delete("/{article_id}", status_code=204, dependencies=[Depends(get_current_user)])
async def delete_article(article_id: str):
    """[AUTH] Hapus artikel (hard delete — endpoint DELETE pertama di
    codebase ini, lihat AR-03). Cleanup thumbnail storage best-effort
    (R-17, Epic 6 Admin Slice 2 AR-03) — gambar konten tertanam di HTML
    TIDAK ikut dibersihkan (orphan disadari, lihat AR-01 Slice 2)."""
    supabase = get_supabase()

    existing = supabase.table("articles").select("thumbnail_path").eq("id", article_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")

    thumbnail_path = existing.data[0].get("thumbnail_path")

    try:
        supabase.table("articles").delete().eq("id", article_id).execute()
    except Exception as e:
        logger.error(f"articles_delete_failed: id={article_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Gagal menghapus artikel")

    if thumbnail_path:
        try:
            delete_from_storage("article-thumbnails", thumbnail_path)
        except Exception as e:
            logger.warning(f"articles_thumbnail_delete_on_article_delete_failed: path={thumbnail_path} error={e!r}")


@router.post(
    "/upload-content-image",
    dependencies=[Depends(get_current_user)],
)
async def upload_article_content_image(file: UploadFile = File(...)) -> dict:
    """[AUTH] Upload gambar untuk disisipkan di konten editor. TIDAK terikat
    article_id (Epic 6 Admin Slice 2 AR-02) — artikel baru yang belum
    disimpan tetap bisa upload gambar konten. Return { url } untuk disisip
    Tiptap. Deklarasi di atas /{article_id}/upload-thumbnail sebagai
    kebiasaan aman terhadap route-order (konsisten products.py)."""
    if file.content_type not in ALLOWED_IMAGE_MIME:
        raise HTTPException(status_code=422, detail="Format tidak didukung. Pakai JPG, PNG, atau WebP.")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=422, detail="File terlalu besar. Maks 5 MB.")

    ext = ALLOWED_IMAGE_MIME[file.content_type]
    rand_suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=4))
    filename = f"content-{int(time.time())}-{rand_suffix}.{ext}"

    try:
        path = upload_to_storage("article-thumbnails", filename, file_bytes, file.content_type)
    except Exception as e:
        logger.error(f"articles_content_image_upload_failed: error={e!r}")
        raise HTTPException(status_code=500, detail="Gagal mengunggah gambar")

    return {"url": get_public_storage_url("article-thumbnails", path)}


@router.post(
    "/{article_id}/upload-thumbnail",
    response_model=ArticleDetailResponse,
    dependencies=[Depends(get_current_user)],
)
async def upload_article_thumbnail(article_id: str, file: UploadFile = File(...)):
    """[AUTH] Upload/replace thumbnail cover artikel. Validasi MIME + size,
    cleanup file lama best-effort (R-17, pola sama upload_product_photo)."""
    if file.content_type not in ALLOWED_IMAGE_MIME:
        raise HTTPException(status_code=422, detail="Format tidak didukung. Pakai JPG, PNG, atau WebP.")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=422, detail="File terlalu besar. Maks 5 MB.")

    supabase = get_supabase()
    existing = supabase.table("articles").select("*").eq("id", article_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")
    article = existing.data[0]

    ext = ALLOWED_IMAGE_MIME[file.content_type]
    filename = f"{article['slug']}-{int(time.time())}.{ext}"

    try:
        new_path = upload_to_storage("article-thumbnails", filename, file_bytes, file.content_type)
    except Exception as e:
        logger.error(f"articles_thumbnail_upload_failed: id={article_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Gagal mengunggah thumbnail")

    try:
        result = supabase.table("articles").update({"thumbnail_path": new_path}).eq("id", article_id).execute()
    except Exception as e:
        logger.error(f"articles_thumbnail_db_update_failed: id={article_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Thumbnail terunggah, tapi gagal menyimpan referensi artikel")

    old_path = article.get("thumbnail_path")
    if old_path and old_path != new_path:
        try:
            delete_from_storage("article-thumbnails", old_path)
        except Exception as e:
            logger.warning(f"articles_old_thumbnail_delete_failed: path={old_path} error={e!r}")

    return ArticleDetailResponse(article=_row_to_article_admin(result.data[0]))
