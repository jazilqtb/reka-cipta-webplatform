# backend/schemas/product.py
# Epic 3 Slice 1 (E3-S1-BE-01) — Schemas untuk products (katalog produk).
#
# Dipakai oleh:
#   - GET /products         (public, list produk aktif)
#   - GET /products/{slug}  (public, detail by slug)
#
# ATURAN (ARCHITECTURE.md §16): setiap perubahan file ini WAJIB
# diikuti update types/api.ts.
#
# photo_url/lab_doc_url di response ini adalah URL ABSOLUT hasil komputasi
# dari kolom DB photo_path/lab_doc_path (path relatif) + SUPABASE_URL env var.
# Lihat core/storage.py dan ARCHITECTURE.md §12.4 — jangan simpan project ref
# di data.

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class Product(BaseModel):
    """Produk publik — response GET /products dan GET /products/{slug}."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    code: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    specs: dict[str, Any] = Field(default_factory=dict)
    industries: list[str] = Field(default_factory=list)
    category: str  # 'halus' | 'kasar' | 'industri'
    is_sni: bool
    is_active: bool
    sort_order: int
    photo_url: Optional[str] = None
    lab_doc_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ProductListResponse(BaseModel):
    """Response GET /products."""
    products: list[Product]
    total: int


class ProductDetailResponse(BaseModel):
    """Response GET /products/{slug}."""
    product: Product
