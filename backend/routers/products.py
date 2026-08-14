# backend/routers/products.py
# Epic 3 Slice 1 (E3-S1-BE-02) — Router katalog produk.
#
# GET /products                     → public, list produk aktif, sort_order ASC
# GET /products/admin                → [AUTH] list SEMUA produk termasuk nonaktif (Epic 3B S1)
# GET /products/{slug}               → public, detail 1 produk. 404 kalau tidak ada/nonaktif.
# PUT /products/{id}                 → [AUTH] update produk, whitelist enforced (Epic 3B S1)
# POST /products/{id}/upload-photo   → [AUTH] upload foto produk (Epic 3B S2)
# POST /products/{id}/upload-lab-doc → [AUTH] upload PDF lab produk (Epic 3B S2)
#
# Public — TIDAK ada Depends(require_admin). Halaman /produk & /produk/[slug]
# sendiri fetch langsung dari Supabase via anon key (ARCHITECTURE.md §6.6);
# endpoint ini untuk konsumen lain (curl/OpenAPI, future admin/API clients).
#
# PENTING route order: /admin HARUS dideklarasikan SEBELUM /{slug} — FastAPI
# match by declaration order, kalau terbalik "admin" akan diinterpretasi
# sebagai slug value (E3B R-12).

import logging
import time
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from dependencies.auth import get_current_user, require_admin
from core.supabase import get_supabase
from core.storage import get_public_storage_url
from schemas.product import (
    Product,
    ProductAdminListResponse,
    ProductDetailResponse,
    ProductListResponse,
    ProductUpdateRequest,
)
from services.storage_service import delete_from_storage, upload_to_storage

router = APIRouter(prefix="/products", tags=["products"])
logger = logging.getLogger(__name__)

ALLOWED_PHOTO_MIME = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}
MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5 MB

ALLOWED_PDF_MIME = {"application/pdf": "pdf"}
MAX_PDF_SIZE = 10 * 1024 * 1024  # 10 MB


def _slugify_code(code: str) -> str:
    """'PRO YD' -> 'pro-yd', 'SPO/M' -> 'spo-m' — dipakai sebagai prefix filename upload."""
    slug = "".join(c if c.isalnum() else "-" for c in code.lower())
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-")


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


@router.get(
    "/admin",
    response_model=ProductAdminListResponse,
    dependencies=[Depends(require_admin)],
)
async def list_products_admin():
    """[AUTH] List semua produk (termasuk is_active=false), urut sort_order ASC."""
    supabase = get_supabase()
    try:
        result = (
            supabase.table("products")
            .select("*")
            .order("sort_order", desc=False)
            .execute()
        )
    except Exception as e:
        logger.error(f"products_admin_list_failed: {e!r}")
        raise HTTPException(status_code=500, detail="Gagal mengambil data produk")

    products = [_row_to_product(row) for row in result.data]
    active_count = sum(1 for p in products if p.is_active)
    return ProductAdminListResponse(
        products=products,
        total=len(products),
        active_count=active_count,
        inactive_count=len(products) - active_count,
    )


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


@router.put(
    "/{product_id}",
    response_model=ProductDetailResponse,
    dependencies=[Depends(require_admin)],
)
async def update_product(product_id: str, payload: ProductUpdateRequest):
    """[AUTH] Update produk. Whitelist field di-enforce oleh ProductUpdateRequest."""
    supabase = get_supabase()

    try:
        existing = (
            supabase.table("products")
            .select("id")
            .eq("id", product_id)
            .limit(1)
            .execute()
        )
    except Exception as e:
        logger.error(f"products_update_lookup_failed: id={product_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Gagal mengambil data produk")

    if not existing.data:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")

    try:
        result = (
            supabase.table("products")
            .update(payload.model_dump())
            .eq("id", product_id)
            .execute()
        )
    except Exception as e:
        logger.error(f"products_update_failed: id={product_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Gagal menyimpan perubahan produk")

    return ProductDetailResponse(product=_row_to_product(result.data[0]))


