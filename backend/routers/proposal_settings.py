# backend/routers/proposal_settings.py
# Epic 4B Slice 3A (E4B-S3A-BE-03) — Admin CRUD untuk proposal prompt +
# Advanced Mode defaults. Semua endpoint [AUTH] — konsisten Epic 4B (AR-07).
# Epic 4B Slice 3C (E4B-S3C-BE-04) — + layout-preview endpoint (R-43).

import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from core.supabase import get_supabase
from dependencies.auth import get_current_user, require_admin
from schemas.proposal_settings import (
    ProposalLayoutPreviewRequest,
    ProposalSettings,
    ProposalSettingsHistoryEntry,
    ProposalSettingsUpdateRequest,
)
from services.pdf_service import apply_layout, html_to_pdf
from services.proposal_settings_service import ProposalSettingsService

router = APIRouter(prefix="/proposal-settings", tags=["proposal-settings"])
logger = logging.getLogger(__name__)

# Fixture proposal untuk layout preview (R-43) — data contoh, BUKAN query
# ke DB/Anthropic. Preview harus instan + gratis, bukan generate ulang.
_LAYOUT_PREVIEW_FIXTURE_HTML = """<html><head><style>
body { font-family: 'Liberation Sans', sans-serif; color: #1F2937; }
h1 { margin-top: 0; }
table { border-collapse: collapse; width: 100%; margin-top: 12px; }
td, th { border: 1px solid #ccc; padding: 8px; text-align: left; }
</style></head><body>
<h1>Proposal Penawaran Garam Industri</h1>
<p>Halo Budi Santoso,</p>
<p>Terima kasih atas permintaan penawaran dari PT Contoh Sejahtera. Berikut proposal contoh untuk
preview layout PDF.</p>
<h2>Tentang CV Reka Cipta Indonesia</h2>
<p>Distributor garam industri terpercaya sejak 2015, melayani 50+ mitra di berbagai kota.</p>
<h2>Rekomendasi Produk</h2>
<table>
  <tr><th>Produk</th><th>Spesifikasi</th></tr>
  <tr><td>Garam Halus Yodium (PRO YD)</td><td>NaCl 97.5%</td></tr>
</table>
<h2>Term Penawaran</h2>
<p>Volume: 50 ton/bulan &middot; Kota tujuan: Surabaya &middot; Harga akan dikonfirmasi tim sales.</p>
<h2>Penutup</h2>
<p>Tim sales kami akan follow up dalam 1x24 jam via WhatsApp.</p>
</body></html>"""


@router.post("/layout-preview")
async def layout_preview(
    payload: ProposalLayoutPreviewRequest,
    user: dict = Depends(require_admin),
) -> Response:
    """[AUTH] R-43: render 1 PDF sample dengan layout BELUM disimpan,
    pakai data fixture (bukan lead/settings DB real) — supaya admin bisa
    preview sebelum klik save tanpa cost/latency tambahan."""
    preview_settings = ProposalSettings(
        # prompt_* tidak dipakai apply_layout() — isi placeholder supaya
        # lolos validasi min_length=1 (irrelevant untuk preview layout).
        prompt_role="-", prompt_task="-", prompt_constraints="-", prompt_output_format="-",
        default_temperature=0.7, default_max_tokens=4096, model_id="preview",
        layout_header_text=payload.layout_header_text,
        layout_footer_text=payload.layout_footer_text,
        layout_logo_url=payload.layout_logo_url,
        layout_primary_color=payload.layout_primary_color,
    )
    html = apply_layout(_LAYOUT_PREVIEW_FIXTURE_HTML, preview_settings)
    try:
        pdf_bytes = html_to_pdf(html)
    except Exception:
        raise HTTPException(status_code=500, detail="Gagal membuat preview PDF")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'inline; filename="layout-preview.pdf"'},
    )


@router.get("", response_model=ProposalSettings)
async def get_settings(user: dict = Depends(require_admin)) -> ProposalSettings:
    """[AUTH] Ambil proposal prompt + Advanced Mode defaults saat ini."""
    return ProposalSettingsService(get_supabase()).get()


@router.put("", response_model=ProposalSettings)
async def update_settings(
    payload: ProposalSettingsUpdateRequest,
    user: dict = Depends(require_admin),
) -> ProposalSettings:
    """[AUTH] Update prompt/Advanced Mode defaults. Versi lama otomatis
    ter-snapshot ke history (trigger DB) sebelum overwrite."""
    try:
        return ProposalSettingsService(get_supabase()).update(payload, user.get("sub", ""))
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", response_model=list[ProposalSettingsHistoryEntry])
async def get_history(user: dict = Depends(require_admin)) -> list[ProposalSettingsHistoryEntry]:
    """[AUTH] 10 snapshot terakhir untuk rollback UI (R-41)."""
    return ProposalSettingsService(get_supabase()).get_history()


@router.post("/rollback/{history_id}", response_model=ProposalSettings)
async def rollback_settings(
    history_id: int,
    user: dict = Depends(require_admin),
) -> ProposalSettings:
    """[AUTH] Restore settings dari 1 snapshot history."""
    try:
        return ProposalSettingsService(get_supabase()).rollback(history_id, user.get("sub", ""))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/reset-to-default", response_model=ProposalSettings)
async def reset_to_default(user: dict = Depends(require_admin)) -> ProposalSettings:
    """[AUTH] Emergency rollback ke hardcoded default (R-41)."""
    try:
        return ProposalSettingsService(get_supabase()).reset_to_default(user.get("sub", ""))
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
