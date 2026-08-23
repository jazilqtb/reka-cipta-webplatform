// lib/data/logo.ts
// Logo situs — dua varian (dark/light), disimpan di company_settings
// sebagai path. Path diawali '/' = aset lokal di /public (pola yang
// sama dengan about_team.photo_path & partners.logo_path); selain itu
// = path relatif di bucket Supabase `site-logo`.

import { createPublic } from '@/lib/supabase/public'
import { getPublicStorageUrl } from '@/lib/storage'

export const DEFAULT_LOGO_DARK = '/logo/logo-dark.png'
export const DEFAULT_LOGO_LIGHT = '/logo/logo-light.png'

export function logoUrl(path: string | null | undefined, fallback: string): string {
  const p = path?.trim()
  if (!p) return fallback
  return p.startsWith('/') ? p : getPublicStorageUrl('site-logo', p)
}

export interface LogoUrls {
  dark: string
  light: string
}

export async function getLogoUrls(): Promise<LogoUrls> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase
      .from('company_settings')
      .select('key, value')
      .in('key', ['logo_dark_path', 'logo_light_path'])

    if (error || !data) return { dark: DEFAULT_LOGO_DARK, light: DEFAULT_LOGO_LIGHT }

    const map = Object.fromEntries(data.map((r) => [r.key, r.value as string]))
    return {
      dark: logoUrl(map.logo_dark_path, DEFAULT_LOGO_DARK),
      light: logoUrl(map.logo_light_path, DEFAULT_LOGO_LIGHT),
    }
  } catch (err) {
    console.error('[logo] gagal membaca company_settings:', err)
    return { dark: DEFAULT_LOGO_DARK, light: DEFAULT_LOGO_LIGHT }
  }
}
