// lib/data/api-log.ts — CP0 ronde 4
//
// Pembacaan catatan permintaan API untuk /admin/log.
//
// Dibaca lewat Server Component + klien Supabase ber-sesi (BUKAN service
// key). Itu disengaja: RLS tabel ini hanya melepas baris kepada
// `public.is_admin()`, dan membacanya dengan kunci istimewa berarti
// menguji jalur yang bukan jalur yang dipakai. Pelajaran ini dibayar dua
// kali di ronde 3 — sekali di CP1 (verifikasi lolos padahal statistik
// publik selalu 0) dan sekali di CP5.

import { createClient } from '@/lib/supabase/server'

export interface ApiLogRow {
  id: number
  occurred_at: string
  method: string
  path: string
  status: number
  duration_ms: number
  failure_reason: string | null
  context: Record<string, unknown> | null
  ip_prefix: string | null
}

export type ApiLogFilter = 'all' | 'failed'

/** Batas baris per tampilan. Halaman ini menjawab "apa yang terjadi
 *  tadi?", bukan "apa yang terjadi bulan lalu" — dan tabel yang menuntut
 *  pagination untuk pertanyaan sesempit itu hanya menambah kerja. */
export const API_LOG_PAGE_SIZE = 100

export async function getApiLog(filter: ApiLogFilter = 'all'): Promise<ApiLogRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from('api_request_log')
    .select('id, occurred_at, method, path, status, duration_ms, failure_reason, context, ip_prefix')
    .order('occurred_at', { ascending: false })
    .limit(API_LOG_PAGE_SIZE)

  if (filter === 'failed') query = query.gte('status', 400)

  const { data, error } = await query
  if (error) {
    console.error('[api-log] gagal membaca api_request_log:', error.message)
    return []
  }
  return (data ?? []) as ApiLogRow[]
}

/** Jumlah kegagalan dalam 24 jam terakhir — angka yang menjawab
 *  "apakah ada yang perlu saya lihat?" tanpa membaca satu baris pun. */
export async function getRecentFailureCount(): Promise<number> {
  const supabase = await createClient()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count, error } = await supabase
    .from('api_request_log')
    .select('id', { count: 'exact', head: true })
    .gte('status', 400)
    .gte('occurred_at', since)

  if (error) {
    console.error('[api-log] gagal menghitung kegagalan:', error.message)
    return 0
  }
  return count ?? 0
}
