# backend/schemas/article.py
# Epic 6 Admin Slice 1 (E6-ADM-S1-BE-02) — Schemas untuk CRUD artikel admin.
#
# ATURAN (ARCHITECTURE.md §16): setiap perubahan file ini WAJIB
# diikuti update types/api.ts.
#
# view_count TIDAK ADA di Create/Update — read-only, hanya berubah lewat
# RPC increment_article_view (public, lihat Epic 6 CF Slice 1 AR-06).
# thumbnail_path TIDAK ADA di Create/Update — diisi eksklusif lewat
# endpoint upload (Epic 6 Admin Slice 2).

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

ARTICLE_CATEGORIES: set[str] = {"education", "company_news"}


class ArticleAdmin(BaseModel):
    """Artikel lengkap untuk tampilan admin (termasuk draft)."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    slug: str
    category: str
    content: str
    thumbnail_url: Optional[str] = None
    meta_description: Optional[str] = None
    view_count: int
    is_published: bool
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ArticleCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=3, max_length=500)
    slug: Optional[str] = Field(default=None, max_length=500)
    category: str
    content: str = Field(min_length=1)
    meta_description: Optional[str] = Field(default=None, max_length=300)
    is_published: bool = False

    @field_validator("category")
    def validate_category(cls, v: str) -> str:
        if v not in ARTICLE_CATEGORIES:
            raise ValueError(f"Invalid category: {v}")
        return v


class ArticleUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=3, max_length=500)
    slug: str = Field(min_length=1, max_length=500)
    category: str
    content: str = Field(min_length=1)
    meta_description: Optional[str] = Field(default=None, max_length=300)

    @field_validator("category")
    def validate_category(cls, v: str) -> str:
        if v not in ARTICLE_CATEGORIES:
            raise ValueError(f"Invalid category: {v}")
        return v


class ArticlePublishRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    is_published: bool


class ArticleDetailResponse(BaseModel):
    article: ArticleAdmin
