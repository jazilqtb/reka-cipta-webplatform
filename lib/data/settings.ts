// lib/data/settings.ts
// Peta company_settings (key/value) — diambil DI SERVER.
//
// Dipisah ke modul sendiri di CP3 karena fungsi ini tadinya privat di
// app/(public)/page.tsx, sehingga panel admin hero tidak bisa memakainya.
// Pola sama dengan lib/data/product-names.ts di ronde sebelumnya.

import { createPublic } from '@/lib/supabase/public'
import type { CompanySettingsMap } from '@/types/api'

/** Nilai bawaan kalau tabel kosong/gagal dibaca. Angka statistik di sini
 *  adalah BASELINE, bukan hasil akhir — hasil akhir = baseline + data nyata
 *  (lihat lib/data/hero.ts). */
export const FALLBACK_SETTINGS: CompanySettingsMap = {
  partner_count: '6',
  cities_served: '9',
  total_distribution_tons: '353',
  salt_types_count: '0',
}

export async function getCompanySettingsMap(): Promise<CompanySettingsMap> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase.from('company_settings').select('key, value')
    if (error || !data || data.length === 0) return FALLBACK_SETTINGS
    return { ...FALLBACK_SETTINGS, ...Object.fromEntries(data.map((r) => [r.key, r.value])) }
  } catch (err) {
    console.error('[Settings] Gagal membaca company_settings:', err)
    return FALLBACK_SETTINGS
  }
}