async def _fetch_product_row(supabase, product_id: str) -> dict:
    try:
        existing = (
            supabase.table("products")
            .select("*")
            .eq("id", product_id)
            .limit(1)
            .execute()
        )
    except Exception as e:
        logger.error(f"products_upload_lookup_failed: id={product_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Gagal mengambil data produk")

    if not existing.data:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")

    return existing.data[0]


@router.post(
    "/{product_id}/upload-photo",
    response_model=ProductDetailResponse,
    dependencies=[Depends(require_admin)],
)
async def upload_product_photo(product_id: str, file: UploadFile = File(...)):
    """[AUTH] Upload/replace foto produk. Validasi MIME + size, cleanup file lama best-effort (R-17)."""
    if file.content_type not in ALLOWED_PHOTO_MIME:
        raise HTTPException(
            status_code=422,
            detail="Format tidak didukung. Pakai JPG, PNG, atau WebP.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=422, detail="File terlalu besar. Maks 5 MB.")

    supabase = get_supabase()
    product = await _fetch_product_row(supabase, product_id)

    ext = ALLOWED_PHOTO_MIME[file.content_type]
    filename = f"{_slugify_code(product['code'])}-{int(time.time())}.{ext}"

    try:
        new_path = upload_to_storage("product-photos", filename, file_bytes, file.content_type)
    except Exception as e:
        logger.error(f"products_photo_upload_failed: id={product_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Gagal mengunggah foto")

    try:
        result = (
            supabase.table("products")
            .update({"photo_path": new_path})
            .eq("id", product_id)
            .execute()
        )
    except Exception as e:
        logger.error(f"products_photo_db_update_failed: id={product_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Foto terunggah, tapi gagal menyimpan referensi produk")

    old_path = product.get("photo_path")
    if old_path and old_path != new_path:
        try:
            delete_from_storage("product-photos", old_path)
        except Exception as e:
            logger.warning(f"products_old_photo_delete_failed: path={old_path} error={e!r}")

    return ProductDetailResponse(product=_row_to_product(result.data[0]))


@router.post(
    "/{product_id}/upload-lab-doc",
    response_model=ProductDetailResponse,
    dependencies=[Depends(require_admin)],
)
async def upload_product_lab_doc(product_id: str, file: UploadFile = File(...)):
    """[AUTH] Upload/replace PDF hasil uji lab. Validasi MIME + size, cleanup file lama best-effort (R-17)."""
    if file.content_type not in ALLOWED_PDF_MIME:
        raise HTTPException(status_code=422, detail="Format tidak didukung. Pakai PDF.")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_PDF_SIZE:
        raise HTTPException(status_code=422, detail="File terlalu besar. Maks 10 MB.")

    supabase = get_supabase()
    product = await _fetch_product_row(supabase, product_id)

    ext = ALLOWED_PDF_MIME[file.content_type]
    filename = f"lab-{_slugify_code(product['code'])}-{int(time.time())}.{ext}"

    try:
        new_path = upload_to_storage("lab-docs", filename, file_bytes, file.content_type)
    except Exception as e:
        logger.error(f"products_labdoc_upload_failed: id={product_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Gagal mengunggah dokumen")

    try:
        result = (
            supabase.table("products")
            .update({"lab_doc_path": new_path})
            .eq("id", product_id)
            .execute()
        )
    except Exception as e:
        logger.error(f"products_labdoc_db_update_failed: id={product_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Dokumen terunggah, tapi gagal menyimpan referensi produk")

    old_path = product.get("lab_doc_path")
    if old_path and old_path != new_path:
        try:
            delete_from_storage("lab-docs", old_path)
        except Exception as e:
            logger.warning(f"products_old_labdoc_delete_failed: path={old_path} error={e!r}")

    return ProductDetailResponse(product=_row_to_product(result.data[0]))
