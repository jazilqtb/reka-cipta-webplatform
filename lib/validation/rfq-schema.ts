// lib/validation/rfq-schema.ts
// Epic 4 Customer-Facing (E4-CF-FE-01) — Zod schema untuk form RFQ
// (/minta-penawaran). Field & enum values HARUS persis sama dengan
// backend RFQSubmitRequest (backend/schemas/rfq.py) — jaga sinkron
// (ARCHITECTURE.md §16). Copy-paste enum values, jangan retype dari memori.

import { z } from 'zod'

export const rfqSubmitSchema = z.object({
  full_name: z.string().min(3, 'Minimal 3 karakter').max(255),
  company_name: z.string().min(1, 'Wajib diisi').max(255),
  position: z.string().max(100).nullable(),
  industry_type: z.enum([
    'makanan-minuman',
    'farmasi',
    'kimia',
    'peternakan',
    'tekstil',
    'pengolahan-ikan',
    'lainnya',
  ]),
  salt_types: z.array(z.string()).min(1, 'Pilih minimal 1 jenis garam'),
  /* CP2 ronde 3 — volume PER JENIS GARAM.
     Dulu satu angka gabungan untuk semua jenis yang dicentang: tidak bisa
     dipecah kembali, sehingga pertanyaan "berapa garam halus yang diminta
     bulan ini" tidak pernah bisa dijawab. */
  items: z
    .array(
      z.object({
        product_slug: z.string().min(1),
        quantity: z.number().positive('Isi volume'),
        unit: z.enum(['kg', 'ton', 'sak_25', 'sak_50']),
      })
    )
    .min(1, 'Isi volume untuk setiap jenis garam yang dipilih'),
  /* `volume_per_month` SENGAJA TIDAK ADA DI SKEMA INI — dan ketiadaannya
     adalah perbaikan, bukan kelalaian.

     CP0 ronde 4: field itu dulu ikut divalidasi di sini sebagai
     `z.number().positive()`, padahal sejak CP2 ronde 3 ia sudah bukan lagi
     isian pengguna — ia DIHITUNG dari `items` di dalam onSubmit. Akibatnya
     nilainya masih 0 (dari defaultValues) pada saat validasi berjalan,
     validasi selalu gagal, `onSubmit` tidak pernah dipanggil, dan karena
     tidak ada satu pun input `volume_per_month` di layar, pesan errornya
     tidak punya tempat untuk muncul. Tombol ditekan → layar diam.

     ATURAN YANG DIAMBIL DARI SINI: skema form hanya memvalidasi apa yang
     BISA DIISI DAN DIPERBAIKI PENGGUNA. Nilai turunan divalidasi oleh
     tipe payload (types/api.ts) dan oleh backend, bukan oleh resolver
     form — resolver form yang menolak field tak terlihat adalah jalan
     buntu tanpa jalan keluar. */
  delivery_frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  delivery_city: z.string().min(1, 'Wajib diisi').max(100),
  email: z.string().email('Format email tidak valid'),
  whatsapp: z.string().regex(/^(\+62|62|0)8\d{7,12}$/, 'Format: 08xx atau +62xx'),
  notes: z.string().max(500, 'Maks 500 karakter').nullable(),
})

export type RFQSubmitFormData = z.infer<typeof rfqSubmitSchema>

export const INDUSTRY_OPTIONS: Array<{ value: RFQSubmitFormData['industry_type']; label: string }> = [
  { value: 'makanan-minuman', label: 'Makanan & Minuman' },
  { value: 'farmasi', label: 'Farmasi' },
  { value: 'kimia', label: 'Kimia' },
  { value: 'peternakan', label: 'Peternakan' },
  { value: 'tekstil', label: 'Tekstil' },
  { value: 'pengolahan-ikan', label: 'Pengolahan Ikan' },
  { value: 'lainnya', label: 'Lainnya' },
]

export const FREQUENCY_OPTIONS: Array<{ value: RFQSubmitFormData['delivery_frequency']; label: string }> = [
  { value: 'weekly', label: 'Mingguan' },
  { value: 'biweekly', label: 'Dua Minggu Sekali' },
  { value: 'monthly', label: 'Bulanan' },
]
