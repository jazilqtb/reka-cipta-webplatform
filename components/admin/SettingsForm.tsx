'use client'

// components/admin/SettingsForm.tsx
// Epic 2 Slice 3 (E2-S3-AD-02) — Form edit company_settings (6 field
// editable) + read-only info block (4 stat non-editable).

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { apiFetch, ApiFetchError } from '@/lib/api'
import type { CompanySettingsResponse } from '@/types/api'
import { revalidateSettings } from '@/app/admin/settings/actions'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TextLineSkeleton } from '@/components/ui/skeletons'
import { AdminState } from '@/components/admin/ui/AdminState'

const settingsSchema = z.object({
  whatsapp_1: z.string().regex(/^0\d{9,13}$/, 'Format: 08xxxxxxxxxx'),
  whatsapp_2: z.string().regex(/^0\d{9,13}$/, 'Format: 08xxxxxxxxxx').or(z.literal('')),
  email: z.string().email('Format email tidak valid'),
  address: z.string().min(10, 'Alamat minimal 10 karakter').max(500),
  gmaps_embed_url: z
    .string()
    .startsWith(
      'https://www.google.com/maps/embed',
      'URL harus dimulai dengan https://www.google.com/maps/embed'
    )
    .or(z.literal('')),
  wa_default_message: z.string().min(10, 'Pesan minimal 10 karakter').max(300),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

const EMPTY_DEFAULTS: SettingsFormValues = {
  whatsapp_1: '',
  whatsapp_2: '',
  email: '',
  address: '',
  gmaps_embed_url: '',
  wa_default_message: '',
}

const READ_ONLY_KEYS = ['partner_count', 'cities_served', 'total_distribution_tons', 'client_list'] as const
const READ_ONLY_LABELS: Record<(typeof READ_ONLY_KEYS)[number], string> = {
  partner_count: 'Mitra Aktif',
  cities_served: 'Kota Dilayani',
  total_distribution_tons: 'Total Distribusi (TON)',
  client_list: 'Daftar Klien',
}

function settingsResponseToFormValues(response: CompanySettingsResponse) {
  const map = Object.fromEntries(response.data.map((item) => [item.key, item.value]))

  const editable: SettingsFormValues = {
    whatsapp_1: map.whatsapp_1 ?? '',
    whatsapp_2: map.whatsapp_2 ?? '',
    email: map.email ?? '',
    address: map.address ?? '',
    gmaps_embed_url: map.gmaps_embed_url ?? '',
    wa_default_message: map.wa_default_message ?? '',
  }

  const readOnly: Record<string, string> = {}
  for (const key of READ_ONLY_KEYS) {
    readOnly[key] = map[key] ?? ''
  }

  return { editable, readOnly }
}

export function SettingsForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [readOnlyData, setReadOnlyData] = useState<Record<string, string>>({})
  const [serverValues, setServerValues] = useState<SettingsFormValues>(EMPTY_DEFAULTS)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: EMPTY_DEFAULTS,
  })

  async function fetchSettings() {
    setIsLoading(true)
    setIsError(false)
    try {
      const response = await apiFetch<CompanySettingsResponse>('/settings/', { auth: true })
      const { editable, readOnly } = settingsResponseToFormValues(response)
      reset(editable)
      setServerValues(editable)
      setReadOnlyData(readOnly)
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 401) {
        router.push('/admin/login')
        return
      }
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch-on-mount yang disengaja (arsitektur admin: plain useEffect +
  // useState, bukan SWR/React Query — ARCHITECTURE.md §6.3). setState
  // di dalam fetchSettings() mensinkronkan state React dengan data
  // server, ini adalah use case effect yang valid, bukan anti-pattern.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(values: SettingsFormValues) {
    try {
      const response = await apiFetch<CompanySettingsResponse>('/settings/', {
        method: 'PATCH',
        body: JSON.stringify({ updates: values }),
        auth: true,
      })

      toast.success('Perubahan berhasil disimpan. Halaman publik telah diperbarui.')

      try {
        await revalidateSettings()
      } catch {
        toast.warning('Perubahan tersimpan, tapi halaman publik mungkin butuh beberapa saat untuk update.')
      }

      const { editable, readOnly } = settingsResponseToFormValues(response)
      reset(editable)
      setServerValues(editable)
      setReadOnlyData(readOnly)
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 401) {
        router.push('/admin/login')
        return
      }
      toast.error('Gagal menyimpan. Silakan coba lagi. Jika berulang, hubungi developer.')
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <TextLineSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center space-y-4">
        <AdminState tone="error" title="Gagal memuat pengaturan" description="Periksa koneksi lalu coba lagi." />
        <button
          type="button"
          onClick={fetchSettings}
          className="h-9 px-4 rounded-md bg-brand-teal-600 text-white text-sm font-semibold hover:bg-brand-teal-500 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-neutral-200 bg-white p-6 md:p-8">
      <h2 className="text-lg font-semibold text-ink-700">Informasi Kontak</h2>

      {/* Enam field ini bukan satu jenis hal: tiga adalah SALURAN yang
          dipakai pelanggan menghubungi, dua adalah LOKASI fisik, satu
          adalah teks yang terkirim atas nama perusahaan. Sebelumnya
          ketiganya bertumpuk sebagai satu daftar rata, jadi admin harus
          membaca tiap label untuk tahu sedang menyunting apa. <fieldset>
          bukan cuma kosmetik — pembaca layar mengumumkan <legend> saat
          fokus masuk ke grup, jadi pengelompokannya ikut terdengar. */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isSubmitting} className="mt-6 space-y-7">
        <fieldset className="space-y-5">
          <legend className="font-ui mb-3 w-full border-b border-ink-900/[0.07] pb-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400">
            Saluran kontak
          </legend>
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp_1">Nomor WhatsApp Utama</Label>
          <Input
            {...register('whatsapp_1')}
            id="whatsapp_1"
            type="tel"
            placeholder="082136096528"
            disabled={isSubmitting}
            aria-invalid={!!errors.whatsapp_1}
            aria-describedby={errors.whatsapp_1 ? 'whatsapp_1-error' : undefined}
          />
          {errors.whatsapp_1 && (
            <p id="whatsapp_1-error" role="alert" className="text-sm text-danger-600">
              {errors.whatsapp_1.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="whatsapp_2">Nomor WhatsApp Alternatif</Label>
          <Input
            {...register('whatsapp_2')}
            id="whatsapp_2"
            type="tel"
            placeholder="087839031378"
            disabled={isSubmitting}
            aria-invalid={!!errors.whatsapp_2}
            aria-describedby={errors.whatsapp_2 ? 'whatsapp_2-error' : undefined}
          />
          {errors.whatsapp_2 && (
            <p id="whatsapp_2-error" role="alert" className="text-sm text-danger-600">
              {errors.whatsapp_2.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email Kontak</Label>
          <Input
            {...register('email')}
            id="email"
            type="email"
            placeholder="contact@example.com"
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="text-sm text-danger-600">
              {errors.email.message}
            </p>
          )}
        </div>

        </fieldset>

        <fieldset className="space-y-5">
          <legend className="font-ui mb-3 w-full border-b border-ink-900/[0.07] pb-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400">
            Lokasi
          </legend>
        <div className="space-y-1.5">
          <Label htmlFor="address">Alamat Kantor</Label>
          <Textarea
            {...register('address')}
            id="address"
            rows={2}
            placeholder="Jl. ..."
            disabled={isSubmitting}
            aria-invalid={!!errors.address}
            aria-describedby={errors.address ? 'address-error' : undefined}
          />
          {errors.address && (
            <p id="address-error" role="alert" className="text-sm text-danger-600">
              {errors.address.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gmaps_embed_url">URL Embed Google Maps</Label>
          <Input
            {...register('gmaps_embed_url')}
            id="gmaps_embed_url"
            type="url"
            placeholder="https://www.google.com/maps/embed?pb=..."
            disabled={isSubmitting}
            aria-invalid={!!errors.gmaps_embed_url}
            aria-describedby="gmaps_embed_url-helper"
          />
          <p id="gmaps_embed_url-helper" className="text-xs text-neutral-500">
            Cara mendapat URL: buka Google Maps → cari alamat → Bagikan → Sematkan peta → salin
            URL dari atribut <code>src</code> di HTML.
          </p>
          {errors.gmaps_embed_url && (
            <p role="alert" className="text-sm text-danger-600">
              {errors.gmaps_embed_url.message}
            </p>
          )}
        </div>

        </fieldset>

        <fieldset className="space-y-5">
          <legend className="font-ui mb-3 w-full border-b border-ink-900/[0.07] pb-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400">
            Pesan otomatis
          </legend>
        <div className="space-y-1.5">
          <Label htmlFor="wa_default_message">Pesan Default WhatsApp</Label>
          <Textarea
            {...register('wa_default_message')}
            id="wa_default_message"
            rows={3}
            placeholder="Halo, saya ingin..."
            disabled={isSubmitting}
            aria-invalid={!!errors.wa_default_message}
            aria-describedby="wa_default_message-helper"
          />
          <p id="wa_default_message-helper" className="text-xs text-neutral-500">
            Pesan ini akan otomatis terisi ketika pelanggan klik tombol WhatsApp di halaman
            Kontak.
          </p>
          {errors.wa_default_message && (
            <p role="alert" className="text-sm text-danger-600">
              {errors.wa_default_message.message}
            </p>
          )}
        </div>

        </fieldset>

        <div className="flex items-center justify-end gap-3 border-t border-ink-900/[0.07] pt-4">
          <button
            type="button"
            onClick={() => reset(serverValues)}
            disabled={isSubmitting || !isDirty}
            className="h-10 px-4 rounded-md border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-5 rounded-md bg-brand-teal-600 text-white text-sm font-semibold hover:bg-brand-teal-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>

      <div className="mt-8 bg-neutral-50 border border-dashed border-neutral-300 rounded-xl p-4">
        <p className="text-sm font-semibold text-neutral-700">Statistik Dinamis (Read-only)</p>
        <p className="mt-1 text-xs text-neutral-500">
          Nilai berikut ditampilkan di Beranda dan akan diatur otomatis dari CRM setelah Epic 4
          selesai. Untuk sementara, hubungi developer jika perlu update.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {READ_ONLY_KEYS.map((key) => (
            <div key={key}>
              <p className="text-xs text-neutral-400">{READ_ONLY_LABELS[key]}</p>
              <p className="text-sm font-medium text-neutral-700 truncate" title={readOnlyData[key]}>
                {readOnlyData[key] || '—'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
