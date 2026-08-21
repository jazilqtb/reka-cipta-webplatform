// lib/data/partners.ts — CP5 ronde 3

import { createPublic } from '@/lib/supabase/public'
import { getPublicStorageUrl } from '@/lib/storage'
import { ACTIVE_CLIENTS } from '@/constants/clients'

export interface PartnerEntry {
  id: string
  name: string
  industry: string
  logoUrl: string | null
}

/** Diawali '/' = aset lokal di /public. Selain itu = path di bucket.
 *  Pola dua-bentuk yang sama dengan foto tim, supaya logo lama tetap
 *  tampil tanpa harus dipindahkan lebih dulu. */
export function partnerLogoUrl(logoPath: string | null | undefined): string | null {
  const p = logoPath?.trim()
  if (!p) return null
  return p.startsWith('/') ? p : getPublicStorageUrl('partner-logos', p)
}

export async function getPartners(): Promise<PartnerEntry[]> {
  const fallback = (): PartnerEntry[] =>
    ACTIVE_CLIENTS.map((c, i) => ({
      id: `fallback-${i}`, name: c.name, industry: c.industry,
      logoUrl: c.logoUrl ?? null,
    }))
  try {
    const supabase = createPublic()
    const { data, error } = await supabase
      .from('partners')
      .select('id, name, industry, logo_path')
      .eq('status', 'active')
      .order('sort_order', { ascending: true })
    if (error || !data || data.length === 0) return fallback()
    return data.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      industry: (r.industry as string) ?? '',
      logoUrl: partnerLogoUrl(r.logo_path as string | null),
    }))
  } catch {
    return fallback()
  }
}
