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
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from dependencies.auth import get_current_user, require_admin
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
    og_image_path = row.get("og_image_path")
    skip = {"thumbnail_path", "og_image_path"}
    return ArticleAdmin(
        **{k: v for k, v in row.items() if k not in skip},
        thumbnail_url=get_public_storage_url("article-thumbnails", thumbnail_path) if thumbnail_path else None,
        # og_image_url TIDAK di-fallback ke thumbnail di sini. Panel admin
        # perlu tahu bedanya "belum pernah diisi" dan "sama dengan thumbnail"
        # supaya bisa menampilkan placeholder yang benar. Fallback-nya
        # diterapkan di titik pakai (generateMetadata), sama seperti
        # meta_title — lihat catatan di lib/article-mapper.ts.
        og_image_url=get_public_storage_url("article-thumbnails", og_image_path) if og_image_path else None,
    )


def _resolve_published_at(is_published: bool, requested) -> Optional[str]:
    """Kapan artikel BOLEH tampil publik.

    Tiga keadaan yang sengaja dibedakan:
      draf                       -> None  (tidak relevan)
      terbit sekarang            -> now()
      terbit terjadwal           -> waktu yang diminta, dinormalkan ke UTC

    Normalisasi ke UTC itu bukan kosmetik: kolomnya TIMESTAMPTZ dan
    dibandingkan dengan now() di dalam kebijakan RLS. Kalau klien mengirim
    waktu tanpa offset, pydantic menganggapnya naive dan .astimezone()
    akan memakai zona waktu SERVER — di Railway itu UTC, di laptop dev
    bisa WIB. Selisih 7 jam pada penjadwalan artinya artikel terbit
    setengah hari lebih awal atau lebih lambat. Frontend karenanya
    mengirim ISO ber-offset (lihat ArticleForm.tsx).
    """
    if not is_published:
        return None
    if requested is None:
        return datetime.now(timezone.utc).isoformat()
    if requested.tzinfo is None:
        requested = requested.replace(tzinfo=timezone.utc)
    return requested.astimezone(timezone.utc).isoformat()


def _ensure_unique_slug(supabase, slug: str, exclude_id: str | None = None) -> None:
    query = supabase.table("articles").select("id").eq("slug", slug)
    if exclude_id:
        query = query.neq("id", exclude_id)
    result = query.limit(1).execute()
    if result.data:
        raise HTTPException(status_code=409, detail=f"Slug '{slug}' sudah dipakai artikel lain")


@router.post("", response_model=ArticleDetailResponse, dependencies=[Depends(require_admin)])
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
        "meta_title": payload.meta_title,
        "canonical_url": payload.canonical_url,
        "is_published": payload.is_published,
        "published_at": _resolve_published_at(payload.is_published, payload.published_at),
    }

    try:
        result = supabase.table("articles").insert(insert_data).execute()
    except Exception as e:
        logger.error(f"articles_create_failed: {e!r}")
        raise HTTPException(status_code=500, detail="Gagal membuat artikel")

    return ArticleDetailResponse(article=_row_to_article_admin(result.data[0]))


@router.put("/{article_id}", response_model=ArticleDetailResponse, dependencies=[Depends(require_admin)])
async def update_article(article_id: str, payload: ArticleUpdateRequest):
    """[AUTH] Update artikel. TIDAK menyentuh is_published/published_at —
    itu tugas endpoint publish terpisah (lihat toggle_publish_article)."""
    supabase = get_supabase()

    existing = (
        supabase.table("articles")
        .select("id, slug, is_published")
        .eq("id", article_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")

    previous = existing.data[0]
    old_slug = previous["slug"]
    slug = payload.slug.strip()

    if slug != old_slug:
        _ensure_unique_slug(supabase, slug, exclude_id=article_id)
        # Slug baru tidak boleh menabrak slug LAMA milik artikel lain —
        # kalau dibiarkan, redirect 301 akan mengarah ke isi yang salah.
        clash = (
            supabase.table("article_slug_history")
            .select("article_id")
            .eq("old_slug", slug)
            .limit(1)
            .execute()
        )
        if clash.data and clash.data[0]["article_id"] != article_id:
            raise HTTPException(
                status_code=409,
                detail=f"Slug '{slug}' pernah dipakai artikel lain dan masih dialihkan ke sana",
            )

    update_data = {
        "title": payload.title,
        "slug": slug,
        "category": payload.category,
        "content": payload.content,
        "meta_description": payload.meta_description,
        "meta_title": payload.meta_title,
        "canonical_url": payload.canonical_url,
    }

    try:
        result = supabase.table("articles").update(update_data).eq("id", article_id).execute()
    except Exception as e:
        logger.error(f"articles_update_failed: id={article_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Gagal menyimpan perubahan artikel")

    # CP3 — riwayat slug, HANYA untuk artikel yang sudah pernah terbit.
    #
    # Draf sengaja dilewat: belum ada satu pun tautan publik ke sana, jadi
    # mencatat riwayatnya cuma menumpuk baris mati DAN memakan slug lama
    # dari kolom UNIQUE, yang justru menghalangi slug itu dipakai lagi.
    #
    # Kegagalan pencatatan TIDAK membatalkan update. Artikelnya sudah
    # tersimpan; melempar error di sini akan membuat admin mengira
    # simpanannya gagal lalu mencoba lagi. Konsekuensi terburuknya satu
    # tautan lama tidak teralihkan — dicatat sebagai error untuk ditelusuri.
    if slug != old_slug and previous.get("is_published"):
        try:
            supabase.table("article_slug_history").upsert(
                {"article_id": article_id, "old_slug": old_slug},
                on_conflict="old_slug",
            ).execute()
        except Exception as e:
            logger.error(
                f"article_slug_history_write_failed: id={article_id} "
                f"old_slug={old_slug} new_slug={slug} error={e!r}"
            )

    return ArticleDetailResponse(article=_row_to_article_admin(result.data[0]))


@router.patch(
    "/{article_id}/publish",
    response_model=ArticleDetailResponse,
    dependencies=[Depends(require_admin)],
)
async def toggle_publish_article(article_id: str, payload: ArticlePublishRequest):
    """[AUTH] Toggle publish/unpublish. published_at hanya di-set SEKALI
    (first publish) — unpublish lalu publish lagi TIDAK reset tanggal."""
    supabase = get_supabase()

    existing = supabase.table("articles").select("published_at").eq("id", article_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")

    update_data: dict = {"is_published": payload.is_published}
    if payload.published_at is not None:
        # Penjadwalan eksplisit menang atas aturan "set sekali" di bawah.
        update_data["published_at"] = payload.published_at.astimezone(timezone.utc).isoformat()
    elif payload.is_published and not existing.data[0]["published_at"]:
        update_data["published_at"] = datetime.now(timezone.utc).isoformat()

    try:
        result = supabase.table("articles").update(update_data).eq("id", article_id).execute()
    except Exception as e:
        logger.error(f"articles_publish_toggle_failed: id={article_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Gagal mengubah status publish")

    return ArticleDetailResponse(article=_row_to_article_admin(result.data[0]))


@router.delete("/{article_id}", status_code=204, dependencies=[Depends(require_admin)])
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
    dependencies=[Depends(require_admin)],
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
    dependencies=[Depends(require_admin)],
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
