# backend/routers/products.py
# Epic 3 Slice 1 (E3-S1-BE-02) — Router katalog produk.
#
# GET /products         → public, list produk aktif (is_active=true), sort_order ASC
# GET /products/{slug}  → public, detail 1 produk. 404 kalau slug tidak ada/nonaktif.
#
# Public — TIDAK ada Depends(get_current_user). Halaman /produk & /produk/[slug]
# sendiri fetch langsung dari Supabase via anon key (ARCHITECTURE.md §6.6);
# endpoint ini untuk konsumen lain (curl/OpenAPI, future admin/API clients).

import logging
from fastapi import APIRouter, HTTPException
from core.supabase import get_supabase
from core.storage import get_public_storage_url
from schemas.product import Product, ProductDetailResponse, ProductListResponse

router = APIRouter(prefix="/products", tags=["products"])
logger = logging.getLogger(__name__)


def _row_to_product(row: dict) -> Product:
    """Map row DB (photo_path/lab_doc_path) ke Product (photo_url/lab_doc_url)."""
    photo_path = row.get("photo_path")
    lab_doc_path = row.get("lab_doc_path")
    return Product(
        **row,
        photo_url=get_public_storage_url("product-photos", photo_path) if photo_path else None,
        lab_doc_url=get_public_storage_url("lab-docs", lab_doc_path) if lab_doc_path else None,
    )


@router.get("/", response_model=ProductListResponse)
async def list_products():
    """Public. List produk aktif, urut sort_order ASC."""
    supabase = get_supabase()
    try:
        result = (
            supabase.table("products")
            .select("*")
            .eq("is_active", True)
            .order("sort_order", desc=False)
            .execute()
        )
    except Exception as e:
        logger.error(f"products_list_failed: {e!r}")
        raise HTTPException(status_code=500, detail="Gagal mengambil data produk")

    products = [_row_to_product(row) for row in result.data]
    return ProductListResponse(products=products, total=len(products))


@router.get("/{slug}", response_model=ProductDetailResponse)
async def get_product_by_slug(slug: str):
    """Public. Detail 1 produk by slug. 404 kalau tidak ditemukan/nonaktif."""
    supabase = get_supabase()
    try:
        result = (
            supabase.table("products")
            .select("*")
            .eq("slug", slug)
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
    except Exception as e:
        logger.error(f"products_detail_failed: slug={slug} error={e!r}")
        raise HTTPException(status_code=500, detail="Gagal mengambil data produk")

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail=f"Produk dengan slug '{slug}' tidak ditemukan",
        )

    return ProductDetailResponse(product=_row_to_product(result.data[0]))
