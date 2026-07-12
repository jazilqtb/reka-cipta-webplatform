// lib/constants/supplier-salt-types.ts
// Epic 5 Customer-Facing (E5-CF-CT-02) — Konstanta jenis garam + satuan
// kapasitas untuk form Jadi Supplier.
//
// WARNING: Enum ini duplicate di:
// - backend/schemas/supplier.py (SUPPLIER_SALT_TYPES, CAPACITY_UNITS)
// - backend/services/email_service.py (_SUPPLIER_SALT_TYPES_LABEL)
// - lib/validation/supplier-schema.ts (Zod enum)
// Kalau ubah, sync manual di 4 tempat (ARCHITECTURE.md §16).

export const SUPPLIER_SALT_TYPES = [
  { value: 'kasar_petani', label: 'Kasar Petani' },
  { value: 'halus_yodium', label: 'Halus Yodium' },
  { value: 'halus_non_yodium', label: 'Halus Non-Yodium' },
  { value: 'industri_spo_m', label: 'Industri (SPO/M)' },
  { value: 'ghpt', label: 'GHPT' },
] as const

export type SupplierSaltTypeValue = (typeof SUPPLIER_SALT_TYPES)[number]['value']

export const CAPACITY_UNITS = [
  { value: 'ton', label: 'Ton' },
  { value: 'kwintal', label: 'Kwintal' },
  { value: 'kg', label: 'Kg' },
] as const

export type CapacityUnitValue = (typeof CAPACITY_UNITS)[number]['value']
