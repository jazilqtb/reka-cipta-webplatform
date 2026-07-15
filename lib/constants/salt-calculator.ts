// lib/constants/salt-calculator.ts
// Epic 6 Slice 2 (E6-S2-CONST-01) — mapping rules Kalkulator Kebutuhan
// Garam. Jenis industri reuse persis RFQSubmitFormData['industry_type']
// (lib/validation/rfq-schema.ts INDUSTRY_OPTIONS) — lihat AR-01
// epic6_task_breakdown_slice2_kalkulator-garam.md untuk kenapa daftar ini
// BUKAN daftar draft Epic Doc 2 (Water Treatment/Pulp & Kertas/dst).

import type { RFQSubmitFormData } from '@/lib/validation/rfq-schema'

export type IndustryValue = RFQSubmitFormData['industry_type']

export const CAPACITY_UNITS = [
  { value: 'per_day', label: 'ton/hari', toMonthlyFactor: 30 },
  { value: 'per_week', label: 'ton/minggu', toMonthlyFactor: 4.33 },
  { value: 'per_month', label: 'ton/bulan', toMonthlyFactor: 1 },
] as const

export type CapacityUnit = (typeof CAPACITY_UNITS)[number]['value']

export interface ProductSubOption {
  value: string
  label: string
  /** Menyempitkan/melebarkan rentang estimasi induk (multiplier terhadap saltRatioMin/Max industri) */
  adjustFactor: number
}

export interface CalculatorRule {
  industry: IndustryValue
  /**
   * PLACEHOLDER — rasio ton garam per ton kapasitas produksi bulanan.
   * Titik awal ilustratif berbasis penalaran umum industri garam, BUKAN
   * data tervalidasi riset pasar/historis klien. WAJIB ditinjau dan
   * dikonfirmasi Jazil/klien sebelum launch produksi — lihat AR-02
   * epic6_task_breakdown_slice2_kalkulator-garam.md.
   */
  saltRatioMin: number
  saltRatioMax: number
  /** Urutan = prioritas rekomendasi. Slug harus valid, reuse Epic 3 (AR-03). */
  recommendedSlugs: string[]
  reasoning: string
  subOptions: ProductSubOption[]
}

export const CALCULATOR_RULES: Record<IndustryValue, CalculatorRule> = {
  'makanan-minuman': {
    industry: 'makanan-minuman',
    saltRatioMin: 0.015,
    saltRatioMax: 0.03,
    recommendedSlugs: ['garam-halus-yodium', 'garam-halus-non-yodium'],
    reasoning:
      'Industri makanan & minuman umumnya membutuhkan garam food-grade halus. Garam beryodium sesuai regulasi untuk produk konsumsi umum; non-yodium untuk kebutuhan proses tertentu.',
    subOptions: [
      { value: 'mie-snack', label: 'Mie Instan / Snack', adjustFactor: 1.1 },
      { value: 'minuman-kemasan', label: 'Minuman Kemasan', adjustFactor: 0.8 },
      { value: 'pengolahan-daging', label: 'Pengolahan Daging Olahan', adjustFactor: 1.2 },
      { value: 'lainnya-makanan', label: 'Lainnya', adjustFactor: 1.0 },
    ],
  },
  farmasi: {
    industry: 'farmasi',
    saltRatioMin: 0.01,
    saltRatioMax: 0.02,
    recommendedSlugs: ['garam-halus-non-yodium'],
    reasoning:
      'Industri farmasi umumnya membutuhkan garam kemurnian tinggi tanpa tambahan yodium untuk menghindari interaksi dengan bahan aktif.',
    subOptions: [
      { value: 'produksi-obat', label: 'Produksi Obat', adjustFactor: 1.0 },
      { value: 'kosmetik', label: 'Kosmetik & Perawatan Kulit', adjustFactor: 0.9 },
      { value: 'lainnya-farmasi', label: 'Lainnya', adjustFactor: 1.0 },
    ],
  },
  kimia: {
    industry: 'kimia',
    saltRatioMin: 0.05,
    saltRatioMax: 0.09,
    recommendedSlugs: ['garam-kasar-industri'],
    reasoning:
      'Proses kimia industri (termasuk pengolahan air/water treatment) umumnya membutuhkan garam kasar industri dalam volume besar sebagai bahan baku proses.',
    subOptions: [
      { value: 'water-treatment', label: 'Water Treatment / Pengolahan Air', adjustFactor: 1.3 },
      { value: 'produksi-klor-alkali', label: 'Produksi Klor-Alkali', adjustFactor: 1.5 },
      { value: 'lainnya-kimia', label: 'Lainnya', adjustFactor: 1.0 },
    ],
  },
  peternakan: {
    industry: 'peternakan',
    saltRatioMin: 0.008,
    saltRatioMax: 0.015,
    recommendedSlugs: ['garam-ghpt'],
    reasoning:
      'Garam Halus Pakan Ternak (GHPT) diformulasikan khusus sebagai campuran pakan ternak untuk memenuhi kebutuhan mineral hewan.',
    subOptions: [
      { value: 'pakan-unggas', label: 'Pakan Unggas', adjustFactor: 0.9 },
      { value: 'pakan-sapi', label: 'Pakan Sapi/Kambing', adjustFactor: 1.2 },
      { value: 'lainnya-peternakan', label: 'Lainnya', adjustFactor: 1.0 },
    ],
  },
  tekstil: {
    industry: 'tekstil',
    saltRatioMin: 0.04,
    saltRatioMax: 0.07,
    recommendedSlugs: ['garam-kasar-industri'],
    reasoning:
      'Proses pewarnaan dan finishing tekstil membutuhkan garam kasar industri dalam volume signifikan sebagai fiksatif warna.',
    subOptions: [
      { value: 'pewarnaan-kain', label: 'Pewarnaan Kain', adjustFactor: 1.1 },
      { value: 'finishing-tekstil', label: 'Finishing Tekstil', adjustFactor: 0.9 },
      { value: 'lainnya-tekstil', label: 'Lainnya', adjustFactor: 1.0 },
    ],
  },
  'pengolahan-ikan': {
    industry: 'pengolahan-ikan',
    saltRatioMin: 0.1,
    saltRatioMax: 0.18,
    recommendedSlugs: ['garam-kasar-petani'],
    reasoning:
      'Pengasinan dan pengawetan ikan tradisional maupun industrial umumnya menggunakan garam kasar dalam rasio tinggi terhadap volume hasil tangkapan.',
    subOptions: [
      { value: 'ikan-asin', label: 'Ikan Asin', adjustFactor: 1.2 },
      { value: 'pindang', label: 'Pindang / Ikan Rebus Garam', adjustFactor: 0.9 },
      { value: 'lainnya-ikan', label: 'Lainnya', adjustFactor: 1.0 },
    ],
  },
  lainnya: {
    industry: 'lainnya',
    saltRatioMin: 0.02,
    saltRatioMax: 0.05,
    recommendedSlugs: ['garam-kasar-industri'],
    reasoning:
      'Kebutuhan spesifik industri Anda mungkin memerlukan konsultasi lebih lanjut. Tim kami siap membantu menentukan jenis garam yang paling sesuai.',
    subOptions: [{ value: 'lainnya-umum', label: 'Lainnya', adjustFactor: 1.0 }],
  },
}
