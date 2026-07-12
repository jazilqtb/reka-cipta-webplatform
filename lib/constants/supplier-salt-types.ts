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

// Lookup derived dari SUPPLIER_SALT_TYPES — single source untuk admin UI
// (SaltTypesCell, SupplierInfoCard) supaya label map tidak diketik ulang
// di 2 tempat berbeda (lihat R-53/R-46 discipline, Epic 5 Admin guide).
export const SUPPLIER_SALT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  SUPPLIER_SALT_TYPES.map((t) => [t.value, t.label])
)

export const CAPACITY_UNITS = [
  { value: 'ton', label: 'Ton' },
  { value: 'kwintal', label: 'Kwintal' },
  { value: 'kg', label: 'Kg' },
] as const

export type CapacityUnitValue = (typeof CAPACITY_UNITS)[number]['value']

export const CAPACITY_UNIT_LABELS: Record<string, string> = Object.fromEntries(
  CAPACITY_UNITS.map((u) => [u.value, u.label])
)
