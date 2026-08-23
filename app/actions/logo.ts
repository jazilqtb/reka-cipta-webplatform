'use server'

// app/actions/logo.ts — CRUD logo situs (company_settings.logo_dark_path
// / logo_light_path). File aktual diunggah ke Storage lewat klien
// (lib/supabase/client, bucket `site-logo`) sebelum action ini dipanggil
// — action ini hanya menulis PATH-nya, pola yang sama dengan
// app/actions/partners.ts.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Result = { ok: boolean; error?: string }

type LogoVariant = 'dark' | 'light'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, error: 'Sesi berakhir. Silakan masuk lagi.' as const }
  return { supabase, error: null }
}

/** `path: null` mengembalikan varian ke bawaan statis (menghapus override). */
export async function saveLogoPath(variant: LogoVariant, path: string | null): Promise<Result> {
  const { supabase, error: authErr } = await requireAdmin()
  if (authErr) return { ok: false, error: authErr }

  const key = variant === 'dark' ? 'logo_dark_path' : 'logo_light_path'
  const { error } = await supabase
    .from('company_settings')
    .upsert([{ key, value: path ?? '' }], { onConflict: 'key' })

  if (error) {
    console.error(`[logo:${variant}] gagal simpan:`, error.message)
    return { ok: false, error: 'Gagal menyimpan logo.' }
  }

  // Navbar & Footer dirender lewat app/(public)/layout.tsx, jadi
  // revalidatePath per-halaman tidak cukup — perlu revalidate layout-nya.
  revalidatePath('/', 'layout')
  revalidatePath('/admin/logo')
  return { ok: true }
}
