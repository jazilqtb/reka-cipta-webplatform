# Epic 6 Task Breakdown — Kalkulator Kebutuhan Garam (Customer-Facing) · Slice 2

**Depends on:** Epic 1 (routing, layout global), Epic 2 Slice 1 (design tokens, `InnerPageHero`), Epic 3 Customer-Facing (5 slug produk final: `garam-halus-yodium`, `garam-halus-non-yodium`, `garam-kasar-industri`, `garam-kasar-petani`, `garam-ghpt`), **Epic 4 Customer-Facing (kritis — lihat AR-01 dan AR-04: reuse `INDUSTRY_OPTIONS` dan pola prefill `RFQForm.tsx` persis, termasuk satu perubahan aditif kecil ke file yang sudah shipped)**

**Blocks:** Tidak ada — fitur leaf, tidak dikonsumsi slice/epic lain.

**Independen dari:** Epic 6 Slice 1 (Artikel & Berita) dan Slice 3 (homepage section) — tidak ada shared code, bisa dikerjakan paralel atau dalam urutan berapa pun relatif terhadap dua slice itu.

---

## ⚠️ Catatan Penting di Awal — Koreksi Daftar Industri dari Epic Doc 2

Epic Doc 2 (dan PRD) menulis draft daftar "Jenis Industri" untuk Kalkulator sebagai:
> Makanan & Minuman, Pengasinan Ikan, Water Treatment, Pakan Ternak, Pulp & Kertas, Penyamakan Kulit, Lainnya

**Daftar ini TIDAK dipakai di slice ini.** Alasannya di AR-01 di bawah — daftar itu tidak pernah sinkron dengan `INDUSTRY_TYPES` yang sudah live di production sejak Epic 4 CF (`makanan-minuman`, `farmasi`, `kimia`, `peternakan`, `tekstil`, `pengolahan-ikan`, `lainnya`, lihat `backend/schemas/rfq.py` dan `lib/validation/rfq-schema.ts:33-41`). Dua taksonomi industri berbeda di satu situs adalah bug UX/data yang harus dicegah, bukan detail kecil — ini persis jenis konflik lintas-epic yang wajib ditangkap sebelum implementasi, bukan ditemukan setelah kalkulator dan form RFQ live berdampingan dengan istilah yang tidak nyambung.

---

## Konteks Slice

Slice ini membangun `/kalkulator` — tool interaktif rule-based, **100% logika di frontend (JavaScript), tanpa backend, tanpa tabel DB baru** — sesuai `CLAUDE.md`: *"`/kalkulator`, `/minta-penawaran`, `/jadi-supplier`: SSG (client-side logic only)"*. Ini konsisten dengan Epic Doc 2 §Backend: *"Kalkulator: tidak memerlukan backend, semua logika di frontend JavaScript."* — tidak ada penyimpangan di area ini.

**Yang termasuk slice ini:**
- Halaman `/kalkulator`: form input (industri, kapasitas produksi, satuan, sub-jenis produk) → output estimasi kebutuhan garam + rekomendasi produk + CTA ke RFQ.
- **Satu perubahan aditif kecil ke `components/rfq/RFQForm.tsx`** (file Epic 4 CF yang sudah shipped ke production) — menambah baca query param `?volume=` untuk prefill field "Volume per Bulan". Ini bukan refactor, murni tambahan baca satu param baru mengikuti pola yang sudah ada persis (lihat E6-S2-FE-06).

**Yang TIDAK termasuk slice ini:**
- Perubahan apa pun ke `INDUSTRY_TYPES`/`INDUSTRY_OPTIONS` — dipakai apa adanya (reuse, bukan modifikasi).
- Perubahan skema DB `rfq_leads` atau endpoint `POST /rfq/submit` — sama sekali tidak disentuh.

---

## Prasyarat Teknis (Konfirmasi Sebelum Mulai)

- [ ] Epic 4 Customer-Facing selesai dan live — `lib/validation/rfq-schema.ts` (berisi `INDUSTRY_OPTIONS`), `components/rfq/RFQForm.tsx` sudah production-stable
- [ ] Epic 3 Customer-Facing selesai — 5 slug produk final dikonfirmasi dari `supabase/migrations` / `docs/EPIC3/epic3_task_breakdown_customer-facing.md`
- [ ] **BACA ULANG** `components/rfq/RFQForm.tsx` baris 38-112 sebelum menyentuhnya — pahami pola `useSyncExternalStore` untuk baca query string (bukan `useSearchParams()`) dan kenapa itu dipilih (komentar eksplisit di file: mencegah Next.js bailout ke client-only rendering yang akan menghilangkan form dari static HTML)

---

## Keputusan Arsitektur Slice

### AR-01 — Jenis Industri: Reuse `INDUSTRY_OPTIONS` Epic 4 CF Persis (Override Draft Epic Doc 2)

