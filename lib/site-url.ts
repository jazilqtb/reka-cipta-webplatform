function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  // TODO-VERIFY: domain akhir untuk produksi — butuh: set NEXT_PUBLIC_BASE_URL
  // di Vercel (production + local .env.local) begitu domain final ditentukan.
  return 'https://rekaciptaindonesia.com'
}

export const SITE_URL = resolveSiteUrl()
