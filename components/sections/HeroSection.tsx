// components/sections/HeroSection.tsx
// Epic 2 Slice 1 (E2-S1-FE-02) — Server wrapper (ARCHITECTURE.md §5.4).
// Homepage redesign (2026-08): menerima `settings` untuk trust-strip
// inline di HeroCarousel (pengganti StatsBar sebagai section terpisah).
import { HeroCarousel, type HeroSlide } from './HeroCarousel'
import type { CompanySettingsMap } from '@/types/api'

const HERO_SLIDES: HeroSlide[] = [
  { src: '/images/hero/hero-1.jpg', alt: 'Produk garam industri CV Reka Cipta Indonesia' },
  { src: '/images/hero/hero-2.jpg', alt: 'Proses distribusi garam ke mitra industri' },
  { src: '/images/hero/hero-3.jpg', alt: 'Gudang penyimpanan garam bersertifikasi SNI' },
  { src: '/images/hero/hero-4.jpg', alt: 'Kemitraan langsung dengan petani garam lokal' },
]

interface HeroSectionProps {
  settings: CompanySettingsMap
}

export function HeroSection({ settings }: HeroSectionProps) {
  return <HeroCarousel slides={HERO_SLIDES} settings={settings} />
}
