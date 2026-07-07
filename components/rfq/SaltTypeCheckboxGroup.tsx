// components/rfq/SaltTypeCheckboxGroup.tsx
// Epic 4 Customer-Facing (E4-CF-FE-04) — Multi-select checkbox jenis garam.
// Dikontrol via react-hook-form Controller di RFQForm (custom component
// tidak forward ref, butuh Controller — bukan register()).

'use client'

interface Product {
  slug: string
  name: string
  code: string
}

interface SaltTypeCheckboxGroupProps {
  products: Product[]
  value: string[]
  onChange: (value: string[]) => void
  error?: string
}

export function SaltTypeCheckboxGroup({ products, value, onChange, error }: SaltTypeCheckboxGroupProps) {
  function toggle(slug: string) {
    if (value.includes(slug)) {
      onChange(value.filter((s) => s !== slug))
    } else {
      onChange([...value, slug])
    }
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-danger-600/30 bg-danger-100 p-3 text-sm text-danger-600">
        Katalog produk sedang tidak tersedia. Silakan coba lagi nanti atau hubungi kami langsung.
      </div>
    )
  }

  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium text-ink-700">
        Jenis Garam Dibutuhkan <span className="text-danger-600">*</span>
      </legend>
      <div className="space-y-2">
        {products.map((product) => (
          <label
            key={product.slug}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50 has-[:checked]:border-brand-teal-500 has-[:checked]:bg-brand-teal-50"
          >
            <input
              type="checkbox"
              checked={value.includes(product.slug)}
              onChange={() => toggle(product.slug)}
              className="h-5 w-5 flex-shrink-0 rounded border-neutral-300 text-brand-teal-600 focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <span className="text-sm">
              <strong className="text-ink-700">{product.name}</strong>{' '}
              <span className="mono-tech text-xs text-neutral-500">({product.code})</span>
            </span>
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
