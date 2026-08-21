'use server'

// app/actions/about.ts — CP4 (2026-08-21)
// CRUD konten Tentang Kami: timeline, misi, tim, visi.
//
// SATU MODUL untuk tiga tabel karena ketiganya berbagi bentuk yang sama
// persis: daftar terurut, milik admin, dibaca publik. Menulis tiga modul
// yang hampir identik hanya memindahkan biaya ke ronde berikutnya.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Result = { ok: boolean; error?: string }

/** Daftar tabel yang boleh disentuh action ini. Tanpa penjaga ini, satu
 *  parameter dari klien bisa mengarahkan operasi ke tabel mana pun yang
 *  bisa diakses sesi tersebut. */
const TABLES = {
  timeline: 'about_timeline',
  mission: 'about_mission',
  team: 'about_team',
} as const
export type AboutTable = keyof typeof TABLES

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, error: 'Sesi berakhir. Silakan masuk lagi.' as const }
  return { supabase, error: null }
}

/** Field yang boleh ditulis per tabel — allowlist, bukan pass-through.
 *  `id`, `created_at`, dan apa pun yang tidak tercantum akan dibuang. */
const WRITABLE: Record<AboutTable, string[]> = {
  timeline: ['year', 'title', 'description', 'sort_order'],
  mission: ['title', 'description', 'sort_order'],
  team: ['name', 'position', 'photo_path', 'sort_order'],
}

function pick(table: AboutTable, row: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const k of WRITABLE[table]) if (k in row) out[k] = row[k]
  return out
}

export async function saveAboutRows(
  table: AboutTable,
  rows: Array<Record<string, unknown> & { id?: string }>
): Promise<Result> {
  const { supabase, error: authErr } = await requireAdmin()
  if (authErr) return { ok: false, error: authErr }
  const name = TABLES[table]

  // Nilai sort_order ditulis ulang dari URUTAN ARRAY, bukan dipercaya dari
  // klien. Kalau klien mengirim angka yang bentrok, urutan tampil jadi
  // tidak deterministik — dan itu bug yang hanya muncul sesekali.
  const payload: Array<Record<string, unknown>> = rows.map((r, i) => ({
    ...pick(table, r),
    ...(r.id ? { id: r.id } : {}),
    sort_order: i + 1,
    updated_at: new Date().toISOString(),
  }))

  for (const row of payload) {
    const label = String(row.title ?? row.name ?? '').trim()
    if (!label) return { ok: false, error: 'Judul/nama tidak boleh kosong.' }
    if (table === 'timeline') {
      const y = Number(row.year)
      if (!Number.isInteger(y) || y < 1900 || y > 2200) {
        return { ok: false, error: `Tahun "${row.year}" tidak masuk akal.` }
      }
      row.year = y
    }
  }

  const { error } = await supabase.from(name).upsert(payload, { onConflict: 'id' })
  if (error) {
    console.error(`[about:${table}] gagal simpan:`, error.message)
    return { ok: false, error: 'Gagal menyimpan. Perubahan tidak tersimpan.' }
  }
  revalidatePath('/tentang-kami')
  return { ok: true }
}

export async function deleteAboutRow(table: AboutTable, id: string): Promise<Result> {
  const { supabase, error: authErr } = await requireAdmin()
  if (authErr) return { ok: false, error: authErr }
  const { error } = await supabase.from(TABLES[table]).delete().eq('id', id)
  if (error) {
    console.error(`[about:${table}] gagal hapus:`, error.message)
    return { ok: false, error: 'Gagal menghapus.' }
  }
  revalidatePath('/tentang-kami')
  return { ok: true }
}

export async function saveAboutVision(vision: string): Promise<Result> {
  const { supabase, error: authErr } = await requireAdmin()
  if (authErr) return { ok: false, error: authErr }
  const value = vision.trim()
  if (!value) return { ok: false, error: 'Visi tidak boleh kosong.' }
  if (value.length > 400) return { ok: false, error: 'Visi maksimal 400 karakter.' }

  const { error } = await supabase
    .from('company_settings')
    .upsert([{ key: 'about_vision', value }], { onConflict: 'key' })
  if (error) return { ok: false, error: 'Gagal menyimpan visi.' }
  revalidatePath('/tentang-kami')
  return { ok: true }
}
