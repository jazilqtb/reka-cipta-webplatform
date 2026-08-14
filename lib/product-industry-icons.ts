// lib/product-industry-icons.ts
// Epic 3 Slice 2 (E3-S2-FE-06 support) — Registry icon per nama industri
// untuk IndustryList di halaman detail produk. Cover semua nilai
// `products.industries` yang ada di supabase/seeds/products_seed.sql.
//
// RONDE Tahap 6 (2026-08) — "samakan DNA desain /produk/[slug] dengan
// Beranda": Lucide (1px outline seragam) diganti Phosphor duotone —
// sama alasan & sama library dengan migrasi IndustriesGrid.tsx Ronde 4
// (lihat catatan di sana), supaya TIDAK ADA lagi ikon Lucide tersisa di
// halaman produk manapun.

import {
  ForkKnifeIcon,
  PillIcon,
  HouseIcon,
  FlaskIcon,
  TShirtIcon,
  FishIcon,
  PawPrintIcon,
  PlantIcon,
  DropIcon,
  StackIcon,
  StorefrontIcon,
  FactoryIcon,
} from '@phosphor-icons/react/ssr'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'

export const INDUSTRY_ICON_REGISTRY: Record<string, PhosphorIcon> = {
  'Makanan & Minuman': ForkKnifeIcon,
  Farmasi: PillIcon,
  'Rumah Tangga': HouseIcon,
  Kimia: FlaskIcon,
  Tekstil: TShirtIcon,
  'Pengolahan Ikan': FishIcon,
  'Budidaya Ikan': FishIcon,
  Peternakan: PawPrintIcon,
  'Pakan Ternak': PlantIcon,
  'Water Treatment': DropIcon,
  'Penyamakan Kulit': StackIcon,
  'Distributor Retail': StorefrontIcon,
}

export function getIndustryIcon(name: string): PhosphorIcon {
  return INDUSTRY_ICON_REGISTRY[name] ?? FactoryIcon
}
