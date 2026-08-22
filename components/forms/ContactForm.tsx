'use client'

// components/forms/ContactForm.tsx
// Epic 2 Slice 3 (E2-S3-FE-04) — Form kontak publik.
// 'use client' — react-hook-form + Zod, submit ke FastAPI POST /contact/send.
//
// RONDE Tahap 10 (2026-08) — "samakan DNA desain /kontak": styling saja
// (className override di Input/Label/Textarea via cn() — primitif
// components/ui/ TIDAK diedit langsung, sesuai CLAUDE.md), logika form
// (validasi, submit, prefill dari query string) TIDAK disentuh sama
// sekali. BUG SENDIRI ditemukan saat QA ronde ini: directive 'use
// client' ASLI sempat tidak sengaja terhapus saat mengedit blok komentar
// di atas file (komentar "'use client' — react-hook-form..." di baris
// bawah ini HANYA teks penjelas, BUKAN directive-nya) — Next.js langsung
// gagal build (RSC mencoba import useForm/useSyncExternalStore yg cuma
// valid di Client Component). Sudah dikembalikan sbg baris literal
// pertama file, sesuai syarat Next.js (harus statement pertama).
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { PackageIcon, PaperPlaneTiltIcon, CircleNotchIcon } from '@phosphor-icons/react/ssr'
import { apiFetch, ApiFetchError } from '@/lib/api'
import {
  SubmitFeedback,
  failureFromStatus,
  type SubmitFailure,
} from '@/components/forms/SubmitFeedback'
import type { ContactRequest, ContactResponse } from '@/types/api'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const FIELD_CLASS = 'rounded-xl border-ink-900/15 focus-visible:border-brand-teal-500 focus-visible:ring-brand-teal-500/30'

const contactSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Format email tidak valid'),
  phone: z
    .string()
    .regex(/^(\+62|62|0)8\d{8,12}$/, 'Format WA Indonesia tidak valid')
    .optional()
    .or(z.literal('')),
  message: z.string().min(10, 'Pesan minimal 10 karakter').max(1000, 'Maks 1000 karakter'),
})

type ContactFormValues = z.infer<typeof contactSchema>

const MESSAGE_MAX = 1000

interface AvailableProduct {
  slug: string
  name: string
}

interface ContactFormProps {
  availableProducts?: AvailableProduct[]
}

function buildPrefillMessage(productName: string, intent: string | null): string {
  if (intent === 'sample') {
    return `Saya tertarik untuk meminta sampel produk ${productName}. Mohon informasi terkait pengiriman sampel.`
  }
  if (intent === 'quotation') {
    return `Saya ingin mendapatkan penawaran harga untuk produk ${productName}. Estimasi kebutuhan: [mohon lengkapi].`
  }
  return ''
}

// Baca query string via useSyncExternalStore — BUKAN useSearchParams() dari
// next/navigation. useSearchParams() bikin Next.js bailout seluruh subtree
// ke client-side-only rendering saat static generation
// (BAILOUT_TO_CLIENT_SIDE_RENDERING), yang akan menghilangkan seluruh form
// ini dari static HTML /kontak. getServerSnapshot selalu '' (server tidak
// tahu query param); React otomatis koreksi ke nilai client sesaat setelah
// hydration tanpa mismatch. Lihat catatan teknis Epic 3 Slice 1.
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

