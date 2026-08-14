// components/supplier/SupplierRegistrationForm.tsx
// Epic 5 Customer-Facing (E5-CF-FE-05) — Form utama /jadi-supplier.
// 'use client' — react-hook-form + Zod, submit ke FastAPI POST /supplier/register.
// Reuse components/rfq/FormSection.tsx + InfoBlock.tsx (generic layout
// wrapper, tidak ada logic spesifik RFQ) — konsisten dengan RFQForm.tsx.

'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CircleNotchIcon } from '@phosphor-icons/react/ssr'
import { registerSupplier, ApiFetchError } from '@/lib/api'
import {
  supplierRegisterSchema,
  type SupplierRegisterFormData,
} from '@/lib/validation/supplier-schema'
import { CAPACITY_UNITS } from '@/lib/constants/supplier-salt-types'
import type { SupplierRegisterRequest } from '@/types/api'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormSection } from '@/components/rfq/FormSection'
import { InfoBlock } from '@/components/rfq/InfoBlock'
import { SupplierSaltTypesCheckboxGroup } from './SupplierSaltTypesCheckboxGroup'

const NOTES_MAX = 500

const selectClassName =
  'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50'

export function SupplierRegistrationForm() {
  const router = useRouter()
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SupplierRegisterFormData>({
    resolver: zodResolver(supplierRegisterSchema),
    mode: 'onBlur',
    defaultValues: {
      business_name: '',
      location_city: '',
      location_province: '',
      salt_types_available: [],
      capacity_per_month: 0,
      capacity_unit: 'ton',
      whatsapp: '',
      email: '',
      additional_notes: '',
    },
  })

  const notesLength = watch('additional_notes')?.length ?? 0

  function startRateLimitCountdown() {
    setRateLimitCountdown(60)
    const interval = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function onSubmit(values: SupplierRegisterFormData) {
    try {
      // R-48: string kosong dari input HARUS dikirim sebagai null, jangan ""
      const payload: SupplierRegisterRequest = {
        ...values,
        email: values.email || null,
        additional_notes: values.additional_notes || null,
      }
      await registerSupplier(payload)
      router.push('/jadi-supplier/terima-kasih')
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 429) {
        toast.error('Terlalu banyak permintaan. Coba lagi dalam 1 jam.')
        startRateLimitCountdown()
      } else {
        toast.error('Gagal mengirim pendaftaran. Silakan coba lagi.')
      }
    }
  }

  const submitDisabled = isSubmitting || rateLimitCountdown > 0

  return (
    // RONDE Tahap 11: `form-brand` — styling seluruh field (radius,
    // tinggi, focus glow teal) datang dari SATU kelas induk di
    // globals.css, bukan className per-<Input>. Logika form di file ini
    // sengaja tidak disentuh sama sekali.
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isSubmitting} className="form-brand space-y-6">
      <FormSection title="Informasi Usaha">
        <div className="space-y-1.5">
          <Label htmlFor="business_name">
            Nama / Nama Usaha <span className="text-danger-600">*</span>
          </Label>
          <Input
            {...register('business_name')}
            id="business_name"
            type="text"
            disabled={isSubmitting}
            aria-invalid={!!errors.business_name}
            aria-describedby={errors.business_name ? 'business_name-error' : undefined}
          />
          {errors.business_name && (
            <p id="business_name-error" className="text-sm text-danger-600">
              {errors.business_name.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="location_city">
              Kota <span className="text-danger-600">*</span>
            </Label>
            <Input
              {...register('location_city')}
              id="location_city"
              type="text"
              disabled={isSubmitting}
              aria-invalid={!!errors.location_city}
              aria-describedby={errors.location_city ? 'location_city-error' : undefined}
            />
            {errors.location_city && (
              <p id="location_city-error" className="text-sm text-danger-600">
                {errors.location_city.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location_province">
              Provinsi <span className="text-danger-600">*</span>
            </Label>
            <Input
              {...register('location_province')}
              id="location_province"
              type="text"
              disabled={isSubmitting}
              aria-invalid={!!errors.location_province}
              aria-describedby={errors.location_province ? 'location_province-error' : undefined}
            />
            {errors.location_province && (
              <p id="location_province-error" className="text-sm text-danger-600">
                {errors.location_province.message}
              </p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection title="Produk Garam">
        <Controller
          name="salt_types_available"
          control={control}
          render={({ field, fieldState }) => (
            <SupplierSaltTypesCheckboxGroup
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="capacity_per_month">
              Kapasitas per Bulan <span className="text-danger-600">*</span>
            </Label>
            <Input
              {...register('capacity_per_month', { valueAsNumber: true })}
              id="capacity_per_month"
              type="number"
              step="0.01"
              min="0"
              disabled={isSubmitting}
              aria-invalid={!!errors.capacity_per_month}
              aria-describedby={errors.capacity_per_month ? 'capacity-error' : undefined}
            />
            {errors.capacity_per_month && (
              <p id="capacity-error" className="text-sm text-danger-600">
                {errors.capacity_per_month.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="capacity_unit">
              Satuan <span className="text-danger-600">*</span>
            </Label>
            <select
              {...register('capacity_unit')}
              id="capacity_unit"
              disabled={isSubmitting}
              className={selectClassName}
            >
              {CAPACITY_UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FormSection>

      <FormSection title="Kontak">
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp">
            Nomor WhatsApp <span className="text-danger-600">*</span>
          </Label>
          <Input
            {...register('whatsapp')}
            id="whatsapp"
            type="tel"
            placeholder="08xxxxxxxxxx"
            disabled={isSubmitting}
            aria-invalid={!!errors.whatsapp}
            aria-describedby={errors.whatsapp ? 'whatsapp-error' : undefined}
          />
          {errors.whatsapp && (
            <p id="whatsapp-error" className="text-sm text-danger-600">
              {errors.whatsapp.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            {...register('email')}
            id="email"
            type="email"
            disabled={isSubmitting}
            placeholder="Opsional"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-danger-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="additional_notes">Keterangan Tambahan</Label>
          <Textarea
            {...register('additional_notes')}
            id="additional_notes"
            rows={4}
            maxLength={NOTES_MAX}
            disabled={isSubmitting}
            placeholder="Opsional"
          />
          <div className="flex justify-end">
            <span className="text-xs text-neutral-400">
              {notesLength}/{NOTES_MAX}
            </span>
          </div>
        </div>
      </FormSection>

      <InfoBlock>Setelah submit, tim kami akan menghubungi Anda via WhatsApp dalam 2–3 hari kerja untuk verifikasi.</InfoBlock>

      <button
        type="submit"
        disabled={submitDisabled}
        className="font-ui flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-teal-600 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-teal-500 active:translate-y-0 active:bg-brand-teal-700 focus-visible:outline-none focus-visible:shadow-focus disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <CircleNotchIcon size={16} weight="bold" className="animate-spin" aria-hidden="true" />
            Mengirim...
          </>
        ) : rateLimitCountdown > 0 ? (
          `Coba lagi dalam ${rateLimitCountdown} detik`
        ) : (
          'Daftar Sebagai Supplier'
        )}
      </button>
    </form>
  )
}
