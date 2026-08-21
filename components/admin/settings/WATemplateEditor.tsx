'use client'

// components/admin/settings/WATemplateEditor.tsx
// Epic 4B Slice 3B (E4B-S3B-FE-01) — Edit 6 template WhatsApp per status
// lead (dipakai WATemplateModal, Slice 1). Plain text only — TIDAK ada
// HTML editing (WA tidak render HTML).
//
// NOTE: implemented ahead of Slice 3 trigger criteria — lihat catatan di
// PromptEditor.tsx.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  getWATemplatesAdmin,
  updateWATemplateAdmin,
  resetWATemplateAdminToDefault,
  ApiFetchError,
} from '@/lib/api'
import type { LeadStatus, WATemplateSetting } from '@/types/api'
import { LEAD_STATUSES, LABEL_MAP } from '@/lib/constants/lead-status'
import { Textarea } from '@/components/ui/textarea'
import { TextLineSkeleton } from '@/components/ui/skeletons'
import { cn } from '@/lib/utils'
import { AdminState } from '@/components/admin/ui/AdminState'
import { AdminCard } from '@/components/admin/ui/AdminPrimitives'

const SAMPLE_CONTEXT: Record<string, string> = {
  full_name: 'Budi Santoso',
  company_name: 'PT Contoh Sejahtera',
  volume: '50',
  frequency: 'bulan',
  email: 'budi@contoh.co.id',
  product_names: 'Garam Halus Yodium',
  admin_name: '[Nama Admin]',
}

function renderPreview(text: string): string {
  let out = text
  for (const [key, value] of Object.entries(SAMPLE_CONTEXT)) {
    out = out.replaceAll(`{{${key}}}`, value)
  }
  return out
}