**Sumber tunggal kebenaran** untuk daftar Jenis Industri di seluruh situs adalah `lib/validation/rfq-schema.ts`:
```typescript
export const INDUSTRY_OPTIONS: Array<{ value: RFQSubmitFormData['industry_type']; label: string }> = [
  { value: 'makanan-minuman', label: 'Makanan & Minuman' },
  { value: 'farmasi', label: 'Farmasi' },
  { value: 'kimia', label: 'Kimia' },
  { value: 'peternakan', label: 'Peternakan' },
  { value: 'tekstil', label: 'Tekstil' },
  { value: 'pengolahan-ikan', label: 'Pengolahan Ikan' },
  { value: 'lainnya', label: 'Lainnya' },
]
```

Kalkulator **import langsung** konstanta ini (`E6-S2-FE-01`), **tidak** mendefinisikan ulang daftar industri sendiri. Ini menghilangkan kemungkinan drift permanen — kalau suatu saat `INDUSTRY_OPTIONS` berubah (industri baru ditambah/dihapus), Kalkulator otomatis ikut update tanpa perlu diedit terpisah.

**Konsekuensi:** mapping rekomendasi produk & faktor konversi (`E6-S2-CONST-01`) didesain ulang dari nol untuk 7 nilai *ini* (bukan 7 nilai draft Epic Doc 2). Lihat tabel mapping di bawah — beberapa target awal PRD (Water Treatment, Pulp & Kertas, Penyamakan Kulit) tidak punya padanan 1:1 langsung; dipetakan ke kategori terdekat (`kimia` mencakup water-treatment-adjacent chemical use case, dst).

**Rekomendasi tindak lanjut (di luar scope eksekusi kode, tapi wajib dicatat):** minta konfirmasi Jazil/klien apakah 7 nilai `INDUSTRY_TYPES` Epic 4 CF ini sudah final secara bisnis, atau perlu direvisi (mis. ditambah "Water Treatment" sebagai kategori sendiri terpisah dari "Kimia"). Kalau direvisi, perubahan itu harus dilakukan di `lib/validation/rfq-schema.ts` (satu tempat), bukan di kalkulator — sumber kebenaran tetap di sana.

### AR-02 — Faktor Konversi: Placeholder Rule-Based, Wajib Validasi Bisnis Sebelum Launch

Nilai rasio konversi (kapasitas produksi → estimasi kebutuhan garam per bulan) di `E6-S2-CONST-01` adalah **titik awal ilustratif berbasis penalaran umum industri garam**, bukan data tervalidasi dari riset pasar atau data historis klien. CV Reka Cipta baru punya 2 mitra aktif (~62 ton/bulan total per PRD) — belum ada dataset internal untuk mengkalibrasi rasio yang presisi.

**Desain sengaja mengisolasi angka-angka ini ke satu file constants** (`lib/constants/salt-calculator.ts`) supaya:
1. Mudah ditinjau ulang oleh Jazil/klien sebagai satu unit, tanpa perlu paham kode di sekitarnya.
2. Mudah diubah tanpa menyentuh logika kalkulasi atau komponen UI sama sekali.

**Wajib sebelum launch produksi:** Jazil/klien meninjau tabel `CALCULATOR_RULES` dan mengonfirmasi atau merevisi rentang `saltRatioMin`/`saltRatioMax` per industri berdasarkan pengetahuan domain riil. Item ini masuk Definition of Done sebagai checklist terpisah (bukan dianggap "selesai" hanya karena kode sudah jalan).

### AR-03 — Rekomendasi Produk: Mapping Industri → Slug Produk (Reuse Slug Epic 3 Persis)

5 slug produk final (dikonfirmasi dari `docs/EPIC3/epic3_task_breakdown_customer-facing.md`): `garam-halus-yodium`, `garam-halus-non-yodium`, `garam-kasar-industri`, `garam-kasar-petani`, `garam-ghpt`. Kalkulator **tidak** membuat nama/slug produk baru — mapping rekomendasi murni referensi ke 5 slug yang sudah ada.

### AR-04 — CTA Query Param: `?volume=` Ditambahkan Aditif ke `/minta-penawaran`, `?produk=` Reuse Tanpa Perubahan

Epic Doc 2 menyebut CTA kalkulator: *"Minta Penawaran untuk X Ton/Bulan" → ke `/minta-penawaran?volume=X&produk={slug_produk_rekomendasi}`*. Param `?produk=` **sudah didukung penuh** oleh `RFQForm.tsx` sejak Epic 4 CF (prefill checkbox jenis garam). Param `?volume=` **belum ada** — ini kebutuhan baru murni dari kalkulator.

