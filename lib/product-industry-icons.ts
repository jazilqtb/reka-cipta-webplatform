// lib/product-industry-icons.ts
// Epic 3 Slice 2 (E3-S2-FE-06 support) — Registry icon per nama industri
// untuk IndustryList di halaman detail produk. Cover semua nilai
// `products.industries` yang ada di supabase/seeds/products_seed.sql.
// Icon dipilih konsisten dengan components/sections/IndustriesGrid.tsx
// (Epic 2) untuk nama industri yang overlap (Water Treatment, Pakan
// Ternak, Penyamakan Kulit, industri perikanan).

import {
  UtensilsCrossed,
  Pill,
  Home,
  FlaskConical,
  Shirt,
  Fish,
  PawPrint,
  Sprout,
  Droplets,
  Layers,
  Store,
  Factory,
  type LucideIcon,
} from 'lucide-react'

export const INDUSTRY_ICON_REGISTRY: Record<string, LucideIcon> = {
  'Makanan & Minuman': UtensilsCrossed,
  Farmasi: Pill,
  'Rumah Tangga': Home,
  Kimia: FlaskConical,
  Tekstil: Shirt,
  'Pengolahan Ikan': Fish,
  'Budidaya Ikan': Fish,
  Peternakan: PawPrint,
  'Pakan Ternak': Sprout,
  'Water Treatment': Droplets,
  'Penyamakan Kulit': Layers,
  'Distributor Retail': Store,
}

export function getIndustryIcon(name: string): LucideIcon {
  return INDUSTRY_ICON_REGISTRY[name] ?? Factory
}
