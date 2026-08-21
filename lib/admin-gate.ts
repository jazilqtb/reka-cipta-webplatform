// lib/admin-gate.ts
// CP6 ronde 3 — memangkas satu round-trip dari SETIAP navigasi admin.
//
// ANGKANYA DULU, baru keputusannya. Diukur pada koneksi keep-alive hangat
// ke Supabase, median dari 10 percobaan:
//
//   auth.getUser()                 112 ms
//   SELECT dari admin_users        162 ms   <- yang ditangani berkas ini
//   query data halaman             157 ms
//   ------------------------------------
//   rantai BERURUTAN               432 ms   (cocok dengan TTFB terukur)
//
// Jadi 162 ms — 38% dari waktu tunggu tiap halaman admin — habis untuk
// menanyakan ulang "apakah orang ini admin?" pada setiap perpindahan
// halaman, untuk tabel berisi SATU baris yang praktis tidak pernah berubah.
// Sebagai perbandingan: seluruh basis data situs ini berisi ~84 baris.
// Masalahnya bukan besarnya data, melainkan jumlah perjalanan bolak-balik.
//
// KENAPA MENYIMPAN HASIL PEMERIKSAAN OTORISASI DI SINI TIDAK BERBAHAYA:
// gerbang di app/admin/layout.tsx adalah lapisan RENDER, dan itu sudah
// dinyatakan di komentarnya sendiri sejak Checkpoint 1. Lapisan DATA
// dijaga terpisah oleh RLS (public.is_admin()) dan require_admin di
// FastAPI. Cache ini karena itu hanya bisa memperlambat pencabutan akses
// ke RANGKA halaman — bukan ke datanya. Admin yang dicabut lewat
// admin_users tetap melihat menu selama <= TTL, tapi setiap tabel yang
// dibukanya kembali kosong karena RLS menolaknya di sisi database.
//
// TTL sengaja pendek dan cache-nya per-instance (bukan Redis, bukan Data
// Cache Vercel): tidak ada ketergantungan baru yang dipasang diam-diam,
// dan sebuah deploy ulang mengosongkannya seketika.
//
// BATAS YANG DINYATAKAN JUJUR: pada serverless, cache ini hidup selama
// instance-nya hangat. Cold start = meleset = biaya 162 ms seperti semula.
// Ia memperbaiki kasus umum (admin yang sedang berpindah-pindah halaman),
// bukan setiap permintaan.

import type { SupabaseClient } from '@supabase/supabase-js'

const TTL_MS = 60_000

const cache = new Map<string, { allowed: boolean; expires: number }>()

/** Apakah user ini ada di allowlist admin_users?
 *
 *  Gagal TERTUTUP: kalau query-nya error, jawabannya false dan hasilnya
 *  TIDAK disimpan — supaya gangguan jaringan sesaat tidak terkunci selama
 *  satu menit penuh untuk admin yang sah. */
export async function isAllowlistedAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const hit = cache.get(userId)
  if (hit && hit.expires > Date.now()) return hit.allowed

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    cache.delete(userId)
    return false
  }

  const allowed = Boolean(data)
  cache.set(userId, { allowed, expires: Date.now() + TTL_MS })

  // Penjaga kebocoran memori: Map ini tidak pernah menyusut sendiri, dan
  // kunci yang kedaluwarsa tidak akan pernah ditanya lagi kalau user-nya
  // berhenti memakai panel. Jumlah admin situs ini 1-2 orang, jadi ini
  // pencegahan, bukan kebutuhan — tapi Map tak berbatas di modul yang
  // hidup selama proses adalah cara klasik menumbuhkan memori diam-diam.
  if (cache.size > 100) {
    const now = Date.now()
    for (const [k, v] of cache) if (v.expires <= now) cache.delete(k)
  }

  return allowed
}

// TIDAK ADA fungsi invalidasi di sini, dan itu disengaja: tidak ada satu
// pun jalur kode di aplikasi ini yang menulis ke admin_users — allowlist
// diubah lewat SQL langsung. Mengekspor fungsi pembersih cache yang tidak
// pernah dipanggil hanya akan tampak seperti pencabutan sudah ditangani.
// Yang benar: pencabutan berlaku paling lambat TTL_MS setelah barisnya
// dihapus, dan akses DATA-nya sudah hilang seketika lewat RLS.
