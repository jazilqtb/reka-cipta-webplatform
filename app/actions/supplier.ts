'use server'

// app/actions/supplier.ts
// Epic 5 Admin (E5-ADM-FE-12) — revalidate route cache setelah admin
// update supplier (status/notes) dari Client Component. Pattern identik
// app/actions/leads.ts (Epic 4B Slice 1).

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function revalidateSupplierRoutes(id: string) {
  // Server Action bisa dipanggil dari mana saja di server — double-check
  // auth di sini (bukan cuma andalkan middleware/layout).
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('UNAUTHORIZED')
  }

  revalidatePath('/admin/suppliers')
  revalidatePath(`/admin/suppliers/${id}`)

  return { revalidated: true, timestamp: new Date().toISOString() }
}
