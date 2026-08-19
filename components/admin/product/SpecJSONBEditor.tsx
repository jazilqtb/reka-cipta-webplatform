'use client'

// components/admin/product/SpecJSONBEditor.tsx
// Epic 3B Slice 1 (E3B-S1-FE-06 / AR-04) — Editor untuk kolom JSONB
// `products.specs`. Komponen paling kompleks di Slice 1 — WAJIB ikuti
// pola state R-15 (guide Epic 3B) untuk hindari infinite render loop:
//
// - Internal state `rows` HANYA di-sync dari prop `value` SEKALI saat
//   mount (useEffect dengan deps kosong `[]`).
// - Setiap perubahan (add/edit/delete) memanggil `onChange` SECARA
//   EKSPLISIT di event handler — TIDAK ada useEffect yang sync
//   rows → onChange (itu yang bikin infinite loop: onChange → parent
//   re-render → prop value ganti reference → effect fire lagi → ...).

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { BrandDialogContent } from '@/components/brand/BrandDialogContent'
import { SPEC_LABEL_REGISTRY, getSpecLabel } from '@/lib/product-spec-labels'

const CUSTOM_KEY_PATTERN = /^[a-z][a-z0-9_]*$/
const NUMERIC_UNITS = new Set(['%', 'ppm', 'mm'])

interface SpecRow {
  key: string
  value: string | number
  isCustom: boolean
  customLabel?: string
  customUnit?: string
}

interface SpecJSONBEditorProps {
  value: Record<string, string | number>
  onChange: (value: Record<string, string | number>) => void
}

function objectToArray(obj: Record<string, string | number>): SpecRow[] {
  return Object.entries(obj).map(([key, val]) => ({
    key,
    value: val,
    isCustom: !SPEC_LABEL_REGISTRY[key],
  }))
}

function arrayToObject(rows: SpecRow[]): Record<string, string | number> {
  return rows.reduce(
    (acc, { key, value }) => {
      if (key) acc[key] = value
      return acc
    },
    {} as Record<string, string | number>
  )
}

function castSpecValue(key: string, raw: string): string | number {
  const unit = getSpecLabel(key).unit
  if (NUMERIC_UNITS.has(unit)) {
    const parsed = Number(raw)
    if (raw.trim() !== '' && !Number.isNaN(parsed)) return parsed
  }
  return raw
}

