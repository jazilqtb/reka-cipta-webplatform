// components/rfq/RFQForm.tsx
// Epic 4 Customer-Facing (E4-CF-FE-03) — Form utama /minta-penawaran.
// 'use client' — react-hook-form + Zod, submit ke FastAPI POST /rfq/submit.

'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useForm, Controller, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CircleNotchIcon } from '@phosphor-icons/react/ssr'
import { submitRFQ, ApiFetchError } from '@/lib/api'
import {
  SubmitFeedback,
  failureFromStatus,
  type SubmitFailure,
} from '@/components/forms/SubmitFeedback'
import { rfqSubmitSchema, type RFQSubmitFormData, INDUSTRY_OPTIONS, FREQUENCY_OPTIONS } from '@/lib/validation/rfq-schema'
import { SaltVolumeRows, type SaltVolumeItem } from '@/components/rfq/SaltVolumeRows'
import { toKg, type RFQUnit } from '@/lib/rfq-units'
import type { RFQSubmitRequest } from '@/types/api'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormSection } from './FormSection'
import { InfoBlock } from './InfoBlock'
import { SaltTypeCheckboxGroup } from './SaltTypeCheckboxGroup'

const NOTES_MAX = 500

/* Label field dalam bahasa pengguna, untuk ringkasan kegagalan validasi.
   Kuncinya SENGAJA menutup seluruh field skema, termasuk yang punya pesan
   error sendiri di bawah kolomnya: ringkasan di atas menjawab "apa yang
   salah" tanpa pengguna harus menggulir dulu untuk menemukannya. */