**Pendekatan wajib — additive only, bukan refactor:**
- Baca `volume` dari query string via mekanisme `useSyncExternalStore` yang **sudah ada** di `RFQForm.tsx` (baris 59-60) — tinggal tambah satu baris `params.get('volume')`, **jangan** ganti ke `useSearchParams()` (akan merusak alasan performa/SSG yang didokumentasikan di komentar file itu sendiri).
- Extend effect prefill (baris 93-112) untuk juga set `volume_per_month` dari param, **hanya kalau** nilainya angka positif valid. Kalau tidak ada/tidak valid, behavior lama (default `0`) tidak berubah.
- **Tidak** menyentuh logika `industry_type` prefill sama sekali — kalkulator CTA per spec Epic Doc 2 hanya mengirim `volume` dan `produk`, tidak ada `industri` — jadi field `industry_type` tetap default `'makanan-minuman'` seperti sekarang, tidak diubah. Ini keputusan sadar untuk membatasi blast radius perubahan ke file yang sudah production-stable (disiplin yang sama dengan R-52/R-53 di Epic 5 — append-only, jangan ubah yang tidak perlu diubah).

Detail implementasi di `E6-S2-FE-06`.

### AR-05 — Rendering Strategy: SSG, Zero Backend (Konsisten Persis Epic Doc 2 & CLAUDE.md)

Tidak ada penyimpangan di sini — dikonfirmasi eksplisit karena ini satu-satunya bagian Epic 6 di mana draft Epic Doc 2 dan implementasi 100% selaras tanpa perlu koreksi.

---

## Ringkasan Task per Layer

| Layer | Jumlah Task | Prefix |
|---|---|---|
| UX | 1 | `E6-S2-UX` |
| User Stories | 2 | `E6-S2-US` |
| Constants & Logic | 2 | `E6-S2-CONST` |
| Frontend Public | 6 | `E6-S2-FE` |
| QA | 3 | `E6-S2-QA` |
| **Total** | **14** | |

---

## Layer 1 — UX Tasks

### E6-S2-UX-01 — Wireframe `/kalkulator`

**Priority:** P0 · **Tags:** `wireframe` `public`

**Deliverable:** `docs/wireframes/Epic6_slice2_kalkulator-garam.md`

**Struktur wireframe (state awal, sebelum submit):**
```
┌─────────────────────────────────────────────────┐
│  <Navbar />                                     │
├─────────────────────────────────────────────────┤
│  <InnerPageHero                                 │
│    title="Kalkulator Kebutuhan Garam"           │
│    subtitle="Estimasi kebutuhan garam industri  │
│              Anda dalam hitungan detik"         │
│  />                                              │
├─────────────────────────────────────────────────┤
│  <CalculatorIntro>                               │
│    Cara kerja: pilih industri Anda, masukkan     │
│    kapasitas produksi, dan kami hitung estimasi  │
│    kebutuhan garam serta rekomendasikan produk   │
│    yang paling sesuai.                           │
│  </CalculatorIntro>                              │
├─────────────────────────────────────────────────┤
│  <CalculatorForm>                                │
│    Jenis Industri▼   [Makanan & Minuman     ]    │  ← INDUSTRY_OPTIONS reuse
│    Jenis Produk▼      [dropdown dinamis,        │
│    yang Diproduksi     muncul setelah industri  │
│                         dipilih]                 │
│    Kapasitas Produksi [______]  Satuan▼ [ton/bulan]│
│    [ Hitung Kebutuhan ]                          │
│  </CalculatorForm>                               │
├─────────────────────────────────────────────────┤
│  <Footer />                                      │
└─────────────────────────────────────────────────┘
```

