// app/(public)/kontak/page.tsx — Halaman Kontak (/kontak)
// Epic 2 Slice 3 (E2-S3-FE-01)
//
// Rendering : ISR — revalidate 3600s + revalidatePath('/kontak') dari
//             admin save (app/admin/settings/actions.ts, Fase 12)
// Data      : company_settings via Supabase anon key, Server Component
//             (§6.1 — public read TIDAK lewat FastAPI). WAJIB pakai
//             lib/supabase/public.ts (bukan server.ts) supaya halaman
//             tetap Static (○), bukan Dynamic (ƒ).

import type { Metadata } from 'next'
import { createPublic } from '@/lib/supabase/public'
import type { CompanySettingsMap } from '@/types/api'
import { InnerPageHero } from '@/components/sections/InnerPageHero'
import { ContactInfo } from '@/components/sections/ContactInfo'
import { WhatsAppButtons } from '@/components/sections/WhatsAppButtons'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Hubungi Kami — CV Reka Cipta Indonesia Distributor Garam Surabaya',
  description:
    'Hubungi CV Reka Cipta Indonesia untuk kebutuhan distribusi garam industri Anda. Kantor Surabaya, respons kurang dari 24 jam. Chat WA langsung.',
  alternates: {
    canonical: 'https://rekaciptaindonesia.com/kontak',
  },
  openGraph: {
    title: 'Hubungi CV Reka Cipta Indonesia',
    description:
      'Hubungi CV Reka Cipta Indonesia untuk kebutuhan distribusi garam industri Anda. Kantor Surabaya, respons kurang dari 24 jam. Chat WA langsung.',
    url: 'https://rekaciptaindonesia.com/kontak',
    images: [{ url: '/og-image.svg' }],
    type: 'website',
  },
}

// Fallback IDENTIK dengan seed Slice 1 (DB-02) — kalau fetch gagal,
// tampilkan nilai fallback, bukan blank/error.
const FALLBACK_SETTINGS: CompanySettingsMap = {
  whatsapp_1: '082136096528',
  whatsapp_2: '087839031378',
  email: 'rekaciptaindonesiaa@gmail.com',
  address: 'Jl. Bratang Gede III-I No. 16A, Ngagel Rejo, Wonokromo, Surabaya 60245',
  gmaps_embed_url: '',
  wa_default_message:
    'Halo, saya ingin mengetahui lebih lanjut tentang produk garam CV Reka Cipta Indonesia.',
}

async function getCompanySettings(): Promise<CompanySettingsMap> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase
      .from('company_settings')
      .select('key, value')

    if (error || !data || data.length === 0) {
      console.error('[Kontak] Gagal fetch company_settings:', error?.message)
      return FALLBACK_SETTINGS
    }

    return Object.fromEntries(data.map((row) => [row.key, row.value]))
  } catch (err) {
    console.error('[Kontak] Exception saat fetch company_settings:', err)
    return FALLBACK_SETTINGS
  }
}

function toE164(nomor: string): string {
  return '+62' + nomor.replace(/^0/, '')
}

export default async function KontakPage() {
  const settings = await getCompanySettings()

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'CV Reka Cipta Indonesia',
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address,
      addressLocality: 'Surabaya',
      addressCountry: 'ID',
    },
    telephone: toE164(settings.whatsapp_1),
    email: settings.email,
    openingHours: 'Mo-Sa 08:00-17:00',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <InnerPageHero
        title="Hubungi Kami"
        subtitle="Tim kami siap membantu kebutuhan distribusi garam industri Anda. Hubungi via WhatsApp, email, atau kirim pesan langsung dari halaman ini."
        breadcrumb={[{ label: 'Beranda', href: '/' }, { label: 'Hubungi Kami' }]}
      />

      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <ContactInfo address={settings.address} email={settings.email} />
            <WhatsAppButtons
              whatsapp1={settings.whatsapp_1}
              whatsapp2={settings.whatsapp_2}
              defaultMessage={settings.wa_default_message}
            />
          </div>

          <div className="md:col-span-3">
            <h2>Kirim Pesan - WIP</h2>
          </div>
        </div>
      </section>
    </>
  )
}
