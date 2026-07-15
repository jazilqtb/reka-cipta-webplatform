// app/(public)/page.tsx — Halaman Beranda (/)
// Epic 2 Slice 1 (E2-S1-FE-01)
//
// Rendering : ISR — revalidate 3600s (ARCHITECTURE.md §6.6)
//             + revalidatePath('/') dari admin save (Slice 3)
// Data      : company_settings via Supabase anon key, Server
//             Component (§6.1 — public read TIDAK lewat FastAPI)
// Metadata  : final dari E2-S1-UX-05 (Fase 0)
// Section   : placeholder sementara — diganti bertahap Fase 6–8

import type { Metadata } from 'next'
import { createPublic } from '@/lib/supabase/public'
import { mapProductRow } from '@/lib/product-mapper'
import type { CompanySettingsMap, Product, ProductRow } from '@/types/api'
import{ HeroSection } from '@/components/sections/HeroSection'
import { StatsBar } from '@/components/sections/StatsBar'
import { IndustriesGrid } from '@/components/sections/IndustriesGrid'
import { CTASection } from '@/components/sections/CTASection'
import { ProductsPreview } from '@/components/sections/ProductsPreview'
import { CredibilitySection } from '@/components/sections/CredibilitySection'
import HowItWorks from '@/components/sections/HowItWorks'
import { ArticlesPreview } from '@/components/sections/ArticlesPreview'
import { getLatestArticles, getMostViewedArticles } from '@/lib/data/articles'

// Semua placeholder Fase 6–7 sudah diganti komponen asli.
// File _sections-placeholder.tsx akan dihapus di Fase 8 (E2-S1-FE-09).

// ─── ISR: regenerasi maksimal tiap 1 jam ─────────────────────
export const revalidate = 3600

// ─── Metadata final — E2-S1-UX-05, dikunci Fase 0 ────────────
export const metadata: Metadata = {
  title: {
    absolute: 'CV Reka Cipta Indonesia — Distributor Garam SNI untuk Industri | Surabaya',
  },
  description:
    'Distributor garam industri bersertifikasi SNI di Surabaya. Melayani sektor makanan, pengasinan, water treatment, dan pakan ternak. Minta penawaran sekarang.',
  alternates: {
    canonical: 'https://rekaciptaindonesia.com',
  },
  openGraph: {
    title: 'CV Reka Cipta Indonesia — Distributor Garam SNI untuk Industri',
    description:
      'Distributor garam industri bersertifikasi SNI di Surabaya. Dokumentasi lab dan legalitas terbuka. Penawaran harga kurang dari 2 menit.',
    url: 'https://rekaciptaindonesia.com',
    siteName: 'CV Reka Cipta Indonesia',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }], // TODO: ganti /og-image.jpg sebelum production launch (catatan UX-05)
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

// ─── Data fetching ───────────────────────────────────────────
// Fallback IDENTIK dengan seed Fase 1 (DB-02) — acceptance
// criteria US-02: fetch gagal → tampil nilai fallback, bukan
// blank/error. Jangan ubah salah satu tanpa menyamakan yang lain.
const FALLBACK_SETTINGS: CompanySettingsMap = {
  partner_count: '6',
  cities_served: '9',
  total_distribution_tons: '353',
  client_list:
    'PT. Surabaya Mekabox,PT. Sejati Tritunggal Indah,PT. Cakrawala Cemerlang Box,Unit Pengolahan Garam KKP,Perusahaan Pengolah Limbah',
}

async function getCompanySettings(): Promise<CompanySettingsMap> {
  try {
    const supabase = createPublic() // async — Next.js 15 await cookies()
    const { data, error } = await supabase
      .from('company_settings')
      .select('key, value')

    if (error || !data || data.length === 0) {
      console.error('[Beranda] Gagal fetch company_settings:', error?.message)
      return FALLBACK_SETTINGS
    }

    return Object.fromEntries(data.map((row) => [row.key, row.value]))
  } catch (err) {
    console.error('[Beranda] Exception saat fetch company_settings:', err)
    return FALLBACK_SETTINGS
  }
}

// Epic 3B Slice 1 — ProductsPreview sebelumnya pakai data hardcode
// (TODO Epic 3 yang belum sempat dikerjakan saat Slice 1/2 CF). Sekarang
// fetch produk aktif asli supaya edit dari admin panel (nama/tagline/foto)
// ikut ter-reflect di Beranda, bukan cuma di /produk.
async function getProductsPreview(): Promise<Product[]> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error || !data) {
      console.error('[Beranda] Gagal fetch products:', error?.message)
      return []
    }

    return data.map((row) => mapProductRow(row as ProductRow))
  } catch (err) {
    console.error('[Beranda] Exception saat fetch products:', err)
    return []
  }
}

// ─── Page ────────────────────────────────────────────────────
// Catatan struktur: <main> sudah disediakan layout (E1-ENG-24)
// — di sini fragment saja agar tidak nested <main>.
export default async function BerandaPage() {
  const [settings, products, latestArticles, mostViewedArticles] = await Promise.all([
    getCompanySettings(),
    getProductsPreview(),
    getLatestArticles(3),
    getMostViewedArticles(3),
  ])

  return (
    <>
      <HeroSection />
      <StatsBar settings={settings} />
      <ArticlesPreview latestArticles={latestArticles} mostViewedArticles={mostViewedArticles} />
      <ProductsPreview products={products} />
      <HowItWorks />
      <IndustriesGrid />
      <CredibilitySection />
      <CTASection />
    </>
  )
}