const FIELD_LABELS: Record<string, string> = {
  full_name: 'Nama Lengkap',
  company_name: 'Nama Perusahaan',
  position: 'Jabatan',
  industry_type: 'Jenis Industri',
  salt_types: 'Jenis Garam Dibutuhkan',
  items: 'Volume per jenis garam',
  delivery_frequency: 'Frekuensi Pengiriman',
  delivery_city: 'Kota Tujuan',
  email: 'Email',
  whatsapp: 'WhatsApp',
  notes: 'Keterangan',
}

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
  // Epic 6 Slice 2 (E6-S2-FE-06) — prefill volume dari Kalkulator Garam
  // (?volume=), dalam satuan TON. Aditif murni: kalau param tidak ada atau
  // tidak valid, form terbuka dengan baris volume kosong seperti biasa.
  const prefilledVolumeRaw = params.get('volume')
  const prefilledVolume =
    prefilledVolumeRaw && Number(prefilledVolumeRaw) > 0 ? Number(prefilledVolumeRaw) : null

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
      items: [],
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
    if (prefilledSaltTypes.length === 0 && prefilledVolume === null) return
    const key = `${prefilledSaltTypes.join(',')}|${prefilledVolume ?? ''}`
    if (appliedPrefillFor.current === key) return
    appliedPrefillFor.current = key
    /* `?volume=` datang dari /kalkulator dalam satuan TON
       (CalculatorResult.estimateMaxTon). Sebelum CP0 ronde 4 angka itu
       diisikan ke `volume_per_month` — field yang sejak CP2 sudah tidak
       punya input di layar, jadi hasil kalkulator masuk ke tempat yang
       tidak bisa dilihat maupun dikoreksi pengguna. Sekarang ia mengisi
       baris volume produk yang bersangkutan, yaitu tempat angka itu
       memang seharusnya muncul dan bisa diubah. */
    const prefilledItems =
      prefilledVolume !== null && prefilledSaltTypes.length > 0
        ? [{ product_slug: prefilledSaltTypes[0], quantity: prefilledVolume, unit: 'ton' as RFQUnit }]
        : []
    reset({
      full_name: '',
      company_name: '',
      position: null,
      industry_type: 'makanan-minuman',
      salt_types: prefilledSaltTypes,
      items: prefilledItems,
      delivery_frequency: 'monthly',
      delivery_city: '',
      email: '',
      whatsapp: '',
      notes: null,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledSaltTypes.join(','), prefilledVolume])

  /* CP2 ronde 3 — sisi frontend dari "jeda 2-3 detik".
     `isSubmitting` milik react-hook-form menjadi false BEGITU onSubmit
     selesai. Tapi router.push() di App Router tidak menunggu halaman tujuan
     selesai dirender — jadi indikator mati lebih dulu, lalu layar baru
     berganti beberapa saat kemudian. Persis gejala yang dilaporkan.
     `isLeaving` sengaja TIDAK pernah direset: komponen ini ikut hilang saat
     navigasi berhasil, jadi indikator hidup tepat sampai halaman tujuan
     benar-benar tampil. */
  const [isLeaving, setIsLeaving] = useState(false)
  const busy = isSubmitting || isLeaving

  /* CP0 ronde 4 — keadaan kegagalan yang MENETAP.
     `failure === null` berarti belum ada percobaan yang gagal. Setiap
     cabang di onSubmit/onInvalid WAJIB mengisi state ini atau membersihkannya;
     tidak ada jalan keluar yang meninggalkannya apa adanya tanpa disengaja. */
  const [failure, setFailure] = useState<SubmitFailure | null>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  /* Kegagalan yang muncul di luar layar sama tidak terlihatnya dengan
     kegagalan yang tidak muncul sama sekali. Form ini panjang; tombol
     kirim ada di paling bawah, ringkasannya di paling atas. */
  const revealFailure = useCallback((next: SubmitFailure) => {
    setFailure(next)
    requestAnimationFrame(() => {
      feedbackRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
  }, [])

  /* Prefetch halaman tujuan begitu form tampil. Halaman terima kasih adalah
     satu-satunya tujuan dari sini, jadi memuatnya lebih awal tidak pernah
     sia-sia — dan menghilangkan pengambilan dokumen dari jalur kritis
     setelah tombol ditekan. */
  useEffect(() => {
    router.prefetch('/minta-penawaran/terima-kasih')
  }, [router])

  const notesLength = watch('notes')?.length ?? 0
  const watchedSaltTypes = watch('salt_types') ?? []
  /* Peta slug -> nama, supaya baris volume menampilkan nama produk dan
     bukan slug mentah. */
  const productNameMap = Object.fromEntries(
    availableProducts.map((p) => [p.slug, p.name])
  ) as Record<string, string>

  async function onSubmit(values: RFQSubmitFormData) {
    try {
      /* volume_per_month DIHITUNG, bukan diketik. Backend masih menulis
         `rfq_leads` yang kolomnya bersatuan ton, jadi total seluruh item
         dikonversi ke kg lalu dibagi 1000. Angka ini murni untuk menjaga
         struktur lama tetap konsisten; sumber kebenarannya adalah `items`. */
      const totalKg = (values.items ?? []).reduce(
        (sum, it) => sum + toKg(it.quantity, it.unit as RFQUnit), 0
      )
      const payload: RFQSubmitRequest = {
        ...values,
        volume_per_month: Math.max(totalKg / 1000, 0.001),
        position: values.position || null,
        notes: values.notes || null,
      }
      await submitRFQ(payload)
      setFailure(null)
      setIsLeaving(true)
      router.push('/minta-penawaran/terima-kasih')
    } catch (err) {
      /* PENTING: TIDAK ada reset() di sini. Kegagalan tidak boleh menghapus
         apa yang sudah diketik — form ini panjang, dan mengetik ulang
         sepuluh field karena servernya sempat batuk adalah cara tercepat
         kehilangan lead yang sudah mau mengirim. */
      const next =
        err instanceof ApiFetchError
          ? failureFromStatus(err.status, err.status === 0 ? undefined : err.message)
          : /* Bukan ApiFetchError sama sekali: kesalahan tak terduga di sisi
               klien. Ia tetap harus punya keadaan yang terlihat — inilah
               cabang yang dulu berakhir diam. */
            ({ kind: 'server' } as SubmitFailure)
      revealFailure(next)
      toast.error(
        next.kind === 'rate_limit'
          ? 'Terlalu banyak permintaan. Coba lagi dalam 1 jam.'
          : 'Gagal mengirim. Lihat penjelasan di atas formulir.'
      )
    }
  }

  /* Cabang kedua handleSubmit — yang selama ini TIDAK ADA, dan itulah sebab
     poin 4. Tanpa handler ini, validasi yang gagal pada field yang tidak
     punya input di layar (`volume_per_month`) berakhir tanpa jejak apa pun:
     tidak ada request, tidak ada pesan, tidak ada perubahan tampilan.

     Handler ini menutup KELASNYA, bukan hanya kasusnya: field apa pun yang
     ditolak akan disebutkan namanya di sini, termasuk field yang belum
     punya tempat menampilkan errornya sendiri. */
  function onInvalid(errs: FieldErrors<RFQSubmitFormData>) {
    const keys = Object.keys(errs)
    const labels = keys.map((k) => FIELD_LABELS[k] ?? k)
    revealFailure({ kind: 'invalid', fields: labels })
    toast.error('Ada isian yang belum benar. Lihat penjelasan di atas formulir.')

    /* Fokus ke field bermasalah yang pertama, kalau ia memang punya kontrol
       di layar. Kalau tidak punya (kasus yang mustahil setelah perbaikan
       ini, tapi bisa lahir lagi), ringkasan di atas tetap menyebut namanya —
       jadi jalan keluarnya tidak pernah bergantung pada adanya kontrol. */
    const firstWithControl = keys.find((k) => document.querySelector(`[name="${k}"]`))
    if (firstWithControl) {
      const el = document.querySelector<HTMLElement>(`[name="${firstWithControl}"]`)
      el?.focus({ preventScroll: true })
    }
  }

  return (
    // RONDE Tahap 11: `form-brand` — radius, tinggi, & focus-glow teal
    // seluruh field diatur terpusat di globals.css. Logika RFQ (Zod,
    // prefill dari /kalkulator, submit ke FastAPI) tidak disentuh.
    <form
      ref={formRef}
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      noValidate
      aria-busy={busy}
      className="form-brand space-y-6"
    >
      {/* Keadaan kegagalan berada DI ATAS formulir, bukan hanya sebagai
          toast di pojok: ia harus masih ada saat pengguna menggulir untuk
          memperbaiki isiannya. */}
      <div ref={feedbackRef}>
        <SubmitFeedback failure={failure} onRetry={() => formRef.current?.requestSubmit()} />
      </div>

      <FormSection title="Informasi Perusahaan">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">
            Nama Lengkap <span className="text-danger-600">*</span>
          </Label>
          <Input
            {...register('full_name')}
            id="full_name"
            type="text"
            disabled={busy}
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
            disabled={busy}
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
            disabled={busy}
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
            disabled={busy}
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

        {/* CP2 ronde 3 — satu baris volume per jenis garam, menggantikan
            satu angka gabungan. `volume_per_month` tetap dikirim ke backend
            (struktur lama masih ditulis) tapi kini DIHITUNG dari items,
            bukan diketik pengguna. */}
        <Controller
          name="items"
          control={control}
          render={({ field, fieldState }) => (
            <SaltVolumeRows
              selectedSlugs={watchedSaltTypes}
              productNames={productNameMap}
              value={(field.value ?? []) as SaltVolumeItem[]}
              onChange={field.onChange}
              error={fieldState.error?.message}
              disabled={busy}
            />
          )}
        />

        <div className="space-y-1.5">
          <Label htmlFor="delivery_frequency">
            Frekuensi Pengiriman <span className="text-danger-600">*</span>
          </Label>
          <select
            {...register('delivery_frequency')}
            id="delivery_frequency"
            disabled={busy}
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
            disabled={busy}
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
            disabled={busy}
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
            disabled={busy}
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
            disabled={busy}
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
        disabled={busy}
        className="font-ui flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-teal-600 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-teal-500 active:translate-y-0 active:bg-brand-teal-700 focus-visible:outline-none focus-visible:shadow-focus disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? (
          <>
            <CircleNotchIcon size={16} weight="bold" className="animate-spin" aria-hidden="true" />
            {isLeaving ? 'Membuka halaman konfirmasi…' : 'Mengirim…'}
          </>
        ) : (
          'Kirim & Dapatkan Penawaran'
        )}
      </button>
    </form>
  )
}
