// constants/distribution-map.ts
// Epic 2 Slice 1 (E2-S1-CONST-02)
//
// Data titik distribusi untuk InteractiveDistributionMap
// (StatsBar Slide 2 — FE-10).
//
// SISTEM KOORDINAT: cx/cy adalah posisi dalam SVG viewBox "0 0 500 300"
// — BUKAN lat/lng GPS. Approximate layout: Jawa Tengah di kiri
// (x < 290), Jawa Timur di kanan (x > 290). Keputusan Fase 0:
// Opsi A placeholder rect — presisi geografis tidak diperlukan.
// TODO: Update cx/cy jika klien menyediakan SVG path pulau Jawa resmi.
//
// VALIDASI DATA (vs company_settings di DB):
// - Total tons = 353 → harus sama dengan total_distribution_tons
// - Jumlah kota = 8, sedangkan cities_served = 9:
//   selisih 1 DISENGAJA — 1 kota minor (volume kecil) tidak
//   dipetakan agar peta tidak terlalu padat.

export interface DistributionCity {
  id: string
  /** Nama kota — tampil di tooltip */
  name: string
  /** SVG x coordinate (0–500) */
  cx: number
  /** SVG y coordinate (0–300) */
  cy: number
  /** Volume distribusi dalam ton — tampil di tooltip */
  tons: number
  province: 'jawa-timur' | 'jawa-tengah'
}

export const DISTRIBUTION_CITIES: DistributionCity[] = [
  // ── Jawa Timur (kanan, x > 290) ──────────────────────────
  { id: 'surabaya',  name: 'Surabaya',  cx: 380, cy: 160, tons: 180, province: 'jawa-timur' },
  { id: 'sidoarjo',  name: 'Sidoarjo',  cx: 390, cy: 185, tons:  45, province: 'jawa-timur' },
  { id: 'gresik',    name: 'Gresik',    cx: 355, cy: 148, tons:  35, province: 'jawa-timur' },
  { id: 'malang',    name: 'Malang',    cx: 380, cy: 220, tons:  30, province: 'jawa-timur' },
  { id: 'mojokerto', name: 'Mojokerto', cx: 360, cy: 175, tons:  20, province: 'jawa-timur' },

  // ── Jawa Tengah (kiri, x < 290) ──────────────────────────
  { id: 'semarang',  name: 'Semarang',  cx: 200, cy: 120, tons:  18, province: 'jawa-tengah' },
  { id: 'solo',      name: 'Solo',      cx: 230, cy: 165, tons:  15, province: 'jawa-tengah' },
  { id: 'kudus',     name: 'Kudus',     cx: 220, cy: 95,  tons:  10, province: 'jawa-tengah' },
]

/** Total volume — dipakai untuk validasi & bisa ditampilkan di legenda */
export const TOTAL_DISTRIBUTION_TONS = DISTRIBUTION_CITIES.reduce(
  (sum, city) => sum + city.tons,
  0
)
