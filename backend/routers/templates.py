# backend/routers/templates.py
# Epic 4B Slice 3B (E4B-S3B-BE-02) — Admin CRUD untuk email confirmation
# template + WA templates per status. Semua endpoint [AUTH] (AR-07).

import logging

from fastapi import APIRouter, Depends, HTTPException

from core.supabase import get_supabase
from dependencies.auth import get_current_user
from schemas.templates import (
    EmailTemplate,
    EmailTemplateUpdateRequest,
    WATemplateSetting,
    WATemplateSettingUpdateRequest,
    WA_STATUS_KEYS,
)
from services.email_templates_service import EmailTemplatesService
from services.wa_templates_service import WATemplatesService

router = APIRouter(prefix="/templates", tags=["templates"])
logger = logging.getLogger(__name__)


# ─── Email templates ─────────────────────────────────────────


@router.get("/email-templates", response_model=list[EmailTemplate])
async def list_email_templates(user: dict = Depends(get_current_user)) -> list[EmailTemplate]:
    """[AUTH] Semua email template (saat ini hanya 'rfq_confirmation')."""
    return EmailTemplatesService(get_supabase()).list_all()


@router.put("/email-templates/{template_type}", response_model=EmailTemplate)
async def update_email_template(
    template_type: str,
    payload: EmailTemplateUpdateRequest,
    user: dict = Depends(get_current_user),
) -> EmailTemplate:
    try:
        return EmailTemplatesService(get_supabase()).update(
            template_type, payload, user.get("sub", "")
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/email-templates/{template_type}/reset-to-default", response_model=EmailTemplate)
async def reset_email_template(
    template_type: str,
    user: dict = Depends(get_current_user),
) -> EmailTemplate:
    try:
        return EmailTemplatesService(get_supabase()).reset_to_default(
            template_type, user.get("sub", "")
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─── WA templates ─────────────────────────────────────────────


@router.get("/wa-templates", response_model=list[WATemplateSetting])
async def list_wa_templates(user: dict = Depends(get_current_user)) -> list[WATemplateSetting]:
    """[AUTH] Semua WA template, 1 per status lead."""
    return WATemplatesService(get_supabase()).list_all()


@router.put("/wa-templates/{status_key}", response_model=WATemplateSetting)
async def update_wa_template(
    status_key: str,
    payload: WATemplateSettingUpdateRequest,
    user: dict = Depends(get_current_user),
) -> WATemplateSetting:
    if status_key not in WA_STATUS_KEYS:
        raise HTTPException(status_code=422, detail=f"Status tidak valid: {status_key}")
    try:
        return WATemplatesService(get_supabase()).update(status_key, payload, user.get("sub", ""))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/wa-templates/{status_key}/reset-to-default", response_model=WATemplateSetting)
async def reset_wa_template(
    status_key: str,
    user: dict = Depends(get_current_user),
) -> WATemplateSetting:
    if status_key not in WA_STATUS_KEYS:
        raise HTTPException(status_code=422, detail=f"Status tidak valid: {status_key}")
    try:
        return WATemplatesService(get_supabase()).reset_to_default(status_key, user.get("sub", ""))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