export function ContactForm({ availableProducts = [] }: ContactFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', phone: '', message: '' },
  })

  const messageLength = watch('message')?.length ?? 0

  /* CP0 ronde 4 — jalur kegagalan yang terlihat, pola sama dengan RFQForm.
     Form ini juga dulu hanya memunculkan toast di pojok, yang hilang sendiri
     sebelum pengguna sempat menggulir ke isian yang bermasalah. */
  const [failure, setFailure] = useState<SubmitFailure | null>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const revealFailure = useCallback((next: SubmitFailure) => {
    setFailure(next)
    requestAnimationFrame(() => {
      feedbackRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
  }, [])

  const urlSearch = useSyncExternalStore(subscribeToUrl, getUrlSearch, getServerUrlSearch)
  const params = new URLSearchParams(urlSearch)
  const produkSlug = params.get('produk')
  const intent = params.get('intent')
  const linkedProduct = produkSlug
    ? (availableProducts.find((p) => p.slug === produkSlug) ?? null)
    : null

  // reset() react-hook-form dipanggil sekali per produk terkait yang
  // terdeteksi — bukan raw useState setter, jadi bukan pola "setState di
  // effect" yang bermasalah untuk hydration; ini memang side effect yang sah
  // (menyinkronkan form dengan sumber eksternal setelah mount).
  const appliedPrefillFor = useRef<string | null>(null)
  useEffect(() => {
    if (!linkedProduct || appliedPrefillFor.current === linkedProduct.slug) return
    appliedPrefillFor.current = linkedProduct.slug

    const initialMessage = buildPrefillMessage(linkedProduct.name, intent)
    if (initialMessage) {
      reset({ name: '', email: '', phone: '', message: initialMessage })
    }
  }, [linkedProduct, intent, reset])

  async function onSubmit(values: ContactFormValues) {
    try {
      const payload: ContactRequest = {
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        message: values.message,
      }
      await apiFetch<ContactResponse>('/contact/send', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setFailure(null)
      toast.success('Pesan Anda berhasil terkirim. Kami akan merespons dalam 1 × 24 jam kerja.')
      /* reset() hanya di jalur BERHASIL. Di jalur gagal isian dipertahankan —
         lihat catatan yang sama di RFQForm. */
      reset()
    } catch (err) {
      const next =
        err instanceof ApiFetchError
          ? failureFromStatus(err.status, err.status === 0 ? undefined : err.message)
          : ({ kind: 'server' } as SubmitFailure)
      revealFailure(next)
      toast.error(
        next.kind === 'rate_limit'
          ? 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.'
          : 'Gagal mengirim pesan. Lihat penjelasan di atas formulir.'
      )
    }
  }

  function onInvalid(errs: FieldErrors<ContactFormValues>) {
    const LABELS: Record<string, string> = {
      name: 'Nama Lengkap',
      email: 'Email',
      phone: 'Nomor Telepon',
      message: 'Pesan',
    }
    const keys = Object.keys(errs)
    revealFailure({ kind: 'invalid', fields: keys.map((k) => LABELS[k] ?? k) })
    toast.error('Ada isian yang belum benar. Lihat penjelasan di atas formulir.')
    const first = keys.find((k) => document.querySelector(`[name="${k}"]`))
    if (first) document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus({ preventScroll: true })
  }

  return (
    <div className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm md:p-8">
      <h2 className="font-ui text-2xl font-semibold text-ink-700">Kirim Pesan</h2>

      {linkedProduct && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-brand-teal-600/15 bg-brand-teal-50 p-3.5 text-sm text-ink-700">
          <PackageIcon size={16} weight="duotone" className="shrink-0 text-brand-teal-600" aria-hidden="true" />
          Terkait produk: <strong className="font-semibold">{linkedProduct.name}</strong>
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        noValidate
        aria-busy={isSubmitting}
        className="mt-6 space-y-5"
      >
        <div ref={feedbackRef}>
          <SubmitFeedback failure={failure} onRetry={() => formRef.current?.requestSubmit()} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name">
            Nama Lengkap <span className="text-danger-600">*</span>
          </Label>
          <Input
            {...register('name')}
            id="name"
            type="text"
            disabled={isSubmitting}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className={FIELD_CLASS}
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-danger-600">
              {errors.name.message}
            </p>
          )}
        </div>

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
            className={FIELD_CLASS}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-danger-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Nomor WhatsApp</Label>
          <Input
            {...register('phone')}
            id="phone"
            type="tel"
            placeholder="08xxxxxxxxxx"
            disabled={isSubmitting}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            className={FIELD_CLASS}
          />
          {errors.phone && (
            <p id="phone-error" className="text-sm text-danger-600">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="message">
            Pesan <span className="text-danger-600">*</span>
          </Label>
          <Textarea
            {...register('message')}
            id="message"
            rows={5}
            maxLength={MESSAGE_MAX}
            disabled={isSubmitting}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'message-error' : undefined}
            className={FIELD_CLASS}
          />
          <div className="flex items-center justify-between">
            {errors.message ? (
              <p id="message-error" className="text-sm text-danger-600">
                {errors.message.message}
              </p>
            ) : (
              <span />
            )}
            <span className="text-xs text-neutral-400">
              {messageLength}/{MESSAGE_MAX}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'font-ui group flex w-full items-center justify-center gap-2 md:ml-auto md:w-auto',
            'h-11 rounded-xl bg-brand-teal-600 px-6 text-sm font-semibold text-white',
            'transition-colors duration-100 hover:bg-brand-teal-500 active:bg-brand-teal-700',
            'focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-60'
          )}
        >
          {isSubmitting ? (
            <>
              <CircleNotchIcon size={16} weight="bold" className="animate-spin" aria-hidden="true" />
              Mengirim...
            </>
          ) : (
            <>
              Kirim Pesan
              <PaperPlaneTiltIcon size={16} weight="bold" className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
