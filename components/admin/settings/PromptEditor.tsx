'use client'

// components/admin/settings/PromptEditor.tsx
// Epic 4B Slice 3A (E4B-S3A-FE-01) — Structured 4-field prompt editor
// (R-40: role/task/constraints/output_format, BUKAN 1 textarea besar,
// supaya admin edit tidak bisa accidentally wipe seluruh prompt) +
// Advanced Mode defaults (temperature/max_tokens) + rollback history
// (R-41) + layout customizer (Slice 3C, embedded — 1 row DB yang sama).
//
// State owner tunggal untuk ProposalSettings — fetch-on-mount sama pola
// dengan SettingsForm (Epic 2 Slice 3). LayoutCustomizer & HistoryPanel
// dirender sebagai child terkontrol supaya save salah satu section tidak
// menimpa field section lain (1 row DB, PUT selalu full payload).
//
// NOTE: implemented ahead of Slice 3 trigger criteria (task breakdown
// "Trigger Criteria" — Slice 1+2 live 2+ minggu, 5+ proposal terkirim ke
// customer, klien explicit request) per instruksi eksplisit supaya kode
// siap dipakai begitu Anthropic API key tersedia. Belum pernah di-demo
// ke klien — JANGAN treat sebagai fitur yang sudah divalidasi.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  getProposalSettings,
  updateProposalSettings,
  resetProposalSettingsToDefault,
  ApiFetchError,
} from '@/lib/api'
import type { ProposalSettings } from '@/types/api'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { TextLineSkeleton } from '@/components/ui/skeletons'
import { HistoryPanel } from './HistoryPanel'
import { LayoutCustomizer } from './LayoutCustomizer'
import { AdminState } from '@/components/admin/ui/AdminState'

const promptSchema = z.object({
  prompt_role: z.string().min(1, 'Wajib diisi'),
  prompt_task: z.string().min(1, 'Wajib diisi'),
  prompt_constraints: z.string().min(1, 'Wajib diisi'),
  prompt_output_format: z.string().min(1, 'Wajib diisi'),
  default_temperature: z.number().min(0, 'Min 0').max(1.5, 'Maks 1.5'),
  default_max_tokens: z.number().int().min(500, 'Min 500').max(8000, 'Maks 8000'),
})

type PromptFormValues = z.infer<typeof promptSchema>

const EMPTY_DEFAULTS: PromptFormValues = {
  prompt_role: '',
  prompt_task: '',
  prompt_constraints: '',
  prompt_output_format: '',
  default_temperature: 0.7,
  default_max_tokens: 4096,
}

function toFormValues(settings: ProposalSettings): PromptFormValues {
  return {
    prompt_role: settings.prompt_role,
    prompt_task: settings.prompt_task,
    prompt_constraints: settings.prompt_constraints,
    prompt_output_format: settings.prompt_output_format,
    default_temperature: settings.default_temperature,
    default_max_tokens: settings.default_max_tokens,
  }
}

