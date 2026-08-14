import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError
from core.config import settings

logger = logging.getLogger(__name__)
security = HTTPBearer()

# Ditemukan saat QA Slice 3: Supabase project ini pakai JWT Signing Keys
# baru (asymmetric, ES256 + kid) untuk access_token user session —
# BUKAN legacy shared secret (HS256) meski "Legacy JWT Secret" masih
# muncul enabled di dashboard. Verifikasi HARUS lewat JWKS (public key),
# di-cache oleh PyJWKClient, dipilih otomatis berdasarkan `kid` header.
_jwks_client = PyJWKClient(f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json")

# Algoritma yang diizinkan — dibatasi eksplisit (bukan trust langsung ke
# `alg` header token) untuk cegah algorithm-confusion attack.
_ASYMMETRIC_ALGS = {"ES256", "RS256"}


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    FastAPI dependency — verifikasi Supabase JWT.
    Digunakan di semua endpoint yang butuh autentikasi admin.

    Usage:
        @router.get("/protected")
        def protected(user = Depends(get_current_user)):
            return {"user_id": user["sub"]}
    """
    token = credentials.credentials

    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")

        if alg == "HS256":
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        elif alg in _ASYMMETRIC_ALGS:
            signing_key = _jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[alg],
                options={"verify_aud": False},
            )
        else:
            raise InvalidTokenError(f"Algoritma tidak didukung: {alg!r}")

        return payload

    except InvalidTokenError as e:
        try:
            unverified_header = jwt.get_unverified_header(token)
        except Exception:
            unverified_header = "unreadable"
        logger.error(f"jwt_verify_failed: {e!r} header={unverified_header!r}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau sudah expired",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ─────────────────────────────────────────────────────────────────
# CHECKPOINT 1 (2026-08-15) — Otorisasi, bukan sekadar autentikasi.
#
# MASALAH YANG DITUTUP:
# get_current_user() di atas hanya membuktikan "token ini ditandatangani
# Supabase dan belum expired" — TIDAK membuktikan pemiliknya berhak
# masuk admin. Sementara itu backend memakai SERVICE ROLE key
# (core/supabase.py) yang MEM-BYPASS RLS sepenuhnya. Kombinasinya:
# siapa pun yang punya akun Supabase valid bisa memanggil endpoint
# admin dan menembus semua proteksi baris.
# Signup publik terverifikasi AKTIF (GET /auth/v1/settings ->
# disable_signup=false), jadi ini bukan risiko teoretis.
#
# Sumber kebenaran otorisasi = tabel public.admin_users
# (migrasi 20260815090000). Dicek di sini via service-role client,
# jadi tidak bergantung pada RLS maupun custom claim di JWT.
# ─────────────────────────────────────────────────────────────────
def require_admin(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    FastAPI dependency — token valid DAN pemiliknya terdaftar sebagai admin.
    Pakai ini di SEMUA endpoint admin; get_current_user saja tidak cukup.

    Usage:
        @router.post("/admin-only", dependencies=[Depends(require_admin)])
    """
    user_id = current_user.get("sub")
    if not user_id:
        logger.error("require_admin: klaim 'sub' tidak ada di token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid",
        )

    # Import lokal — hindari circular import (core.supabase -> core.config)
    # dan biarkan modul ini tetap bisa di-import saat unit test tanpa
    # koneksi Supabase.
    from core.supabase import get_supabase

    try:
        result = (
            get_supabase()
            .table("admin_users")
            .select("user_id")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
    except Exception as e:
        # Gagal memverifikasi != boleh masuk. Fail CLOSED.
        logger.error(f"require_admin: gagal cek admin_users: {e!r}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Verifikasi otorisasi gagal, coba lagi",
        )

    if not result.data:
        # Sengaja TIDAK membocorkan bahwa akunnya valid tapi bukan admin.
        logger.warning(f"require_admin: akses ditolak untuk sub={user_id[:8]}...")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak",
        )

    return current_user
