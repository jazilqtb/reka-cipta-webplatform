// lib/product-spec-labels.ts
// Epic 3 Slice 2 (E3-S2-FE-05 support) — Registry label human-readable
// untuk field JSONB `products.specs`. Setiap produk punya field berbeda
// (lihat supabase/seeds/products_seed.sql) — SpecTable meng-iterate
// Object.entries(specs) lalu lookup di sini, bukan hardcode kolom tabel.
// Tambah field baru di sini saat spec baru muncul dari data lab real,
// tanpa perlu ubah komponen SpecTable.

interface SpecLabelMeta {
  label: string
  unit: string
  method?: string
}

export const SPEC_LABEL_REGISTRY: Record<string, SpecLabelMeta> = {
  nacl_pct: { label: 'Kadar NaCl', unit: '%', method: 'SNI 3556:2016' },
  water_pct: { label: 'Kadar Air', unit: '%', method: 'SNI 3556:2016' },
  kio3_ppm: { label: 'Kandungan KIO3', unit: 'ppm', method: 'SNI 3556:2016' },
  insoluble_impurities_pct: {
    label: 'Zat Tak Larut',
    unit: '%',
    method: 'SNI 3556:2016',
  },
  color: { label: 'Warna', unit: '-' },
  smell: { label: 'Bau', unit: '-' },
  mesh_size: { label: 'Ukuran Mesh', unit: '-' },
  grain_size_mm: { label: 'Ukuran Butiran', unit: 'mm' },
}

export function getSpecLabel(key: string): SpecLabelMeta {
  return SPEC_LABEL_REGISTRY[key] ?? { label: key, unit: '-' }
}
