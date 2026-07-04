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
