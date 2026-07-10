// components/rfq/RFQForm.tsx
// Epic 4 Customer-Facing (E4-CF-FE-03) — Form utama /minta-penawaran.
// 'use client' — react-hook-form + Zod, submit ke FastAPI POST /rfq/submit.

'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { submitRFQ, ApiFetchError } from '@/lib/api'
import { rfqSubmitSchema, type RFQSubmitFormData, INDUSTRY_OPTIONS, FREQUENCY_OPTIONS } from '@/lib/validation/rfq-schema'
import type { RFQSubmitRequest } from '@/types/api'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormSection } from './FormSection'
import { InfoBlock } from './InfoBlock'
import { SaltTypeCheckboxGroup } from './SaltTypeCheckboxGroup'

const NOTES_MAX = 500

const selectClassName =
  'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50'

interface AvailableProduct {
  slug: string
  name: string
  code: string
}

interface RFQFormProps {
  availableProducts: AvailableProduct[]
}

// Baca query string via useSyncExternalStore — BUKAN useSearchParams() dari
// next/navigation. useSearchParams() bikin Next.js bailout seluruh subtree
// ke client-side-only rendering saat static generation, yang akan
// menghilangkan form ini dari static HTML /minta-penawaran. Pola identik
// dengan components/forms/ContactForm.tsx (Epic 3 Slice 1).
function subscribeToUrl(callback: () => void) {
  window.addEventListener('popstate', callback)
  return () => window.removeEventListener('popstate', callback)
}

function getUrlSearch(): string {
  return window.location.search
}

function getServerUrlSearch(): string {
  return ''
}

