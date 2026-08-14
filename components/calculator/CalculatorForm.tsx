// components/calculator/CalculatorForm.tsx
// Epic 6 Slice 2 (E6-S2-FE-01) — form input kalkulator, 100% client-side
// (tidak ada fetch/backend). Jenis Industri reuse INDUSTRY_OPTIONS Epic 4
// CF persis (AR-01) — bukan daftar draft Epic Doc 2.
//
// Tidak butuh useSyncExternalStore/useSearchParams — kalkulator tidak
// menerima prefill dari URL manapun (arah data satu jalur: kalkulator →
// RFQ, bukan sebaliknya).

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { INDUSTRY_OPTIONS } from '@/lib/validation/rfq-schema'
import { CALCULATOR_RULES, CAPACITY_UNITS, type CapacityUnit, type IndustryValue } from '@/lib/constants/salt-calculator'
import { calculateSaltNeeds, type CalculatorOutput } from '@/lib/calculator'
import { CalculatorIcon } from '@phosphor-icons/react/ssr'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CalculatorResult } from './CalculatorResult'

// RONDE Tahap 11: radius/tinggi/focus-ring dilepas dari sini — sekarang
// diatur terpusat oleh `.form-brand` di globals.css (lihat catatan di
// sana). Sisanya cuma reset appearance <select> bawaan browser.
const selectClassName =
  'w-full border border-input bg-transparent text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50'

interface FormValues {
  industry: IndustryValue
  subOption: string
  capacity: number
  unit: CapacityUnit
}

export function CalculatorForm() {
  const [result, setResult] = useState<CalculatorOutput | null>(null)

  const { register, handleSubmit, watch, reset } = useForm<FormValues>({
    defaultValues: { industry: 'makanan-minuman', subOption: '', capacity: 0, unit: 'per_month' },
  })

  const selectedIndustry = watch('industry')
  const subOptions = CALCULATOR_RULES[selectedIndustry]?.subOptions ?? []

  function onSubmit(values: FormValues) {
    setResult(calculateSaltNeeds(values))
  }

  function handleReset() {
    setResult(null)
    reset()
  }

  if (result) {
    return <CalculatorResult result={result} onReset={handleReset} />
  }

  return (
    // RONDE Tahap 11: `form-brand` (globals.css) memberi radius, tinggi,
    // & focus-glow teal ke seluruh field sekaligus — tidak perlu
    // className per-<Input>/<select>. Panel putih supaya form terbaca
    // sbg satu unit di atas latar salt-50 halaman.
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="form-brand mx-auto max-w-2xl space-y-5 rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm md:p-8"
    >
      <div className="space-y-1.5">
        <Label htmlFor="industry">Jenis Industri</Label>
        <select id="industry" {...register('industry')} className={selectClassName}>
          {INDUSTRY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {subOptions.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="subOption">Jenis Produk yang Diproduksi</Label>
          <select id="subOption" {...register('subOption')} className={selectClassName}>
            <option value="">Pilih jenis produk...</option>
            {subOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="capacity">Kapasitas Produksi</Label>
          <Input
            id="capacity"
            type="number"
            min={0}
            step="0.1"
            {...register('capacity', { valueAsNumber: true, min: 0 })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unit">Satuan</Label>
          <select id="unit" {...register('unit')} className={selectClassName}>
            {CAPACITY_UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="font-ui group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-teal-600 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-teal-500 active:translate-y-0 active:bg-brand-teal-700 focus-visible:outline-none focus-visible:shadow-focus"
      >
        Hitung Kebutuhan
        <CalculatorIcon
          size={16}
          weight="bold"
          className="transition-transform duration-300 group-hover:scale-110"
          aria-hidden="true"
        />
      </button>
    </form>
  )
}
