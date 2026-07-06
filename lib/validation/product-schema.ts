// lib/validation/product-schema.ts
// Epic 3B Slice 1 (E3B-S1-FE-05 / AR-08) — Zod schema untuk form edit
// produk. Field-nya HARUS persis sama dengan backend ProductUpdateRequest
// (backend/schemas/product.py) — jaga sinkron (ARCHITECTURE.md §16).

import { z } from 'zod'

export const productUpdateSchema = z.object({
  name: z.string().min(3, 'Minimal 3 karakter').max(255),
  tagline: z.string().max(300).nullable(),
  description: z.string().max(5000).nullable(),
  specs: z.record(z.string(), z.union([z.string(), z.number()])),
  industries: z.array(z.string().min(1)).min(1, 'Minimal 1 industri'),
  is_sni: z.boolean(),
  is_active: z.boolean(),
  sort_order: z.number().int().nonnegative(),
})

export type ProductUpdateFormData = z.infer<typeof productUpdateSchema>