export function RFQForm({ availableProducts }: RFQFormProps) {
  const router = useRouter()

  const urlSearch = useSyncExternalStore(subscribeToUrl, getUrlSearch, getServerUrlSearch)
  const params = new URLSearchParams(urlSearch)
  const prefilledSlug = params.get('produk')
  const prefilledSaltTypes =
    prefilledSlug && availableProducts.some((p) => p.slug === prefilledSlug) ? [prefilledSlug] : []

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RFQSubmitFormData>({
    resolver: zodResolver(rfqSubmitSchema),
    mode: 'onBlur',
    defaultValues: {
      full_name: '',
      company_name: '',
      position: null,
      industry_type: 'makanan-minuman',
      salt_types: [],
      volume_per_month: 0,
      delivery_frequency: 'monthly',
      delivery_city: '',
      email: '',
      whatsapp: '',
      notes: null,
    },
  })

  // Prefill checkbox jenis garam setelah query param terbaca (mount) —
  // sekali per slug terkait, sama pola dengan ContactForm appliedPrefillFor.
  const appliedPrefillFor = useRef<string | null>(null)
  useEffect(() => {
    if (prefilledSaltTypes.length === 0) return
    const key = prefilledSaltTypes.join(',')
    if (appliedPrefillFor.current === key) return
    appliedPrefillFor.current = key
    reset({
      full_name: '',
      company_name: '',
      position: null,
      industry_type: 'makanan-minuman',
      salt_types: prefilledSaltTypes,
      volume_per_month: 0,
      delivery_frequency: 'monthly',
      delivery_city: '',
      email: '',
      whatsapp: '',
      notes: null,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledSaltTypes.join(',')])

  const notesLength = watch('notes')?.length ?? 0

  async function onSubmit(values: RFQSubmitFormData) {
    try {
      const payload: RFQSubmitRequest = {
        ...values,
        position: values.position || null,
        notes: values.notes || null,
      }
      await submitRFQ(payload)
      router.push('/minta-penawaran/terima-kasih')
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 429) {
        toast.error('Terlalu banyak permintaan. Coba lagi dalam 1 jam.')
      } else {
        toast.error('Gagal mengirim. Silakan coba lagi.')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isSubmitting} className="space-y-6">
      <FormSection title="Informasi Perusahaan">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">
            Nama Lengkap <span className="text-danger-600">*</span>
          </Label>
          <Input
            {...register('full_name')}
            id="full_name"
            type="text"
            disabled={isSubmitting}
            aria-invalid={!!errors.full_name}
            aria-describedby={errors.full_name ? 'full_name-error' : undefined}
          />
          {errors.full_name && (
            <p id="full_name-error" className="text-sm text-danger-600">
              {errors.full_name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="company_name">
            Nama Perusahaan <span className="text-danger-600">*</span>
          </Label>
          <Input
            {...register('company_name')}
            id="company_name"
            type="text"
            disabled={isSubmitting}
            aria-invalid={!!errors.company_name}
            aria-describedby={errors.company_name ? 'company_name-error' : undefined}
          />
          {errors.company_name && (
            <p id="company_name-error" className="text-sm text-danger-600">
              {errors.company_name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="position">Jabatan</Label>
          <Input
            {...register('position')}
            id="position"
            type="text"
            disabled={isSubmitting}
            placeholder="Opsional"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="industry_type">
            Jenis Industri <span className="text-danger-600">*</span>
          </Label>
          <select
            {...register('industry_type')}
            id="industry_type"
            disabled={isSubmitting}
            className={selectClassName}
          >
            {INDUSTRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </FormSection>

      <FormSection title="Kebutuhan Produk">
        <Controller
          name="salt_types"
          control={control}
          render={({ field, fieldState }) => (
            <SaltTypeCheckboxGroup
              products={availableProducts}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        <div className="space-y-1.5">
          <Label htmlFor="volume_per_month">
            Volume per Bulan (ton) <span className="text-danger-600">*</span>
          </Label>
          <Input
            {...register('volume_per_month', { valueAsNumber: true })}
            id="volume_per_month"
            type="number"
            step="0.01"
            min="0"
            disabled={isSubmitting}
            aria-invalid={!!errors.volume_per_month}
            aria-describedby={errors.volume_per_month ? 'volume-error' : undefined}
          />
          {errors.volume_per_month && (
            <p id="volume-error" className="text-sm text-danger-600">
              {errors.volume_per_month.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="delivery_frequency">
            Frekuensi Pengiriman <span className="text-danger-600">*</span>
          </Label>
          <select
            {...register('delivery_frequency')}
            id="delivery_frequency"
            disabled={isSubmitting}
            className={selectClassName}
          >
            {FREQUENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="delivery_city">
            Kota Tujuan <span className="text-danger-600">*</span>
          </Label>
          <Input
            {...register('delivery_city')}
            id="delivery_city"
            type="text"
            disabled={isSubmitting}
            aria-invalid={!!errors.delivery_city}
            aria-describedby={errors.delivery_city ? 'city-error' : undefined}
          />
          {errors.delivery_city && (
            <p id="city-error" className="text-sm text-danger-600">
              {errors.delivery_city.message}
            </p>
          )}
        </div>
      </FormSection>

      <FormSection title="Kontak">
        <div className="space-y-1.5">
          <Label htmlFor="email">
            Email <span className="text-danger-600">*</span>
          </Label>
          <Input
            {...register('email')}
            id="email"
            type="email"
            disabled={isSubmitting}
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
          <Label htmlFor="whatsapp">
            WhatsApp <span className="text-danger-600">*</span>
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
          <Label htmlFor="notes">Keterangan</Label>
          <Textarea
            {...register('notes')}
            id="notes"
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

      <InfoBlock>Setelah submit, tim kami akan menghubungi Anda via WhatsApp dalam 1×24 jam.</InfoBlock>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-teal-600 text-sm font-semibold text-white transition-colors duration-100 hover:bg-brand-teal-500 active:bg-brand-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Mengirim...
          </>
        ) : (
          'Kirim & Dapatkan Penawaran'
        )}
      </button>
    </form>
  )
}
