// components/sections/HeroSection.tsx
// Epic 2 Slice 1 (E2-S1-FE-02) — Server wrapper (ARCHITECTURE.md §5.4).
import { HeroCarousel, type HeroSlide } from './HeroCarousel'

const HERO_SLIDES: HeroSlide[] = [
  { src: '/images/hero/hero-1.jpg', alt: 'Produk garam industri CV Reka Cipta Indonesia' },
  { src: '/images/hero/hero-2.jpg', alt: 'Proses distribusi garam ke mitra industri' },
  { src: '/images/hero/hero-3.jpg', alt: 'Gudang penyimpanan garam bersertifikasi SNI' },
  { src: '/images/hero/hero-4.jpg', alt: 'Kemitraan strategis dengan industri nasional' }, // <--- SLIDE BARU
]

export function HeroSection() {
  return <HeroCarousel slides={HERO_SLIDES} autoPlayMs={3000}/>
}