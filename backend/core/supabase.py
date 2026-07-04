# backend/core/supabase.py
# Epic 2 Slice 1 (BE-00) — Supabase client untuk FastAPI.
#
# Menggunakan SERVICE ROLE key: FastAPI adalah backend tepercaya.
# RLS di-bypass — keamanan dijaga oleh auth dependency (get_current_user)
# pada setiap endpoint yang melakukan operasi tulis.
# Ref: ARCHITECTURE.md §13 (RLS), §3 (struktur FastAPI)
#
# HTTP/1.1 dipaksa (bukan default http2=True dari postgrest-py):
# ditemukan saat QA Slice 3 — dari jaringan Railway, request ke
# Supabase REST API konsisten gagal dengan httpx.RemoteProtocolError
# (StreamReset) saat pakai HTTP/2. HTTP/1.1 tidak punya masalah ini.

import httpx
from functools import lru_cache
from supabase import create_client, Client, ClientOptions
from core.config import settings  # ← SESUAIKAN jika instance settings Anda bernama lain


@lru_cache()
def get_supabase() -> Client:
    """Singleton Supabase client (service role)."""
    return create_client(
        settings.SUPABASE_URL,          # ← SESUAIKAN nama field jika berbeda
        settings.SUPABASE_SERVICE_KEY,  # ← SESUAIKAN nama field jika berbeda
        options=ClientOptions(httpx_client=httpx.Client(http2=False)),
    )
