'use server'

// app/actions/leads.ts
// Epic 4B Slice 1 (E4B-S1-FE-14) — revalidate route cache setelah admin
// update lead (status/notes) dari Client Component. Pattern identik
// app/actions/products.ts (Epic 3B Slice 1).

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function revalidateLeadRoutes(id: string) {
  // Server Action bisa dipanggil dari mana saja di server — double-check
  // auth di sini (bukan cuma andalkan middleware/layout).
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('UNAUTHORIZED')
  }

  revalidatePath('/admin/leads')
  revalidatePath(`/admin/leads/${id}`)

  return { revalidated: true, timestamp: new Date().toISOString() }
}
