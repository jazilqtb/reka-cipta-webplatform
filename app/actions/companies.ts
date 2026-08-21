'use server'

// app/actions/companies.ts — CP1 ronde 3
// Penggabungan perusahaan duplikat. SELALU dengan keputusan manusia.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Result = { ok: boolean; error?: string }

async function requireSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

/** Gabungkan `mergedId` ke dalam `survivingId`.
 *
 *  Seluruh pemindahan terjadi di dalam fungsi database `merge_companies`,
 *  bukan sebagai beberapa panggilan terpisah dari sini. Alasannya: kalau
 *  contact sudah dipindah tapi rfq belum, data berada dalam keadaan yang
 *  tidak konsisten dan tidak ada yang tahu. Di dalam satu fungsi Postgres,
 *  semuanya berhasil atau semuanya batal.
 */
export async function mergeCompanies(survivingId: string, mergedId: string): Promise<Result> {
  const { supabase, user } = await requireSession()
  if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk lagi.' }
  if (survivingId === mergedId) return { ok: false, error: 'Tidak bisa menggabungkan ke dirinya sendiri.' }

  const { error } = await supabase.rpc('merge_companies', {
    p_surviving: survivingId,
    p_merged: mergedId,
  })
  if (error) {
    console.error('[companies] merge gagal:', error.message)
    return { ok: false, error: 'Gagal menggabungkan. Tidak ada perubahan yang tersimpan.' }
  }
  revalidatePath('/admin/perusahaan')
  revalidatePath('/admin/leads')
  return { ok: true }
}

/** Batalkan penggabungan. Kemampuan ini bukan kemewahan: menggabungkan dua
 *  perusahaan yang ternyata berbeda mencampur riwayat pesanan dua pelanggan,
 *  dan tanpa jalan mundur kesalahan itu permanen. */
export async function undoCompanyMerge(mergeId: string): Promise<Result> {
  const { supabase, user } = await requireSession()
  if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk lagi.' }

  const { data, error } = await supabase.rpc('undo_company_merge', { p_merge_id: mergeId })
  if (error) {
    console.error('[companies] undo gagal:', error.message)
    return { ok: false, error: 'Gagal membatalkan penggabungan.' }
  }
  if (data === false) return { ok: false, error: 'Penggabungan ini sudah dibatalkan sebelumnya.' }
  revalidatePath('/admin/perusahaan')
  revalidatePath('/admin/leads')
  return { ok: true }
}

export async function rejectMergeCandidate(candidateId: string): Promise<Result> {
  const { supabase, user } = await requireSession()
  if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk lagi.' }
  const { error } = await supabase
    .from('company_merge_candidates')
    .update({ status: 'rejected', decided_at: new Date().toISOString() })
    .eq('id', candidateId)
  if (error) return { ok: false, error: 'Gagal menyimpan keputusan.' }
  revalidatePath('/admin/perusahaan')
  return { ok: true }
}

/** Jalankan ulang pendeteksi. Hanya mengusulkan. */
export async function refreshMergeCandidates(): Promise<Result & { found?: number }> {
  const { supabase, user } = await requireSession()
  if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk lagi.' }
  const { data, error } = await supabase.rpc('refresh_company_merge_candidates')
  if (error) return { ok: false, error: 'Gagal memindai duplikat.' }
  revalidatePath('/admin/perusahaan')
  return { ok: true, found: (data as number) ?? 0 }
}
