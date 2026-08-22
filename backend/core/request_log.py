# backend/core/request_log.py
# CP0 ronde 4 — penulis catatan permintaan API.
#
# PERTANYAAN YANG HARUS BISA DIJAWAB CATATAN INI: "apa yang terjadi tadi?"
# Bukan "berapa p99 latensi endpoint X minggu ini". Itu pertanyaan yang
# butuh alat lain, dan alat itu tidak sebanding untuk 1-2 admin.
#
# ── APA YANG TIDAK PERNAH DICATAT (daftar tertutup) ──────────────
#
#   * Header apa pun. Termasuk Authorization, Cookie, dan API key.
#   * Body permintaan maupun jawaban, mentah atau terpotong.
#   * Nilai environment/konfigurasi apa pun.
#   * Email, nomor telepon, dan nama orang pengirim RFQ.
#   * Alamat IP utuh.
#
# Daftar ini ditegakkan lewat BENTUK, bukan lewat kedisiplinan: fungsi
# `log_request` tidak menerima objek Request sama sekali, jadi tidak ada
# jalan bagi pemanggil untuk menyerahkan sesuatu yang bocor. Yang bisa
# masuk hanyalah field yang disebut satu per satu di tanda tangannya.
#
# ── KENAPA TIDAK SEMUA PERMINTAAN DICATAT ────────────────────────
# CP6 ronde lalu mengukur bahwa biaya panel admin adalah JUMLAH round-trip,
# bukan besar data. Menulis satu baris log untuk tiap GET berarti menambah
# satu round-trip Supabase ke setiap pembacaan — memperbaiki pengamatan
# dengan cara memperlambat hal yang diamati. Jadi yang dicatat hanya:
#
#   1. Semua permintaan yang MENGUBAH sesuatu (POST/PUT/PATCH/DELETE), dan
#   2. Semua jawaban yang GAGAL (status >= 400), apa pun metodenya.
#
# GET yang berhasil tidak dicatat: ia tidak mengubah apa pun dan tidak ada
# yang perlu dijelaskan tentangnya.

from __future__ import annotations

import asyncio
import logging
from typing import Any

from core.supabase import get_supabase

logger = logging.getLogger(__name__)

# Path yang tidak pernah dicatat meski memenuhi syarat di atas.
# `/health` dipanggil terus-menerus oleh Railway; mencatatnya akan
# menenggelamkan segalanya yang lain.
_SKIP_PATHS = {"/health", "/api/v1/auth/refresh"}


def should_log(method: str, path: str, status: int) -> bool:
    if path in _SKIP_PATHS:
        return False
    if method.upper() == "OPTIONS":
        # Preflight CORS. Yang menarik adalah preflight yang DITOLAK,
        # dan itu tertangkap oleh syarat status >= 400 di bawah.
        return status >= 400
    if status >= 400:
        return True
    return method.upper() in {"POST", "PUT", "PATCH", "DELETE"}


def truncate_ip(raw: str | None) -> str | None:
    """IPv4 -> blok /24; IPv6 -> tiga hextet pertama.

    Cukup untuk membedakan "satu orang sepuluh kali" dari "sepuluh orang
    sekali" — yang memang satu-satunya pertanyaan yang pernah kita ajukan
    ke kolom ini — tanpa menyimpan alamat yang menunjuk satu perangkat.
    """
    if not raw:
        return None
    raw = raw.strip()
    if ":" in raw:  # IPv6
        parts = raw.split(":")
        return ":".join(parts[:3]) + "::"
    parts = raw.split(".")
    if len(parts) == 4:
        return ".".join(parts[:3] + ["0"])
    return None


def _write(row: dict[str, Any]) -> None:
    """Tulis satu baris. Kegagalan menulis log TIDAK BOLEH menjatuhkan
    permintaan yang sedang dilayani — catatan adalah pengamat, bukan
    peserta. Kalau gagal, ia mengeluh ke stdout dan berhenti di situ."""
    try:
        get_supabase().table("api_request_log").insert(row).execute()
    except Exception as e:  # noqa: BLE001 — sengaja menelan semuanya
        logger.warning("api_request_log_write_failed: %r", e)


async def log_request(
    *,
    method: str,
    path: str,
    status: int,
    duration_ms: int,
    failure_reason: str | None = None,
    context: dict[str, Any] | None = None,
    client_ip: str | None = None,
) -> None:
    """Catat satu permintaan. Dipanggil SETELAH jawaban terkirim.

    Klien Supabase di proyek ini SINKRON. Memanggilnya langsung dari
    coroutine akan membekukan event loop — kesalahan yang persis ini sudah
    pernah terjadi di CP2 ronde 3 dan membuat satu permintaan melonjak ke
    6,1 detik. Karena itu `asyncio.to_thread`, bukan panggilan langsung.
    """
    if not should_log(method, path, status):
        return

    row: dict[str, Any] = {
        "method": method.upper(),
        "path": path,
        "status": status,
        "duration_ms": duration_ms,
        "failure_reason": failure_reason,
        "context": context or None,
        "ip_prefix": truncate_ip(client_ip),
    }
    await asyncio.to_thread(_write, row)


def set_log_context(request: Any, **fields: Any) -> None:
    """Lampirkan konteks non-pribadi ke permintaan yang sedang dilayani.

    Dipanggil dari endpoint, dibaca oleh middleware di main.py SETELAH
    jawaban terkirim.

    ATURAN ISI — mengikat: hanya nilai yang tidak menunjuk ORANG.
    Nama perusahaan dan jumlah item boleh (itu data usaha, dan justru itu
    yang membuat satu baris log bisa dikenali kembali keesokan harinya).
    Nama orang, email, dan nomor telepon TIDAK — bukan karena tidak
    berguna, melainkan karena catatan operasional bukan tempat data kontak
    pelanggan menumpuk di luar tabel yang memang dirancang untuk itu.
    """
    request.state.log_context = {k: v for k, v in fields.items() if v is not None}