export function SpecJSONBEditor({ value, onChange }: SpecJSONBEditorProps) {
  const [rows, setRows] = useState<SpecRow[]>(() => objectToArray(value))
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false)
  const [customKeyInput, setCustomKeyInput] = useState('')
  const [customLabelInput, setCustomLabelInput] = useState('')
  const [customUnitInput, setCustomUnitInput] = useState('')
  const [customKeyError, setCustomKeyError] = useState<string | null>(null)

  // Initial sync HANYA — deps kosong, tidak jalan lagi setelah mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRows(objectToArray(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const usedKeys = new Set(rows.map((r) => r.key))
  const availableRegistryKeys = Object.keys(SPEC_LABEL_REGISTRY).filter((k) => !usedKeys.has(k))

  function commitRows(next: SpecRow[]) {
    setRows(next)
    onChange(arrayToObject(next))
  }

  function handleAddFromRegistry(key: string) {
    if (!key || usedKeys.has(key)) return
    commitRows([...rows, { key, value: '', isCustom: false }])
  }

  function handleAddCustom() {
    const key = customKeyInput.trim()
    if (!CUSTOM_KEY_PATTERN.test(key)) {
      setCustomKeyError('Format tidak valid. Gunakan huruf kecil dan underscore, mis. nacl_kering.')
      return
    }
    if (usedKeys.has(key)) {
      setCustomKeyError('Field dengan key ini sudah ada.')
      return
    }

    commitRows([
      ...rows,
      {
        key,
        value: '',
        isCustom: true,
        customLabel: customLabelInput.trim() || key,
        customUnit: customUnitInput.trim() || '-',
      },
    ])

    setCustomKeyInput('')
    setCustomLabelInput('')
    setCustomUnitInput('')
    setCustomKeyError(null)
    setIsCustomDialogOpen(false)
  }

  function handleValueChange(key: string, raw: string) {
    commitRows(rows.map((r) => (r.key === key ? { ...r, value: castSpecValue(key, raw) } : r)))
  }

  function handleCustomUnitChange(key: string, unit: string) {
    commitRows(rows.map((r) => (r.key === key ? { ...r, customUnit: unit } : r)))
  }

  function handleRemove(key: string) {
    commitRows(rows.filter((r) => r.key !== key))
  }

  return (
    <div className="space-y-3">
      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                <th className="px-3 py-2">Parameter</th>
                <th className="px-3 py-2">Nilai</th>
                <th className="px-3 py-2">Satuan</th>
                <th className="px-3 py-2 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((row) => {
                const meta = getSpecLabel(row.key)
                const label = row.isCustom ? (row.customLabel ?? row.key) : meta.label
                return (
                  <tr key={row.key}>
                    <td className="px-3 py-2">
                      {label}
                      {row.isCustom && (
                        <span className="ml-1.5 text-xs text-neutral-400">(Custom)</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) => handleValueChange(row.key, e.target.value)}
                        className="h-8 w-full rounded-md border border-neutral-300 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {row.isCustom ? (
                        <input
                          type="text"
                          value={row.customUnit ?? ''}
                          onChange={(e) => handleCustomUnitChange(row.key, e.target.value)}
                          className="h-8 w-20 rounded-md border border-neutral-300 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600"
                        />
                      ) : (
                        <span className="text-neutral-500">{meta.unit}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemove(row.key)}
                        aria-label={`Hapus ${label}`}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-neutral-400 hover:bg-danger-50 hover:text-danger-600 transition-colors"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <select
          value=""
          onChange={(e) => handleAddFromRegistry(e.target.value)}
          disabled={availableRegistryKeys.length === 0}
          className="h-9 rounded-md border border-neutral-300 px-3 text-sm text-neutral-700 disabled:opacity-50"
        >
          <option value="">+ Tambah Field</option>
          {availableRegistryKeys.map((key) => (
            <option key={key} value={key}>
              {SPEC_LABEL_REGISTRY[key].label} ({SPEC_LABEL_REGISTRY[key].unit})
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setIsCustomDialogOpen(true)}
          className="h-9 px-3 rounded-md border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          + Custom Field
        </button>
      </div>

      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        {/* Override bg-popover/text-popover-foreground/ring-foreground dari
            components/ui/dialog.tsx — token shadcn itu tidak pernah dipetakan
            di globals.css (frozen, hanya brand-teal/ink/sand/neutral yang ada
            di @theme), jadi tanpa override className di sini popup rendernya
            transparan/tanpa warna teks. */}
        <BrandDialogContent className="bg-white text-neutral-900 ring-1 ring-neutral-200 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-ink-700">Tambah Custom Field</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="custom-key" className="text-sm font-medium text-neutral-700">
                Kunci (key)
              </label>
              <input
                id="custom-key"
                type="text"
                value={customKeyInput}
                onChange={(e) => {
                  setCustomKeyInput(e.target.value)
                  setCustomKeyError(null)
                }}
                placeholder="nacl_prcnt_dry"
                className="h-9 w-full rounded-md border border-neutral-300 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600"
              />
              <p className="text-xs text-neutral-400">Format: huruf_kecil_underscore</p>
              {customKeyError && (
                <p className="text-xs text-danger-600" role="alert">
                  {customKeyError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="custom-label" className="text-sm font-medium text-neutral-700">
                Label untuk Ditampilkan
              </label>
              <input
                id="custom-label"
                type="text"
                value={customLabelInput}
                onChange={(e) => setCustomLabelInput(e.target.value)}
                placeholder="Kadar NaCl Kering"
                className="h-9 w-full rounded-md border border-neutral-300 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="custom-unit" className="text-sm font-medium text-neutral-700">
                Satuan
              </label>
              <input
                id="custom-unit"
                type="text"
                value={customUnitInput}
                onChange={(e) => setCustomUnitInput(e.target.value)}
                placeholder="%"
                className="h-9 w-full rounded-md border border-neutral-300 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsCustomDialogOpen(false)}
              className="h-9 px-4 rounded-md border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleAddCustom}
              className="h-9 px-4 rounded-md bg-brand-teal-600 text-white text-sm font-semibold hover:bg-brand-teal-500 transition-colors"
            >
              Tambah
            </button>
          </DialogFooter>
        </BrandDialogContent>
      </Dialog>
    </div>
  )
}
