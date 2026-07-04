'use server'

// app/admin/settings/actions.ts
// Epic 2 Slice 3 (E2-S3-CACHE-01) — Server Action revalidate halaman
// publik setelah admin save PATCH /settings sukses. Native Next.js
// Server Action — tidak perlu Route Handler + secret token terpisah.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function revalidateSettings() {
  // Server Action bisa dipanggil dari mana saja di server, jadi perlu
  // double-check auth di sini (bukan cuma andalkan middleware/layout).
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('UNAUTHORIZED')
  }

  // Beranda (footer) dan Kontak sama-sama baca company_settings.
  revalidatePath('/')
  revalidatePath('/kontak')

  return { revalidated: true, timestamp: new Date().toISOString() }
}
