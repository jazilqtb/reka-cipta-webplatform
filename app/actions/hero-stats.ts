'use server'

// app/actions/hero-stats.ts — CP3 (2026-08-21)
// Menyimpan BASELINE statistik hero ke company_settings (key/value).

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/** Daftar tertutup. Action ini tidak boleh jadi pintu untuk menulis kunci
 *  company_settings sembarangan — kunci lain di tabel itu mengatur nomor
 *  WhatsApp, alamat, dan pesan otomatis. */
const ALLOWED_KEYS = new Set([
  'salt_types_count',
  'partner_count',
  'cities_served',
  'total_distribution_tons',
])

export async function saveHeroBaselines(
  values: Record<string, string>
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk lagi.' }

  const rows: { key: string; value: string }[] = []
  for (const [key, raw] of Object.entries(values)) {
    if (!ALLOWED_KEYS.has(key)) continue
    const n = Math.trunc(Number(raw))
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, error: `Angka dasar untuk "${key}" harus bilangan bulat tak negatif.` }
    }
    rows.push({ key, value: String(n) })
  }
  if (rows.length === 0) return { ok: false, error: 'Tidak ada angka yang bisa disimpan.' }

  const { error } = await supabase.from('company_settings').upsert(rows, { onConflict: 'key' })
  if (error) {
    console.error('[hero-stats] gagal simpan:', error.message)
    return { ok: false, error: 'Gagal menyimpan angka dasar.' }
  }
  revalidatePath('/')
  return { ok: true }
}