**Struktur wireframe (state hasil, setelah submit):**
```
├─────────────────────────────────────────────────┤
│  <CalculatorResult>                              │
│    ┌───────────────────────────────────────┐    │
│    │  Estimasi Kebutuhan Garam Anda:        │    │
│    │  8 – 12 ton per bulan                  │    │  ← angka besar, brand-teal-600
│    ├───────────────────────────────────────┤    │
│    │  Rekomendasi Produk:                   │    │
│    │  [ArticleCard-style]  Garam Halus       │    │
│    │  Yodium (PRO YD)                        │    │
│    │  "Direkomendasikan karena industri      │    │
│    │  makanan & minuman umumnya membutuhkan  │    │
│    │  garam food-grade beryodium sesuai      │    │
│    │  regulasi..."                           │    │
│    ├───────────────────────────────────────┤    │
│    │  [Minta Penawaran untuk 10 Ton/Bulan]  │    │  ← CTA primary
│    │  [ Hitung Ulang ]                       │    │  ← ghost button
│    └───────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

**Responsive:** Desktop form `max-w-2xl` centered, mobile full-width padding 16px. Hasil kalkulasi pakai `.success-reveal` animation pattern (Design System §13.6) — muncul dengan fade+scale, bukan langsung snap.

**Verifikasi:** Wireframe committed.

---

## Layer 2 — User Stories

### E6-S2-US-01 — Calon Mitra Mengestimasi Kebutuhan Garam Sebelum Menghubungi Sales

**As** calon mitra industri yang belum yakin berapa volume garam yang saya butuhkan,
**I want** memasukkan kapasitas produksi saya dan mendapat estimasi kebutuhan garam,
**So that** saya punya angka konkret sebelum mengisi form RFQ, tidak perlu menebak-nebak.

**Acceptance:**
- Hasil muncul instan setelah klik "Hitung Kebutuhan" (tidak ada loading/network delay — pure client-side)
- Rentang estimasi (bukan angka tunggal presisi palsu) — X–Y ton/bulan
- Rekomendasi produk disertai penjelasan singkat kenapa direkomendasikan (bukan sekadar nama produk)

---

### E6-S2-US-02 — Hasil Kalkulator Mendorong Konversi ke Form RFQ

**As** tim sales CV Reka Cipta,
**I want** hasil kalkulator langsung menyediakan tombol ke form RFQ dengan data pre-filled,
**So that** calon mitra yang sudah lihat estimasi tidak kehilangan momentum untuk lanjut submit RFQ.

**Acceptance:**
- Tombol CTA berlabel dinamis: `"Minta Penawaran untuk {volume} Ton/Bulan"` (bukan generic "Klik di sini")
- Klik CTA → `/minta-penawaran?volume={angka}&produk={slug}` → field Volume dan checkbox Jenis Garam sudah terisi otomatis
- Tombol "Hitung Ulang" mengembalikan form ke state kosong tanpa reload halaman

---

## Layer 3 — Constants & Logic

### E6-S2-CONST-01 — `lib/constants/salt-calculator.ts`: Mapping Rules

**Priority:** P0 · **Tags:** `constants` `business-logic` `needs-validation`

**File:** `lib/constants/salt-calculator.ts`

```typescript
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
  /** Menyempitkan rentang estimasi induk (multiplier terhadap saltRatioMin/Max industri) */
  adjustFactor: number
}

