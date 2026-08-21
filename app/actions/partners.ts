'use server'

// app/actions/partners.ts — CP5 ronde 3

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Result = { ok: boolean; error?: string }

async function session() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function savePartners(
  rows: Array<{ id?: string; name: string; industry?: string | null; logo_path?: string | null }>
): Promise<Result> {
  const { supabase, user } = await session()
  if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk lagi.' }

  // sort_order ditulis ulang dari urutan array, tidak dipercaya dari klien —
  // angka yang bentrok membuat urutan marquee tidak deterministik.
  const payload = rows.map((r, i) => ({
    ...(r.id ? { id: r.id } : {}),
    name: r.name.trim(),
    industry: r.industry?.trim() || null,
    logo_path: r.logo_path || null,
    sort_order: i + 1,
    status: 'active',
    updated_at: new Date().toISOString(),
  }))
  if (payload.some((p) => !p.name)) return { ok: false, error: 'Nama mitra tidak boleh kosong.' }

  const { error } = await supabase.from('partners').upsert(payload, { onConflict: 'id' })
  if (error) {
    console.error('[partners] simpan gagal:', error.message)
    return { ok: false, error: 'Gagal menyimpan daftar mitra.' }
  }
  revalidatePath('/')
  revalidatePath('/admin/mitra')
  return { ok: true }
}

export async function deletePartner(id: string): Promise<Result> {
  const { supabase, user } = await session()
  if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk lagi.' }
  const { error } = await supabase.from('partners').delete().eq('id', id)
  if (error) return { ok: false, error: 'Gagal menghapus mitra.' }
  revalidatePath('/')
  revalidatePath('/admin/mitra')
  return { ok: true }
}
