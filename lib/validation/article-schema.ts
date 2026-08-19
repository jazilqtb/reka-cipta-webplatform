// lib/validation/article-schema.ts
// Epic 6 Admin Slice 1 (E6-ADM-S1-FE-02) — Zod schema untuk form artikel.
// Field-nya HARUS persis sama dengan backend ArticleUpdateRequest
// (backend/schemas/article.py) — jaga sinkron (ARCHITECTURE.md §16).

import { z } from 'zod'

export const articleFormSchema = z.object({
  title: z.string().min(3, 'Minimal 3 karakter').max(500),
  slug: z
    .string()
    .min(1, 'Slug wajib diisi')
    .max(500)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Hanya huruf kecil, angka, dan tanda hubung'),
  category: z.enum(['education', 'company_news']),
  meta_description: z.string().max(300).nullable(),
  content: z.string().min(1, 'Konten wajib diisi'),

  // CP3 — field SEO. Batasnya mengikuti backend (200/500), BUKAN batas
  // tampilan hasil pencarian (~60/~160). Batas tampilan itu panduan, bukan
  // aturan: Google memotong yang kelewat panjang, tidak menolaknya. Form
  // menampilkannya sebagai peringatan lembut, bukan error yang memblokir
  // penyimpanan.
  meta_title: z.string().max(200).nullable(),
  canonical_url: z
    .string()
    .max(500)
    .refine((v) => !v || /^https?:\/\//.test(v), 'Harus URL lengkap diawali http:// atau https://')
    .nullable(),
})

export type ArticleFormData = z.infer<typeof articleFormSchema>