export interface CalculatorRule {
  industry: IndustryValue
  /**
   * Rasio ton garam per ton kapasitas produksi bulanan. PLACEHOLDER —
   * lihat AR-02 di epic6_task_breakdown_slice2_kalkulator-garam.md.
   * WAJIB ditinjau/dikonfirmasi Jazil/klien sebelum launch produksi.
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
```

**Catatan penting:**
- Komentar `PLACEHOLDER` di JSDoc `saltRatioMin`/`saltRatioMax` sengaja eksplisit di kode, bukan cuma di dokumen ini — supaya siapa pun yang buka file ini langsung tahu angka-angka ini butuh peninjauan bisnis, bahkan tanpa baca dokumen task breakdown.
- `industry: 'lainnya'` sengaja punya rekomendasi paling generik dan `reasoning` yang mengarahkan ke konsultasi manual, bukan klaim rekomendasi presisi untuk kategori yang secara definisi tidak spesifik.
- Semua 5 slug produk (`garam-halus-yodium`, `garam-halus-non-yodium`, `garam-kasar-industri`, `garam-kasar-petani`, `garam-ghpt`) muncul minimal sekali sebagai rekomendasi di seluruh tabel — tidak ada produk yang "orphan" tanpa jalur rekomendasi dari kalkulator manapun.

**Verifikasi:** `npx tsc --noEmit` clean. Tinjauan manual: setiap `recommendedSlugs` cocok dengan slug yang benar-benar ada di tabel `products` (`SELECT slug FROM products;`).

---

### E6-S2-CONST-02 — `lib/calculator.ts`: Fungsi Kalkulasi Murni

**Priority:** P0 · **Tags:** `business-logic`

**File:** `lib/calculator.ts`

```typescript
import { CALCULATOR_RULES, CAPACITY_UNITS, type CapacityUnit, type IndustryValue } from '@/lib/constants/salt-calculator'

export interface CalculatorInput {
  industry: IndustryValue
  capacity: number
  unit: CapacityUnit
  subOption?: string
}

export interface CalculatorOutput {
  estimateMinTon: number
  estimateMaxTon: number
  recommendedSlugs: string[]
  reasoning: string
}

export function calculateSaltNeeds(input: CalculatorInput): CalculatorOutput {
  const rule = CALCULATOR_RULES[input.industry]
  const unitConfig = CAPACITY_UNITS.find((u) => u.value === input.unit)
  const monthlyFactor = unitConfig?.toMonthlyFactor ?? 1

  const monthlyCapacity = input.capacity * monthlyFactor

  const subOption = rule.subOptions.find((opt) => opt.value === input.subOption)
  const adjustFactor = subOption?.adjustFactor ?? 1

  const estimateMinTon = Math.round(monthlyCapacity * rule.saltRatioMin * adjustFactor * 10) / 10
  const estimateMaxTon = Math.round(monthlyCapacity * rule.saltRatioMax * adjustFactor * 10) / 10

  return {
    estimateMinTon,
    estimateMaxTon,
    recommendedSlugs: rule.recommendedSlugs,
    reasoning: rule.reasoning,
  }
}
```

**Catatan:** fungsi pure (tidak ada side effect, tidak ada fetch) — mudah diuji unit test manual tanpa render komponen. `Math.round(x * 10) / 10` membulatkan ke 1 desimal, cukup presisi untuk estimasi (bukan klaim akurasi 2+ desimal yang tidak didukung data).

**Verifikasi manual:**
```typescript
calculateSaltNeeds({ industry: 'makanan-minuman', capacity: 300, unit: 'per_month', subOption: 'mie-snack' })
// monthlyCapacity = 300, ratio 0.015-0.03, adjustFactor 1.1
// Expected: estimateMinTon ≈ 4.95 → 5.0, estimateMaxTon ≈ 9.9 → 9.9
```

---

## Layer 4 — Frontend Public

### E6-S2-FE-01 — `components/calculator/CalculatorForm.tsx`

**Priority:** P0 · **Tags:** `component` `public` `client`

```tsx
'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { INDUSTRY_OPTIONS } from '@/lib/validation/rfq-schema'
import { CALCULATOR_RULES, CAPACITY_UNITS, type CapacityUnit } from '@/lib/constants/salt-calculator'
import { calculateSaltNeeds, type CalculatorOutput } from '@/lib/calculator'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CalculatorResult } from './CalculatorResult'
import type { IndustryValue } from '@/lib/constants/salt-calculator'

interface FormValues {
  industry: IndustryValue
  subOption: string
  capacity: number
  unit: CapacityUnit
}

export function CalculatorForm() {
  const [result, setResult] = useState<CalculatorOutput | null>(null)
  const [lastInput, setLastInput] = useState<{ capacity: number; unit: CapacityUnit } | null>(null)

  const { register, handleSubmit, watch, reset, control } = useForm<FormValues>({
    defaultValues: { industry: 'makanan-minuman', subOption: '', capacity: 0, unit: 'per_month' },
  })

  const selectedIndustry = watch('industry')
  const subOptions = CALCULATOR_RULES[selectedIndustry]?.subOptions ?? []

  function onSubmit(values: FormValues) {
    const output = calculateSaltNeeds(values)
    setResult(output)
    setLastInput({ capacity: values.capacity, unit: values.unit })
  }

  function handleReset() {
    setResult(null)
    setLastInput(null)
    reset()
  }

  if (result && lastInput) {
    return (
      <CalculatorResult
        result={result}
        onReset={handleReset}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="industry">Jenis Industri</Label>
        <select id="industry" {...register('industry')} className="h-9 w-full rounded-lg border border-input px-2.5 text-sm">
          {INDUSTRY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {subOptions.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="subOption">Jenis Produk yang Diproduksi</Label>
          <select id="subOption" {...register('subOption')} className="h-9 w-full rounded-lg border border-input px-2.5 text-sm">
            <option value="">Pilih jenis produk...</option>
            {subOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="capacity">Kapasitas Produksi</Label>
          <Input id="capacity" type="number" min={0} step="0.1" {...register('capacity', { valueAsNumber: true, min: 0 })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unit">Satuan</Label>
          <select id="unit" {...register('unit')} className="h-9 w-full rounded-lg border border-input px-2.5 text-sm">
            {CAPACITY_UNITS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>
      </div>

      <Button type="submit" className="w-full">Hitung Kebutuhan</Button>
    </form>
  )
}
```

**Catatan:** komponen ini `'use client'` sepenuhnya (tidak ada concern SSG-bailout seperti `RFQForm` — halaman `/kalkulator` memang murni interaktif tanpa konten statis penting untuk SEO di bagian form-nya; hero/intro tetap Server Component). `useSearchParams()`/`useSyncExternalStore` **tidak dibutuhkan sama sekali di sini** — kalkulator tidak menerima prefill dari URL manapun (arah datanya satu jalur: kalkulator → RFQ, bukan sebaliknya).

**Verifikasi:** Pilih industri → dropdown "Jenis Produk yang Diproduksi" muncul dengan opsi sesuai industri. Submit → hasil tampil, form tersembunyi.

---

### E6-S2-FE-02 — `components/calculator/CalculatorResult.tsx`

**Priority:** P0 · **Tags:** `component` `public`

```tsx
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { CalculatorOutput } from '@/lib/calculator'

interface Props {
  result: CalculatorOutput
  onReset: () => void
}

export function CalculatorResult({ result, onReset }: Props) {
  const primarySlug = result.recommendedSlugs[0]
  const rfqHref = `/minta-penawaran?volume=${result.estimateMaxTon}&produk=${primarySlug}`

  return (
    <div className="success-reveal mx-auto max-w-2xl space-y-6 rounded-xl border border-neutral-200 bg-white p-8">
      <div className="text-center">
        <p className="text-sm font-medium text-neutral-500">Estimasi Kebutuhan Garam Anda</p>
        <p className="mt-2 text-4xl font-extrabold text-brand-teal-600">
          {result.estimateMinTon} – {result.estimateMaxTon} ton
          <span className="block text-base font-medium text-neutral-500">per bulan</span>
        </p>
      </div>

      <div className="rounded-lg bg-brand-teal-50 p-4">
        <p className="text-sm font-semibold text-brand-teal-700">Rekomendasi Produk</p>
        <p className="mt-1 text-sm text-neutral-700">{result.reasoning}</p>
      </div>

      <div className="space-y-3">
        <Button asChild className="w-full">
          <Link href={rfqHref}>
            Minta Penawaran untuk {result.estimateMaxTon} Ton/Bulan
          </Link>
        </Button>
        <Button variant="outline" onClick={onReset} className="w-full">
          Hitung Ulang
        </Button>
      </div>
    </div>
  )
}
```

**Catatan:**
- `estimateMaxTon` dipakai untuk CTA (bukan `estimateMinTon`) — angka yang lebih tinggi dari rentang dipilih sengaja supaya prefill volume di form RFQ tidak underestimate kebutuhan calon mitra (lebih baik tim sales tahu potensi upside daripada meremehkan).
- `.success-reveal` class dari Design System §13.6 — animasi fade+scale saat hasil muncul (Design System sudah mendefinisikan ini persis untuk kasus "form submit sequence success state").
- Hanya `recommendedSlugs[0]` (produk prioritas tertinggi) yang dikirim ke query param `?produk=` — `RFQForm` hanya mendukung prefill 1 slug per Epic 4 CF spec (multi-slug comma-separated ada sebagai extension opsional tapi tidak wajib dipakai di sini, lihat `epic4_task_breakdown_customer-facing.md:132`).

**Verifikasi:** Klik CTA → landing di `/minta-penawaran?volume=X&produk=Y` dengan field Volume dan checkbox Jenis Garam ter-prefill (setelah `E6-S2-FE-06` selesai).

---

### E6-S2-FE-03 — `components/calculator/CalculatorIntro.tsx`

**Priority:** P1 · **Tags:** `component` `public`

Section penjelasan singkat cara kerja kalkulator (3 langkah ringkas: Pilih Industri → Masukkan Kapasitas → Dapat Estimasi + Rekomendasi), styling `max-w-2xl mx-auto text-center` konsisten dengan intro section lain di situs (mis. `HowItWorks`).

**Verifikasi:** Render statis, tidak ada logic.

---

### E6-S2-FE-04 — `app/(public)/kalkulator/page.tsx`

**Priority:** P0 · **Tags:** `page` `public`

```tsx
import type { Metadata } from 'next'
import { InnerPageHero } from '@/components/sections/InnerPageHero'
import { CalculatorIntro } from '@/components/calculator/CalculatorIntro'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'

export const metadata: Metadata = {
  title: 'Kalkulator Kebutuhan Garam | CV Reka Cipta Indonesia',
  description: 'Estimasikan kebutuhan garam industri Anda dan dapatkan rekomendasi produk yang sesuai dalam hitungan detik.',
}

export default function KalkulatorPage() {
  return (
    <main>
      <InnerPageHero
        title="Kalkulator Kebutuhan Garam"
        subtitle="Estimasi kebutuhan garam industri Anda dalam hitungan detik"
      />
      <section className="px-4 py-12">
        <CalculatorIntro />
        <div className="mt-10">
          <CalculatorForm />
        </div>
      </section>
    </main>
  )
}
```

**Catatan:** tidak ada `export const revalidate` — halaman ini murni statis (SSG default, tidak ada data fetch server-side sama sekali), konsisten `CLAUDE.md` ("SSG (client-side logic only)"). Tidak butuh `revalidate` karena tidak ada konten yang perlu di-refresh dari DB.

**Verifikasi:** `next build` → halaman `/kalkulator` muncul sebagai `○` (Static) di build output, bukan `ƒ` (Dynamic).

---

### E6-S2-FE-05 — Registrasi Nav (Konfirmasi, Bukan Task Baru)

**Priority:** P2 · **Tags:** `navigation`

Cek apakah `/kalkulator` perlu ditambahkan ke `Navbar` (Epic 1) sebagai menu item, atau cukup accessible via CTA link dari halaman lain (homepage Slice 3 mungkin tidak link ke sini, tapi produk/artikel bisa cross-link). **Bukan keputusan yang dibuat di dokumen ini** — Design System dan Navbar adalah domain Epic 1 (frozen di luar Epic 6). Kalau Navbar butuh item baru, itu perubahan Epic 1 yang harus dikonfirmasi terpisah ke Jazil sebelum eksekusi (append item ke `constants/adminNavigation.ts`-equivalent untuk Navbar publik, bukan improvisasi tanpa konfirmasi).

**Verifikasi:** Keputusan didokumentasikan (ya/tidak ditambah ke Navbar) sebelum FE-04 dianggap selesai penuh.

---

### E6-S2-FE-06 — Extend `RFQForm.tsx`: Baca & Prefill `?volume=` (Perubahan Aditif ke File Epic 4 CF)

**Priority:** P0 · **Tags:** `cross-epic-touch` `additive-only`

**File:** `components/rfq/RFQForm.tsx` (file yang sudah shipped production — **disiplin append-only wajib**, sama seperti R-52/R-53 di Epic 5)

**Diff minimal (hanya baris yang berubah, konteks di sekitarnya TIDAK disentuh):**

```diff
   const urlSearch = useSyncExternalStore(subscribeToUrl, getUrlSearch, getServerUrlSearch)
   const params = new URLSearchParams(urlSearch)
   const prefilledSlug = params.get('produk')
   const prefilledSaltTypes =
     prefilledSlug && availableProducts.some((p) => p.slug === prefilledSlug) ? [prefilledSlug] : []
+  const prefilledVolumeRaw = params.get('volume')
+  const prefilledVolume =
+    prefilledVolumeRaw && Number(prefilledVolumeRaw) > 0 ? Number(prefilledVolumeRaw) : null
```

```diff
   const appliedPrefillFor = useRef<string | null>(null)
   useEffect(() => {
-    if (prefilledSaltTypes.length === 0) return
-    const key = prefilledSaltTypes.join(',')
+    if (prefilledSaltTypes.length === 0 && prefilledVolume === null) return
+    const key = `${prefilledSaltTypes.join(',')}|${prefilledVolume ?? ''}`
     if (appliedPrefillFor.current === key) return
     appliedPrefillFor.current = key
     reset({
       full_name: '',
       company_name: '',
       position: null,
       industry_type: 'makanan-minuman',
       salt_types: prefilledSaltTypes,
-      volume_per_month: 0,
+      volume_per_month: prefilledVolume ?? 0,
       delivery_frequency: 'monthly',
       delivery_city: '',
       email: '',
       whatsapp: '',
       notes: null,
     })
     // eslint-disable-next-line react-hooks/exhaustive-deps
-  }, [prefilledSaltTypes.join(',')])
+  }, [prefilledSaltTypes.join(','), prefilledVolume])
```

**Kenapa ini aman (blast radius terkontrol):**
1. Entry point lama dari halaman produk (`/minta-penawaran?produk=X`, tanpa `volume`) — `prefilledVolume` jadi `null`, `volume_per_month: prefilledVolume ?? 0` tetap `0` seperti sebelumnya. **Behavior lama 100% tidak berubah.**
2. Entry point baru dari kalkulator (`?volume=X&produk=Y`) — sekarang `volume_per_month` ikut ter-prefill.
3. Mekanisme baca query string (`useSyncExternalStore`) **tidak diganti** — hanya ditambah satu `params.get()` baru, memakai `params` yang sudah dibuat baris sebelumnya. Tidak ada `useSearchParams()` baru yang bisa memicu SSG bailout.
4. `industry_type` tetap **tidak** diprefill dari URL manapun (konsisten AR-04) — hanya `salt_types` dan sekarang `volume_per_month`.

**Verifikasi:**
- Regression test: buka `/minta-penawaran?produk=garam-halus-yodium` (tanpa `volume`) → checkbox Jenis Garam ter-prefill seperti biasa, Volume tetap `0`. **Ini WAJIB pass** — kalau regresi di sini, revert perubahan.
- New behavior: buka `/minta-penawaran?volume=12&produk=garam-halus-yodium` → checkbox ter-prefill DAN field Volume per Bulan terisi `12`.
- Edge case: `?volume=abc` (bukan angka) atau `?volume=-5` (negatif) → prefill volume diabaikan, fallback ke `0` (guard `Number(prefilledVolumeRaw) > 0`).

---

## Layer 5 — QA Tasks

### E6-S2-QA-01 — Kalkulasi Rule-Based untuk 7 Industri

**Steps:** Untuk masing-masing 7 nilai industri, isi kapasitas contoh (mis. 100), submit, catat rentang estimasi dan rekomendasi produk yang muncul.

**Verifikasi:** Semua 7 kombinasi menghasilkan angka masuk akal (bukan `NaN`, bukan `0-0`, bukan negatif) dan `recommendedSlugs` valid (produk benar-benar ada).

---

### E6-S2-QA-02 — CTA & Prefill End-to-End

**Steps:**
1. Isi kalkulator (industri "Peternakan", kapasitas 50 ton/bulan) → submit
2. Catat label tombol CTA (harus match `estimateMaxTon`)
3. Klik CTA → verify landing di `/minta-penawaran?volume={angka}&produk=garam-ghpt`
4. Verify field Volume per Bulan di form RFQ terisi angka yang sama
5. Verify checkbox "Garam Halus Pakan Ternak (GHPT)" ter-centang

**Verifikasi:** End-to-end flow kalkulator → RFQ mulus tanpa data hilang.

---

### E6-S2-QA-03 — Regression Test Epic 4 CF (WAJIB — Cross-Epic Touch)

**Steps:**
1. Buka `/minta-penawaran` langsung (tanpa query param apa pun) → form kosong seperti biasa, submit sukses
2. Buka `/minta-penawaran?produk=garam-kasar-petani` (pola lama Epic 4 CF, dari CTA halaman detail produk) → checkbox ter-prefill, Volume tetap `0`
3. Submit RFQ form (skenario manapun di atas) → `POST /rfq/submit` tetap sukses, email proposal tetap terkirim (regresi paling kritis — kalkulator TIDAK BOLEH merusak fitur paling bernilai bisnis di situs ini)

**Verifikasi:** Ketiga skenario pass tanpa penyimpangan dari behavior Epic 4 CF yang sudah production-stable. **Kalau ada satu saja yang regresi, revert `E6-S2-FE-06` sebelum lanjut — jangan ship Slice 2 dengan regresi di Epic 4 CF.**

---

## Definition of Done — Slice 2

**Logic & Constants:**
- [ ] `CALCULATOR_RULES` mencakup 7 industri (persis `INDUSTRY_OPTIONS` Epic 4 CF, bukan draft Epic Doc 2)
- [ ] Semua 5 slug produk Epic 3 muncul minimal 1x sebagai rekomendasi
- [ ] **Faktor konversi (`saltRatioMin`/`saltRatioMax`) sudah ditinjau dan dikonfirmasi Jazil/klien** — bukan hanya "kode berjalan", tapi confirmed sebagai angka bisnis yang bisa dipakai (lihat AR-02, item terpisah dari technical DoD)

**Frontend:**
- [ ] `/kalkulator` render form, submit menghasilkan estimasi + rekomendasi, "Hitung Ulang" reset ke form kosong
- [ ] CTA hasil kalkulator mengarah ke `/minta-penawaran` dengan `volume` dan `produk` ter-prefill dengan benar
- [ ] `RFQForm.tsx` menerima prefill `volume` secara aditif, tanpa merusak behavior prefill `produk` yang sudah ada

**QA:**
- [ ] QA-01, QA-02, QA-03 pass — **QA-03 (regression Epic 4 CF) adalah blocker**, tidak boleh diskip
- [ ] `next build` menunjukkan `/kalkulator` sebagai halaman statis (`○`)
- [ ] `npx tsc --noEmit` dan `npm run lint` clean

**Demo ke klien:**
- [ ] Sign-off dari Jazil/klien: isi kalkulator dengan skenario nyata → hasil masuk akal → klik CTA → form RFQ ter-prefill dengan benar

---

## Catatan Penutup

**1. Temuan inkonsistensi taksonomi industri (AR-01) adalah nilai terbesar dari dokumen ini.** Kalau Slice 2 dikerjakan mengikuti draft Epic Doc 2 secara literal, situs akan punya dua daftar "Jenis Industri" yang tidak nyambung sama sekali di dua halaman berbeda — bug UX/data yang baru akan terlihat setelah kedua fitur live berdampingan. Menangkapnya di level task breakdown, sebelum satu baris kode ditulis, adalah tepat sesuai instruksi eksplisit untuk memastikan tidak ada benturan dengan task breakdown epic sebelumnya.

**2. Faktor konversi adalah keputusan bisnis, bukan keputusan teknis** — kode di `E6-S2-CONST-01` sengaja diisolasi supaya mudah direvisi tanpa sentuh logika. Jangan anggap slice ini "selesai" hanya karena kalkulator menghasilkan angka — angka itu perlu divalidasi dulu.

**3. Perubahan ke `RFQForm.tsx` (`E6-S2-FE-06`) adalah satu-satunya titik di Slice 2 yang menyentuh kode Epic 4 CF yang sudah production-live.** Perlakukan dengan kehati-hatian yang sama seperti refactor `AdminNotesEditor` di Epic 5 Admin (R-53) — meskipun perubahan di sini jauh lebih kecil (aditif murni, bukan refactor struktural), regresi di form RFQ berdampak langsung ke fitur paling kritikal bisnis di seluruh situs. QA-03 bersifat blocking, bukan opsional.

---

**File:** `docs/EPIC6/epic6_task_breakdown_slice2_kalkulator-garam.md`
**Versi:** 1.0
**Berdasarkan:** `Epic_Doc2_Epics4-6_RekaCirciptaIndonesia.md` (Epic 6, dengan koreksi taksonomi industri terdokumentasi di AR-01), `PRD_WebGaram_RekaCirciptaIndonesia_v1.docx` §5.1.7, `DESIGN_SYSTEM_RekaCirciptaIndonesia_v2.md` v2.0, `CLAUDE.md`, verifikasi langsung kode `lib/validation/rfq-schema.ts` dan `components/rfq/RFQForm.tsx` (Epic 4 CF), `epic4_task_breakdown_customer-facing.md`, `epic3_task_breakdown_customer-facing.md` (slug produk)
