'use client'

// components/rfq/SaltVolumeRows.tsx — CP2 ronde 3
//
// Satu baris volume untuk TIAP jenis garam yang dicentang. Muncul dan
// hilang mengikuti centang di atasnya, jadi tidak ada kolom kosong yang
// menakuti pengisi form.
//
// KENAPA INI TIDAK MENAMBAH BEBAN ISIAN: jumlah kolom yang harus diisi
// TIDAK bertambah untuk pelanggan yang hanya memilih satu jenis garam —
// dulu satu kolom volume, sekarang juga satu. Yang bertambah hanya bagi
// yang memilih beberapa jenis, dan justru merekalah yang datanya paling
// tidak berguna sebelumnya: satu angka gabungan untuk empat jenis tidak
// bisa dipakai menyiapkan penawaran apa pun.

import { RFQ_UNITS, type RFQUnit } from '@/lib/rfq-units'
import { Label } from '@/components/ui/label'

export interface SaltVolumeItem {
  product_slug: string
  quantity: number
  unit: RFQUnit
}

interface Props {
  /** Slug yang sedang dicentang di SaltTypeCheckboxGroup. */
  selectedSlugs: string[]
  /** Peta slug -> nama produk, untuk label baris. */
  productNames: Record<string, string>
  value: SaltVolumeItem[]
  onChange: (next: SaltVolumeItem[]) => void
  error?: string
  disabled?: boolean
}

export function SaltVolumeRows({
  selectedSlugs, productNames, value, onChange, error, disabled,
}: Props) {
  if (selectedSlugs.length === 0) return null

  function rowFor(slug: string): SaltVolumeItem {
    return (
      value.find((v) => v.product_slug === slug) ?? {
        product_slug: slug,
        quantity: 0,
        // Ton sebagai bawaan: satuan yang paling sering dipakai untuk
        // pembelian curah, dan satuan yang dipakai seluruh data lama.
        unit: 'ton' as RFQUnit,
      }
    )
  }

  function patch(slug: string, next: Partial<SaltVolumeItem>) {
    const existing = value.filter((v) => selectedSlugs.includes(v.product_slug))
    const idx = existing.findIndex((v) => v.product_slug === slug)
    const merged = { ...rowFor(slug), ...next }
    const out = idx >= 0
      ? existing.map((v, i) => (i === idx ? merged : v))
      : [...existing, merged]
    onChange(out)
  }

  return (
    <div className="space-y-1.5">
      <Label>
        Volume per jenis garam <span className="text-danger-600">*</span>
      </Label>
      <p className="text-xs text-neutral-500">
        Isi perkiraan kebutuhan untuk setiap jenis yang Anda pilih. Perkiraan
        kasar sudah cukup — angka ini dipakai menyiapkan penawaran, bukan
        sebagai pesanan yang mengikat.
      </p>

      <div className="space-y-2">
        {selectedSlugs.map((slug) => {
          const row = rowFor(slug)
          return (
            <div
              key={slug}
              className="flex flex-wrap items-center gap-2 rounded-md border border-ink-900/10 bg-white p-2.5"
            >
              <span className="min-w-0 flex-1 text-sm text-ink-700">
                {productNames[slug] ?? slug}
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                disabled={disabled}
                value={row.quantity || ''}
                onChange={(e) => patch(slug, { quantity: Number(e.target.value) })}
                aria-label={`Volume ${productNames[slug] ?? slug}`}
                className="h-11 w-24 rounded-md border border-ink-900/15 px-2.5 text-sm text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
              />
              <select
                value={row.unit}
                disabled={disabled}
                onChange={(e) => patch(slug, { unit: e.target.value as RFQUnit })}
                aria-label={`Satuan ${productNames[slug] ?? slug}`}
                className="font-ui h-11 shrink-0 rounded-md border border-ink-900/15 bg-white px-2 text-sm text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
              >
                {RFQ_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      {error && <p className="text-sm text-danger-600">{error}</p>}
    </div>
  )
}