export function WATemplateEditor() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [templates, setTemplates] = useState<Record<string, WATemplateSetting>>({})
  const [activeStatus, setActiveStatus] = useState<LeadStatus>('new')
  const [draftText, setDraftText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  async function fetchTemplates() {
    setIsLoading(true)
    setIsError(false)
    try {
      const data = await getWATemplatesAdmin()
      const map = Object.fromEntries(data.map((t) => [t.status_key, t]))
      setTemplates(map)
      setDraftText(map[activeStatus]?.template_text ?? '')
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
    fetchTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSelectStatus(status: LeadStatus) {
    setActiveStatus(status)
    setDraftText(templates[status]?.template_text ?? '')
  }

  async function handleSave() {
    if (!draftText.trim()) {
      toast.error('Template tidak boleh kosong')
      return
    }
    setIsSaving(true)
    try {
      const updated = await updateWATemplateAdmin(activeStatus, { template_text: draftText })
      setTemplates((prev) => ({ ...prev, [activeStatus]: updated }))
      toast.success(`Template "${LABEL_MAP[activeStatus]}" tersimpan`)
    } catch (err) {
      const msg = err instanceof ApiFetchError ? err.message : 'Gagal menyimpan template'
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleReset() {
    if (!window.confirm(`Reset template "${LABEL_MAP[activeStatus]}" ke default?`)) return
    setIsResetting(true)
    try {
      const updated = await resetWATemplateAdminToDefault(activeStatus)
      setTemplates((prev) => ({ ...prev, [activeStatus]: updated }))
      setDraftText(updated.template_text)
      toast.success('Template direset ke default')
    } catch {
      toast.error('Gagal reset template')
    } finally {
      setIsResetting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <TextLineSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center space-y-4">
        <AdminState tone="error" title="Gagal memuat template WhatsApp" description="Periksa koneksi lalu coba lagi." />
        <button
          type="button"
          onClick={fetchTemplates}
          className="h-9 px-4 rounded-md bg-brand-teal-600 text-white text-sm font-semibold hover:bg-brand-teal-500 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  const activeTemplate = templates[activeStatus]

  return (
    /* POIN 15 (2026-08-21) — tata letak dirombak.
       Masalah versi lama, terukur bukan terasa:
         - Tiga hal berbeda (pilih status, susun teks, lihat hasil) mengalir
           tanpa pemisah apa pun, jadi tidak ada yang menandai mana LANGKAH
           dan mana ALAT.
         - Textarea tanpa <label>. Satu-satunya keterangan adalah kalimat di
           bagian atas kartu, jauh dari kolomnya.
         - Chip placeholder menempel di atas textarea tanpa penjelasan
           bahwa ia bisa diklik untuk menyalin.
         - Preview berlabel "Preview (data contoh)" tapi tidak pernah
           menyebut data contoh mana yang dipakai.
         - Tombol simpan dan "Reset ke Default" berdampingan dengan bobot
           visual setara, padahal satu menyimpan dan satu MEMBUANG pekerjaan.
       Sekarang: tiga <fieldset> bernomor, label eksplisit, dan aksi merusak
       dipisah ke baris sendiri di bawah pemisah. */
    <AdminCard className="p-4 md:p-6">
      <h2 className="font-ui text-base font-semibold text-ink-700">Template Pesan WhatsApp</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Dipakai di tombol &quot;Buat Pesan WA&quot; pada detail lead. Satu template per status,
        supaya pesan untuk lead baru tidak sama dengan pesan untuk lead yang sudah bernegosiasi.
      </p>

      <div className="mt-6 space-y-6">
        {/* ── 1. Pilih status ── */}
        <fieldset>
          <legend className="font-ui mb-2 w-full border-b border-ink-900/[0.07] pb-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400">
            1 · Status lead
          </legend>
          <div className="flex flex-wrap gap-2">
            {LEAD_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => handleSelectStatus(status)}
                aria-pressed={activeStatus === status}
                className={cn(
                  'font-ui h-8 rounded-md px-3 text-xs font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none',
                  activeStatus === status
                    ? 'bg-brand-teal-600 text-white'
                    : 'border border-ink-900/12 text-neutral-600 hover:bg-neutral-50'
                )}
              >
                {LABEL_MAP[status]}
              </button>
            ))}
          </div>
        </fieldset>

        {/* ── 2. Susun pesan ── */}
        <fieldset>
          <legend className="font-ui mb-2 w-full border-b border-ink-900/[0.07] pb-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400">
            2 · Isi pesan
          </legend>

          {activeTemplate && activeTemplate.available_placeholders.length > 0 && (
            <div className="mb-3">
              <p className="font-ui mb-1.5 text-xs text-neutral-500">
                Klik untuk menyalin, lalu tempel di posisi yang Anda inginkan. Saat pesan
                dibuat, penanda ini diganti data lead yang sebenarnya.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {activeTemplate.available_placeholders.map((ph) => (
                  <button
                    key={ph}
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(ph)
                      toast.success(`${ph} disalin`)
                    }}
                    className="mono-tech rounded-sm border border-ink-900/10 bg-neutral-50 px-2 py-1 text-xs text-neutral-600 transition-colors hover:border-brand-teal-600/40 hover:text-brand-teal-700 focus-visible:shadow-focus focus-visible:outline-none"
                    title={`Salin ${ph}`}
                  >
                    {ph}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label htmlFor="wa-template-body" className="font-ui mb-1.5 block text-sm font-medium text-ink-700">
            Teks template
          </label>
          <Textarea
            id="wa-template-body"
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            rows={10}
            disabled={isSaving}
            className="font-mono text-sm leading-relaxed"
          />
        </fieldset>

        {/* ── 3. Pratinjau ── */}
        <fieldset>
          <legend className="font-ui mb-2 w-full border-b border-ink-900/[0.07] pb-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400">
            3 · Pratinjau
          </legend>
          <p className="font-ui mb-2 text-xs text-neutral-500">
            Penanda di atas sudah diganti data contoh, jadi yang terbaca di sini adalah
            bentuk pesan yang benar-benar diterima calon pembeli.
          </p>
          <div className="whitespace-pre-wrap rounded-md border border-ink-900/[0.09] bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-700">
            {renderPreview(draftText)}
          </div>
        </fieldset>
      </div>

      {/* Simpan dipisah dari Reset oleh garis, dan Reset diturunkan bobotnya
          jadi tautan teks: keduanya dulu tampil sebagai tombol setara,
          padahal satu menyimpan pekerjaan dan satu membuangnya. */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink-900/[0.07] pt-4">
        <button
          type="button"
          onClick={handleReset}
          disabled={isSaving || isResetting}
          className="font-ui text-sm font-medium text-neutral-500 underline-offset-4 transition-colors hover:text-danger-600 hover:underline focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-50"
        >
          {isResetting ? 'Mereset…' : 'Kembalikan ke template bawaan'}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="font-ui inline-flex h-9 items-center rounded-md bg-brand-teal-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-teal-500 focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-60"
        >
          {isSaving ? 'Menyimpan…' : 'Simpan perubahan'}
        </button>
      </div>
    </AdminCard>
  )
}
