from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from supabase import create_client
from schemas.auth import (
    LoginRequest, AuthResponse, UserProfile,
    LogoutResponse, ApiError
)
from dependencies.auth import get_current_user
from core.config import settings

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


def get_supabase():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/minute")
def login(request: Request, body: LoginRequest):
    """
    Login admin. Rate limited 5x/menit per IP.
    Error selalu generik — tidak membedakan email vs password salah.
    """
    supabase = get_supabase()

    try:
        response = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kredensial tidak valid. Silakan coba lagi.",
        )

    if not response.session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kredensial tidak valid. Silakan coba lagi.",
        )

    return AuthResponse(
        access_token=response.session.access_token,
        token_type="bearer",
        user=UserProfile(
            id=str(response.user.id),
            email=response.user.email,
            created_at=str(response.user.created_at),
        ),
    )


@router.post("/logout", response_model=LogoutResponse)
def logout(current_user: dict = Depends(get_current_user)):
    """Logout — invalidate session. Butuh Bearer token."""
    return LogoutResponse(message="Logout berhasil.")


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    """Return user info dari JWT. Verifikasi session aktif."""
    return {
        "id": current_user.get("sub"),
        "email": current_user.get("email"),
        "role": current_user.get("role", "authenticated"),
    }
