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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CalculatorResult } from './CalculatorResult'

const selectClassName =
  'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50'

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
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-5">
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

      <Button type="submit" size="lg" className="w-full">
        Hitung Kebutuhan
      </Button>
    </form>
  )
}
