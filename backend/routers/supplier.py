# backend/routers/supplier.py
# Epic 5 Customer-Facing (E5-CF-BE-02) — Endpoint publik POST /supplier/register.
#
# Tanpa auth (form pendaftaran supplier publik). Rate limit 5/jam/IP,
# konsisten dengan /rfq/submit (R-49).
#
# TIDAK ada LLM call di sini — insert + 1 email notifikasi admin saja.
#
# Sama seperti rfq.py: get_remote_address dari slowapi HANYA baca
# request.client.host, tidak baca X-Forwarded-For — pakai get_client_ip
# eksplisit supaya rate limit ter-enforce dengan benar di belakang
# proxy Railway.

import logging
import re

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from core.supabase import get_supabase
from dependencies.auth import get_current_user
from schemas.supplier import (
    Supplier,
    SupplierListResponse,
    SupplierRegisterRequest,
    SupplierRegisterResponse,
    SupplierUpdateRequest,
    SupplierWATemplateRequest,
    SupplierWATemplateResponse,
)
from services.email_service import EmailService
from services.wa_template_service import generate_supplier_wa_template

router = APIRouter(prefix="/supplier", tags=["supplier"])
logger = logging.getLogger(__name__)


def get_client_ip(request: Request) -> str:
    """IP klien asli di belakang proxy Railway (X-Forwarded-For),
    fallback ke request.client.host kalau header tidak ada."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=get_client_ip)


@router.post(
    "/register",
    response_model=SupplierRegisterResponse,
    status_code=201,
    summary="Register as supplier (public)",
)
@limiter.limit("5/hour")
async def register_supplier(
    request: Request,
    payload: SupplierRegisterRequest,
) -> SupplierRegisterResponse:
    supabase = get_supabase()

    # Insert blocking — kalau gagal, raise (beda severity dari email
    # notifikasi di bawah, jangan digabung try-except yang sama).
    try:
        result = supabase.table("supplier_registrations").insert(
            payload.model_dump()
        ).execute()
    except Exception as e:
        logger.error(f"supplier_insert_failed: {e!r}")
        raise HTTPException(500, detail="Gagal menyimpan pendaftaran. Silakan coba lagi.")

    if not result.data:
        logger.error("supplier_insert_empty_result")
        raise HTTPException(500, detail="Gagal menyimpan pendaftaran. Silakan coba lagi.")

    supplier = result.data[0]
    supplier_id = supplier["id"]

    logger.info(f"supplier_registered: supplier_id={supplier_id} business={payload.business_name!r}")

    # Email fire-and-forget — data sudah tersimpan, kegagalan kirim
    # email TIDAK boleh membuat submit gagal untuk supplier.
    try:
        EmailService.send_supplier_notification_to_admin(supplier=supplier)
    except Exception as e:
        logger.warning(f"supplier_notification_email_failed: supplier_id={supplier_id} error={e!r}")

    return SupplierRegisterResponse(success=True, supplier_id=supplier_id)


# ── Admin: Supplier Management (Epic 5 Admin) ────────────────
#
# PENTING route order: "" (list) HARUS dideklarasikan SEBELUM
# "/{supplier_id}" — FastAPI match by declaration order, sama trap dengan
# /rfq/leads vs /rfq/leads/{lead_id} (lihat komentar atas file rfq.py).


@router.get(
    "",
    response_model=SupplierListResponse,
    dependencies=[Depends(get_current_user)],
)
async def list_suppliers(
    status: str | None = Query(None),
    search: str | None = Query(None),
) -> SupplierListResponse:
    """[AUTH] List semua supplier registrations, dengan filter opsional."""
    supabase = get_supabase()
    query = supabase.table("supplier_registrations").select("*")

    if status:
        if status not in {'new', 'verified', 'active', 'inactive'}:
            raise HTTPException(422, detail=f"Invalid status: {status}")
        query = query.eq("status", status)

    if search:
        pattern = f"%{search}%"
        query = query.or_(
            f"business_name.ilike.{pattern},"
            f"location_city.ilike.{pattern},"
            f"location_province.ilike.{pattern}"
        )

    try:
        result = query.order("created_at", desc=True).execute()
    except Exception as e:
        logger.error(f"supplier_list_failed: {e!r}")
        raise HTTPException(500, detail="Gagal mengambil data supplier")

    suppliers = [Supplier(**row) for row in result.data]
    return SupplierListResponse(suppliers=suppliers, total=len(suppliers))


@router.get(
    "/{supplier_id}",
    response_model=Supplier,
    dependencies=[Depends(get_current_user)],
)
async def get_supplier_detail(supplier_id: str) -> Supplier:
    """[AUTH] Detail 1 supplier. R-56: tidak ada history — response Supplier
    langsung, bukan wrapper dengan field history."""
    supabase = get_supabase()

    try:
        result = (
            supabase.table("supplier_registrations")
            .select("*").eq("id", supplier_id).limit(1).execute()
        )
    except Exception as e:
        logger.error(f"supplier_detail_failed: supplier_id={supplier_id} error={e!r}")
        raise HTTPException(500, detail="Gagal mengambil data supplier")

    if not result.data:
        raise HTTPException(404, detail="Supplier tidak ditemukan")

    return Supplier(**result.data[0])


@router.patch(
    "/{supplier_id}",
    response_model=Supplier,
    dependencies=[Depends(get_current_user)],
)
async def update_supplier(supplier_id: str, payload: SupplierUpdateRequest) -> Supplier:
    """[AUTH] Update status dan/atau admin_notes. Whitelist di-enforce oleh
    SupplierUpdateRequest (extra='forbid'). R-56: tidak ada trigger history
    DB level — beda dari rfq_leads."""
    supabase = get_supabase()

    update_data = payload.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(422, detail="Tidak ada field untuk diupdate")

    try:
        result = (
            supabase.table("supplier_registrations")
            .update(update_data).eq("id", supplier_id).execute()
        )
    except Exception as e:
        logger.error(f"supplier_update_failed: supplier_id={supplier_id} error={e!r}")
        raise HTTPException(500, detail="Gagal menyimpan perubahan supplier")

    if not result.data:
        raise HTTPException(404, detail="Supplier tidak ditemukan")

    logger.info(f"supplier_updated: supplier_id={supplier_id} fields={list(update_data.keys())}")
    return Supplier(**result.data[0])


@router.post(
    "/wa-template",
    response_model=SupplierWATemplateResponse,
    dependencies=[Depends(get_current_user)],
)
async def generate_supplier_wa_template_endpoint(
    payload: SupplierWATemplateRequest,
) -> SupplierWATemplateResponse:
    """[AUTH] Generate template pesan WA berdasarkan status supplier saat ini.
    Return template="" kalau status tidak punya template (mis. 'inactive') —
    frontend handle empty case, endpoint tidak raise."""
    supabase = get_supabase()

    try:
        result = (
            supabase.table("supplier_registrations")
            .select("*").eq("id", payload.supplier_id).limit(1).execute()
        )
    except Exception as e:
        logger.error(f"supplier_wa_template_lookup_failed: supplier_id={payload.supplier_id} error={e!r}")
        raise HTTPException(500, detail="Gagal mengambil data supplier")

    if not result.data:
        raise HTTPException(404, detail="Supplier tidak ditemukan")

    supplier = result.data[0]
    template = generate_supplier_wa_template(supplier=supplier, status=payload.status)

    # Clean nomor WA untuk wa.me link — supplier.whatsapp sudah normalized
    # +62xxx dari Epic 5 CF (R-47), wa.me expect format tanpa + / spasi.
    whatsapp_clean = re.sub(r'[\s\-+()]', '', supplier['whatsapp'])

    return SupplierWATemplateResponse(template=template, whatsapp_number=whatsapp_clean)
