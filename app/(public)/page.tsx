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
import { SITE_URL } from '@/lib/site-url'
import type { CompanySettingsMap, Product, ProductRow } from '@/types/api'
import{ HeroSection } from '@/components/sections/HeroSection'
import { IndustriesGrid } from '@/components/sections/IndustriesGrid'
import { StagedCTASection } from '@/components/sections/StagedCTASection'
import { ProductsPreview } from '@/components/sections/ProductsPreview'
import { CredibilitySection } from '@/components/sections/CredibilitySection'
import HowItWorks from '@/components/sections/HowItWorks'
import { ArticlesPreview } from '@/components/sections/ArticlesPreview'
import { StructuredData } from '@/components/seo/StructuredData'
import { SectionDivider } from '@/components/decorative/SectionDivider'
import { getLatestArticles } from '@/lib/data/articles'
import { getHeroContent, getHeroStats } from '@/lib/data/hero'
import { getPartners } from '@/lib/data/partners'

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
    canonical: SITE_URL,
  },
  openGraph: {
    title: 'CV Reka Cipta Indonesia — Distributor Garam SNI untuk Industri',
    description:
      'Distributor garam industri bersertifikasi SNI di Surabaya. Dokumentasi lab dan legalitas terbuka. Penawaran harga kurang dari 2 menit.',
    url: SITE_URL,
    siteName: 'CV Reka Cipta Indonesia',
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
  // RONDE 6: getMostViewedArticles() tidak lagi dipanggil di sini — tab
  // Terbaru/Terbanyak Dilihat di ArticlesPreview dihapus (lihat catatan
  // di ArticlesPreview.tsx), jadi datanya tidak lagi dipakai. Fungsinya
  // sendiri TIDAK dihapus dari lib/data/articles.ts (masih valid utk
  // konteks lain), hanya tidak lagi dipanggil dari homepage.
  const [settings, products, articles, hero, partners] = await Promise.all([
    getCompanySettings(),
    getProductsPreview(),
    getLatestArticles(3),
    getHeroContent(),
    getPartners(),
  ])
  // Statistik butuh `settings` (baseline dari admin), jadi menyusul —
  // bukan di dalam Promise.all di atas.
  const heroStats = await getHeroStats(settings)

  // Urutan section — RONDE 5 (2026-08), restrukturasi homepage
  // (senior-ui-ux-orchestrator), tetap mengikuti hierarki pesan wajib
  // Fondasi Brand v1.0 §7.1: siapa kami (Hero) → apa yang ditawarkan
  // (Produk) → mengapa dipercaya (Kredibilitas + Industri) → bagaimana
  // prosesnya (HowItWorks) → konten pendukung (Artikel) → langkah
  // berikutnya (StagedCTASection, §7.3 — pengganti CTASection generik
  // dengan CTA staged-funnel 4 tahap kesiapan pengunjung + strip terpisah
  // untuk persona supplier). StatsBar dihapus sebagai section terpisah —
  // statistiknya menyatu sebagai trust-strip di dalam Hero (lihat
  // HeroCarousel.tsx).
  //
  // <StructuredData> — JSON-LD Organization + Product ItemList untuk
  // discoverability SEO/LLM (Langkah 2 mandat klien). Murni metadata,
  // tidak me-render apapun secara visual, dan tidak melakukan fetch
  // sendiri — pakai `settings`/`products` yang sudah diambil di atas.
  // RONDE 7: <SectionDivider> disisipkan di titik transisi warna kontras
  // tinggi (terang↔gelap) — pengganti garis lurus flat. 3 variant beda
  // (wave/curve/diagonal), sebagian di-flip, supaya tidak terasa statis/
  // berulang. Footer dirender di app/(public)/layout.tsx (dipakai semua
  // halaman publik) — pembatas StagedCTA→Footer TIDAK bisa disisipkan di
  // sini, jadi ditaruh sebagai elemen penutup StagedCTASection.tsx sendiri.
  return (
    <>
      <StructuredData settings={settings} products={products} />
      <HeroSection hero={hero} stats={heroStats} />
      <ProductsPreview products={products} />
      <CredibilitySection partners={partners} />
      <IndustriesGrid />
      <SectionDivider variant="wave" fromClassName="fill-white" toClassName="bg-ink-900" />
      <HowItWorks />
      <SectionDivider variant="diagonal" fromClassName="fill-ink-900" toClassName="bg-salt-50" flip />
      <ArticlesPreview articles={articles} />
      <SectionDivider variant="curve" fromClassName="fill-salt-50" toClassName="bg-brand-teal-600" />
      <StagedCTASection />
    </>
  )
}
