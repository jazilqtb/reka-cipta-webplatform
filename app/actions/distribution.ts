'use server'

// app/actions/distribution.ts — CP3 ronde 3
// CRUD manual untuk komitmen & pengiriman.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Result = { ok: boolean; error?: string }

const UNIT_KG: Record<string, number> = { kg: 1, ton: 1000, sak_25: 25, sak_50: 50 }

async function session() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

function toKg(qty: number, unit: string): number | null {
  const f = UNIT_KG[unit]
  return f ? Math.round(qty * f * 1000) / 1000 : null
}

export async function saveCommitment(input: {
  id?: string
  company_id: string
  product_slug: string
  quantity: number
  unit: string
  period: string
  starts_on: string
  notes?: string | null
}): Promise<Result> {
  const { supabase, user } = await session()
  if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk lagi.' }

  const kg = toKg(input.quantity, input.unit)
  if (kg === null || kg <= 0) return { ok: false, error: 'Volume atau satuan tidak valid.' }

  const row = {
    company_id: input.company_id,
    product_slug: input.product_slug,
    qty_kg: kg,
    qty_original: input.quantity,
    unit_original: input.unit,
    period: input.period,
    starts_on: input.starts_on,
    notes: input.notes ?? null,
    // Ditandai `manual` karena diketik admin. Yang lahir dari RFQ ditandai
    // `rfq` — pembedaan ini yang membuat rekap bisa jujur soal asal angka.
    source: 'manual',
  }
  const { error } = input.id
    ? await supabase.from('supply_commitments').update(row).eq('id', input.id)
    : await supabase.from('supply_commitments').insert(row)

  if (error) {
    console.error('[distribusi] simpan komitmen gagal:', error.message)
    return { ok: false, error: 'Gagal menyimpan komitmen.' }
  }
  revalidatePath('/admin/distribusi')
  return { ok: true }
}

export async function saveShipment(input: {
  id?: string
  company_id: string
  product_slug: string
  quantity: number
  unit: string
  shipped_on: string
  supplier_id?: string | null
  notes?: string | null
}): Promise<Result> {
  const { supabase, user } = await session()
  if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk lagi.' }

  const kg = toKg(input.quantity, input.unit)
  if (kg === null || kg <= 0) return { ok: false, error: 'Volume atau satuan tidak valid.' }

  const row = {
    company_id: input.company_id,
    product_slug: input.product_slug,
    qty_kg: kg,
    qty_original: input.quantity,
    unit_original: input.unit,
    shipped_on: input.shipped_on,
    supplier_id: input.supplier_id || null,
    notes: input.notes ?? null,
  }
  const { error } = input.id
    ? await supabase.from('shipments').update(row).eq('id', input.id)
    : await supabase.from('shipments').insert(row)

  if (error) {
    console.error('[distribusi] simpan pengiriman gagal:', error.message)
    return { ok: false, error: 'Gagal menyimpan pengiriman.' }
  }
  revalidatePath('/admin/distribusi')
  revalidatePath('/')   // "Ton Distribusi" di hero kini punya sumber
  return { ok: true }
}

export async function deleteDistributionRow(
  table: 'supply_commitments' | 'shipments',
  id: string
): Promise<Result> {
  const { supabase, user } = await session()
  if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk lagi.' }
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) return { ok: false, error: 'Gagal menghapus.' }
  revalidatePath('/admin/distribusi')
  return { ok: true }
}
