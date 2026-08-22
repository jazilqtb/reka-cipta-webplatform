import os
import logging
import time
import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from core.config import settings
from core.request_log import log_request
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
logger = logging.getLogger(__name__)

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

# ── Origin LAN untuk pengembangan ─────────────────────────────
# GEJALA YANG DITUTUP: membuka /admin dari HP lewat IP jaringan lokal
# (http://192.168.x.x:3000) membuat halaman melapor "gagal memuat, periksa
# koneksi", padahal dari desktop lewat localhost normal. Penyebabnya BUKAN
# koneksi: origin IP LAN tidak pernah terdaftar di ALLOWED_ORIGINS,
# sementara localhost terdaftar, jadi preflight ditolak dan browser hanya
# melaporkan "network error" tanpa menyebut CORS.
# Terverifikasi sebelum perubahan ini: OPTIONS dari http://192.168.0.113:3000
# -> 400, dari http://localhost:3001 -> 200.
#
# Regex ini HANYA aktif di luar produksi. Di produksi nilainya None, jadi
# satu-satunya yang berlaku adalah daftar eksplisit di ALLOWED_ORIGINS —
# tidak ada pelonggaran, apalagi wildcard.
#
# Cakupannya sengaja dibatasi ke tiga blok alamat privat RFC 1918 plus
# loopback. Alamat privat tidak bisa dirutekan dari internet, jadi origin
# yang cocok dengan pola ini pasti berasal dari jaringan yang sama dengan
# mesin pengembangan.
_LAN_ORIGIN_REGEX = (
    r"^http://("
    r"localhost"
    r"|127\.\d{1,3}\.\d{1,3}\.\d{1,3}"
    r"|10\.\d{1,3}\.\d{1,3}\.\d{1,3}"
    r"|192\.168\.\d{1,3}\.\d{1,3}"
    r"|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}"
    r")(:\d{1,5})?$"
)
lan_origin_regex = None if settings.ENVIRONMENT == "production" else _LAN_ORIGIN_REGEX

if lan_origin_regex:
    logger.info("CORS: origin LAN privat diizinkan (ENVIRONMENT=%s)", settings.ENVIRONMENT)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=lan_origin_regex,
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


# ── Catatan permintaan API (CP0 ronde 4) ──────────────────────
# Menjawab satu pertanyaan: "apa yang terjadi tadi?". Sebelum ini,
# kegagalan submit RFQ tidak meninggalkan jejak apa pun yang bisa dibuka
# Jazil — jadi kegagalan yang tidak muncul di layar juga tidak muncul di
# mana pun. Baca hasilnya di /admin/log.
#
# Apa yang TIDAK dicatat, dan kenapa bentuknya menjamin itu: lihat
# core/request_log.py. Middleware ini sengaja hanya menyerahkan lima nilai
# skalar — ia tidak pernah menyerahkan objek Request maupun body.
@app.middleware("http")
async def record_api_request(request: Request, call_next):
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception as exc:
        # Exception yang lolos sampai sini = 500 yang belum tercatat di mana
        # pun kecuali stack trace. Justru inilah kejadian yang paling perlu
        # terlihat, jadi ia dicatat SEBELUM dilempar ulang.
        duration_ms = int((time.perf_counter() - started) * 1000)
        await log_request(
            method=request.method,
            path=request.url.path,
            status=500,
            duration_ms=duration_ms,
            # Nama kelasnya saja. Pesan exception bisa memuat potongan data
            # yang sedang diproses; nama kelas tidak pernah bisa.
            failure_reason=f"unhandled:{type(exc).__name__}",
            client_ip=_client_ip_of(request),
        )
        raise

    duration_ms = int((time.perf_counter() - started) * 1000)
    failure_reason = None
    if response.status_code >= 400:
        # Sebab dalam kalimat pendek, diturunkan dari STATUS — bukan dari
        # body jawaban, yang bisa memuat data pengirim.
        failure_reason = _reason_for_status(response.status_code)

    await log_request(
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        duration_ms=duration_ms,
        failure_reason=failure_reason,
        # Konteks OPT-IN: endpoint yang punya sesuatu yang layak dikenali
        # menaruhnya sendiri lewat `set_log_context(request, ...)`. Defaultnya
        # kosong — tidak ada mekanisme yang bisa "kebetulan" menyalin body ke
        # sini, karena middleware ini tidak pernah membaca body sama sekali.
        context=getattr(request.state, "log_context", None),
        client_ip=_client_ip_of(request),
    )
    return response


def _client_ip_of(request: Request) -> str | None:
    """IP asli di belakang proxy Railway. Dipotong ke /24 di request_log."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


_STATUS_REASONS = {
    400: "permintaan tidak dapat diproses",
    401: "belum masuk / sesi kedaluwarsa",
    403: "tidak berwenang",
    404: "alamat tidak ditemukan",
    405: "metode tidak diizinkan",
    408: "waktu habis",
    409: "bentrok dengan data yang sudah ada",
    413: "kiriman terlalu besar",
    422: "isi permintaan ditolak validasi",
    429: "melewati batas laju",
    500: "kesalahan di server",
    502: "gerbang salah",
    503: "layanan sedang tidak tersedia",
    504: "gerbang kehabisan waktu",
}


def _reason_for_status(status: int) -> str:
    return _STATUS_REASONS.get(status, f"HTTP {status}")

# ── Health check ─────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "reka-cipta-api",
        "environment": settings.ENVIRONMENT,
    }