export function PromptEditor() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  // Full row — dibutuhkan supaya save prompt tidak menimpa layout_* (1
  // PUT = full payload, lihat komentar di atas).
  const [settings, setSettings] = useState<ProposalSettings | null>(null)
  const [historyVersion, setHistoryVersion] = useState(0)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: EMPTY_DEFAULTS,
  })

  async function fetchSettings() {
    setIsLoading(true)
    setIsError(false)
    try {
      const data = await getProposalSettings()
      setSettings(data)
      reset(toFormValues(data))
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(values: PromptFormValues) {
    if (!settings) return
    try {
      const updated = await updateProposalSettings({
        ...values,
        layout_header_text: settings.layout_header_text,
        layout_footer_text: settings.layout_footer_text,
        layout_logo_url: settings.layout_logo_url,
        layout_primary_color: settings.layout_primary_color,
      })
      setSettings(updated)
      reset(toFormValues(updated))
      setHistoryVersion((v) => v + 1)
      toast.success('Prompt tersimpan. Perubahan berlaku untuk generate proposal berikutnya.')
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 401) {
        router.push('/admin/login')
        return
      }
      toast.error('Gagal menyimpan prompt. Silakan coba lagi.')
    }
  }

  async function handleResetToDefault() {
    if (!window.confirm('Reset prompt ke default? Perubahan Anda akan hilang (masih bisa di-rollback via riwayat di bawah).')) {
      return
    }
    setIsResetting(true)
    try {
      const updated = await resetProposalSettingsToDefault()
      setSettings(updated)
      reset(toFormValues(updated))
      setHistoryVersion((v) => v + 1)
      toast.success('Prompt direset ke default.')
    } catch {
      toast.error('Gagal reset ke default.')
    } finally {
      setIsResetting(false)
    }
  }

  function handleSettingsRestored(updated: ProposalSettings) {
    setSettings(updated)
    reset(toFormValues(updated))
    setHistoryVersion((v) => v + 1)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <TextLineSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (isError || !settings) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center space-y-4">
        <AdminState tone="error" title="Gagal memuat pengaturan proposal" description="Periksa koneksi lalu coba lagi." />
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
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8">
        <h2 className="text-lg font-semibold text-ink-700">Prompt AI Proposal Generator</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Edit instruksi yang dikirim ke AI saat admin klik &quot;Generate Proposal&quot;. Perubahan
          berlaku untuk proposal yang di-generate setelah disimpan — proposal yang sudah ada
          tidak berubah.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isSubmitting} className="mt-6 space-y-5">
          <SectionField
            id="prompt_role"
            label="1. Role (Peran AI)"
            helper="Siapa AI ini mewakili? Contoh: &quot;Kamu adalah proposal writer untuk distributor garam industri.&quot;"
            error={errors.prompt_role?.message}
            disabled={isSubmitting}
            registration={register('prompt_role')}
          />
          <SectionField
            id="prompt_task"
            label="2. Task (Tugas)"
            helper="Apa yang harus AI hasilkan? Termasuk struktur section proposal."
            error={errors.prompt_task?.message}
            disabled={isSubmitting}
            registration={register('prompt_task')}
            rows={8}
          />
          <SectionField
            id="prompt_constraints"
            label="3. Constraints (Batasan)"
            helper="Aturan yang harus diikuti — bahasa, panjang, hal yang dilarang."
            error={errors.prompt_constraints?.message}
            disabled={isSubmitting}
            registration={register('prompt_constraints')}
            rows={6}
          />
          <SectionField
            id="prompt_output_format"
            label="4. Output Format (Format Keluaran)"
            helper="Struktur HTML/styling output. JANGAN edit tanpa paham teknis — bisa merusak PDF."
            error={errors.prompt_output_format?.message}
            disabled={isSubmitting}
            registration={register('prompt_output_format')}
            rows={6}
          />

          <div className="border-t border-neutral-200 pt-5">
            <h3 className="text-sm font-semibold text-ink-700 mb-1">Default Advanced Mode</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Dipakai kalau admin generate tanpa override manual di panel lead (Quick Mode selalu
              pakai nilai ini).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="default_temperature">Temperature (0–1.5)</Label>
                <Input
                  {...register('default_temperature', { valueAsNumber: true })}
                  id="default_temperature"
                  type="number"
                  min={0}
                  max={1.5}
                  step={0.1}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.default_temperature}
                />
                <p className="text-xs text-neutral-500">Semakin tinggi = semakin kreatif, kurang konsisten.</p>
                {errors.default_temperature && (
                  <p role="alert" className="text-sm text-danger-600">
                    {errors.default_temperature.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="default_max_tokens">Max Tokens (500–8000)</Label>
                <Input
                  {...register('default_max_tokens', { valueAsNumber: true })}
                  id="default_max_tokens"
                  type="number"
                  min={500}
                  max={8000}
                  step={100}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.default_max_tokens}
                />
                <p className="text-xs text-neutral-500">Panjang maksimum output. Semakin tinggi = semakin mahal.</p>
                {errors.default_max_tokens && (
                  <p role="alert" className="text-sm text-danger-600">
                    {errors.default_max_tokens.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              disabled={isSubmitting || isResetting}
              className="h-10 px-4 rounded-md border border-danger-200 text-sm font-medium text-danger-600 hover:bg-danger-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResetting ? 'Mereset...' : 'Reset ke Default'}
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => reset(toFormValues(settings))}
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
          </div>
        </form>
      </div>

      <LayoutCustomizer settings={settings} onSaved={handleSettingsRestored} />

      <HistoryPanel key={historyVersion} onRestored={handleSettingsRestored} />
    </div>
  )
}

function SectionField({
  id,
  label,
  helper,
  error,
  disabled,
  registration,
  rows = 4,
}: {
  id: string
  label: string
  helper: string
  error?: string
  disabled: boolean
  registration: ReturnType<ReturnType<typeof useForm<PromptFormValues>>['register']>
  rows?: number
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <p className="text-xs text-neutral-500">{helper}</p>
      <Textarea
        {...registration}
        id={id}
        rows={rows}
        disabled={disabled}
        className="font-mono text-sm"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  )
}
