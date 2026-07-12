// lib/validation/supplier-schema.ts
// Epic 5 Customer-Facing (E5-CF-FE-01) — Zod schema untuk form Jadi Supplier
// (/jadi-supplier). Constraint HARUS persis sama dengan backend
// SupplierRegisterRequest (backend/schemas/supplier.py) — jaga sinkron
// (ARCHITECTURE.md §16). Copy-paste enum values, jangan retype dari memori.
//
// Normalisasi WhatsApp TIDAK dilakukan di sini — backend authoritative
// (konsisten dengan lib/validation/rfq-schema.ts).

import { z } from 'zod'
import {
  SUPPLIER_SALT_TYPES,
  CAPACITY_UNITS,
  type SupplierSaltTypeValue,
  type CapacityUnitValue,
} from '@/lib/constants/supplier-salt-types'

// Cast preserva literal union (bukan widen ke `string`) supaya inferred
// type z.infer match persis dengan SupplierRegisterRequest['capacity_unit']
// di types/api.ts.
const SALT_TYPE_VALUES = SUPPLIER_SALT_TYPES.map((t) => t.value) as [
  SupplierSaltTypeValue,
  ...SupplierSaltTypeValue[],
]
const CAPACITY_UNIT_VALUES = CAPACITY_UNITS.map((u) => u.value) as [
  CapacityUnitValue,
  ...CapacityUnitValue[],
]

export const supplierRegisterSchema = z.object({
  business_name: z.string().min(2, 'Minimal 2 karakter').max(255),
  location_city: z.string().min(1, 'Wajib diisi').max(100),
  location_province: z.string().min(1, 'Wajib diisi').max(100),
  salt_types_available: z.array(z.enum(SALT_TYPE_VALUES)).min(1, 'Pilih minimal 1 jenis garam'),
  capacity_per_month: z.number().positive('Kapasitas harus lebih dari 0'),
  capacity_unit: z.enum(CAPACITY_UNIT_VALUES),
  whatsapp: z.string().regex(/^(\+62|62|0)8\d{7,12}$/, 'Format: 08xx atau +62xx'),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  additional_notes: z.string().max(500, 'Maks 500 karakter').optional(),
})

export type SupplierRegisterFormData = z.infer<typeof supplierRegisterSchema>
