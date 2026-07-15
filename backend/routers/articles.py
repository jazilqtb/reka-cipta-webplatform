# backend/routers/articles.py
# Epic 6 Admin Slice 1 (E6-ADM-S1-BE-03..06) — Router CRUD artikel admin.
#
# POST /articles                  → [AUTH] buat artikel baru
# PUT /articles/{id}               → [AUTH] update artikel (tidak sentuh is_published)
# PATCH /articles/{id}/publish     → [AUTH] toggle publish/unpublish
# DELETE /articles/{id}            → [AUTH] hapus artikel
#
# Tidak ada endpoint GET di sini — list (/admin/articles) dan detail-untuk-
# edit (/admin/articles/[id]/edit) fetch langsung dari Supabase di Server
# Component (pola Products Admin, lihat AR-02 task breakdown). FastAPI
# cuma untuk operasi tulis, konsisten pola itu.
#
# Konten dari textarea polos (Slice 1) ditransformasi jadi HTML sederhana
# via _plain_text_to_html — lihat AR-01. Endpoint upload thumbnail/gambar
# konten datang di Epic 6 Admin Slice 2.

import html
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
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
from utils.slugify import slugify_title

router = APIRouter(prefix="/articles", tags=["articles"])
logger = logging.getLogger(__name__)


def _plain_text_to_html(text: str) -> str:
    """Textarea polos (Slice 1, lihat AR-01) -> HTML paragraf sederhana.
    Escape dulu supaya admin tidak bisa inject tag manual dari sini."""
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    escaped = [html.escape(p).replace("\n", "<br>") for p in paragraphs]
    return "".join(f"<p>{p}</p>" for p in escaped)


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
        "content": _plain_text_to_html(payload.content),
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
        "content": _plain_text_to_html(payload.content),
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
    codebase ini, lihat AR-03). Cleanup thumbnail storage: Epic 6 Admin
    Slice 2 (belum ada thumbnail yang bisa diupload di slice ini)."""
    supabase = get_supabase()

    existing = supabase.table("articles").select("id").eq("id", article_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")

    try:
        supabase.table("articles").delete().eq("id", article_id).execute()
    except Exception as e:
        logger.error(f"articles_delete_failed: id={article_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Gagal menghapus artikel")
