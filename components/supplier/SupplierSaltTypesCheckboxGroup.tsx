// components/supplier/SupplierSaltTypesCheckboxGroup.tsx
// Epic 5 Customer-Facing (E5-CF-FE-03) — Multi-select checkbox jenis garam
// yang TERSEDIA dari supplier. Component baru, BUKAN reuse
// components/rfq/SaltTypeCheckboxGroup.tsx — itu konsumsi katalog produk
// dari DB, ini konsumsi konstanta enum fixed (5 jenis) dari
// lib/constants/supplier-salt-types.ts. Konteks bisnis beda, memaksa
// reuse akan bikin salah satu sisi fragile.
//
// Dikontrol via react-hook-form Controller di SupplierRegistrationForm
// (custom component tidak forward ref, butuh Controller — bukan register()).

'use client'

import { SUPPLIER_SALT_TYPES } from '@/lib/constants/supplier-salt-types'

interface SupplierSaltTypesCheckboxGroupProps {
  value: string[]
  onChange: (value: string[]) => void
  error?: string
}

export function SupplierSaltTypesCheckboxGroup({
  value,
  onChange,
  error,
}: SupplierSaltTypesCheckboxGroupProps) {
  function toggle(saltType: string) {
    if (value.includes(saltType)) {
      onChange(value.filter((v) => v !== saltType))
    } else {
      onChange([...value, saltType])
    }
  }

  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium text-ink-700">
        Jenis Garam Tersedia <span className="text-danger-600">*</span>
      </legend>
      <div className="space-y-2">
        {SUPPLIER_SALT_TYPES.map((type) => (
          <label
            key={type.value}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50 has-[:checked]:border-brand-teal-500 has-[:checked]:bg-brand-teal-50"
          >
            <input
              type="checkbox"
              checked={value.includes(type.value)}
              onChange={() => toggle(type.value)}
              className="h-5 w-5 flex-shrink-0 rounded border-neutral-300 text-brand-teal-600 focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <span className="text-sm text-ink-700">{type.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-danger-600" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}
