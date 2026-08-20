import os
import logging
import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from core.config import settings
from routers.auth import router as auth_router
from routers.settings import router as settings_router
from routers.contact import router as contact_router
from routers.products import router as products_router
from routers.rfq import router as rfq_router
from routers.proposal_settings import router as proposal_settings_router
from routers.templates import router as templates_router
from routers.supplier import router as supplier_router
from routers.articles import router as articles_router

# ── Logging ──────────────────────────────────────────────────
# Tanpa ini, root logger default level WARNING — logger.info(...)
# di seluruh routers/services (contact_email_sent, settings_updated,
# dst.) tidak akan pernah muncul di Railway logs.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

# ── Sentry ───────────────────────────────────────────────────
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=0.2,
    )

# ── Rate limiter ─────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── App ──────────────────────────────────────────────────────
app = FastAPI(
    title="Reka Cipta API",
    version="0.1.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ─────────────────────────────────────────────────────
# .strip() BUKAN kosmetik. `ALLOWED_ORIGINS` ditulis manusia di dashboard
# Railway, dan "a.com, b.com" (dengan spasi setelah koma) adalah cara paling
# alami menulisnya — persis bentuk yang ada di backend/.env repo ini.
# Tanpa strip, entri kedua menjadi " https://b.com" yang tidak akan pernah
# cocok dengan header Origin mana pun, dan CORS-nya gagal DIAM-DIAM: preflight
# balas 400, browser hanya bilang "network error", server tidak mencatat
# apa-apa yang mencurigakan. Ditemukan saat preflight localhost:3001 ditolak
# padahal origin-nya jelas terdaftar.
allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Routers ──────────────────────────────────────────────────
app.include_router(auth_router, prefix="/api/v1")
app.include_router(settings_router, prefix="/api/v1")
app.include_router(contact_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(rfq_router, prefix="/api/v1")
app.include_router(proposal_settings_router, prefix="/api/v1")
app.include_router(templates_router, prefix="/api/v1")
app.include_router(supplier_router, prefix="/api/v1")
app.include_router(articles_router, prefix="/api/v1")

# ── Rate limit login endpoint ─────────────────────────────────
@app.middleware("http")
async def rate_limit_login(request: Request, call_next):
    return await call_next(request)

# ── Health check ─────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "reka-cipta-api",
        "environment": settings.ENVIRONMENT,
    }


