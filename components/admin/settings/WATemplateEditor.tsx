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
        <p className="text-neutral-600">Gagal memuat template WhatsApp.</p>
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
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8">
      <h2 className="text-lg font-semibold text-ink-700">Template Pesan WhatsApp</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Dipakai di modal &quot;Buat Pesan WA&quot; pada halaman detail lead (1 template per status).
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {LEAD_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => handleSelectStatus(status)}
            className={cn(
              'h-8 px-3 rounded-full text-xs font-medium transition-colors',
              activeStatus === status
                ? 'bg-brand-teal-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            {LABEL_MAP[status]}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {activeTemplate && (
            <div className="flex flex-wrap gap-1.5">
              {activeTemplate.available_placeholders.map((ph) => (
                <button
                  key={ph}
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(ph)
                    toast.success(`${ph} disalin`)
                  }}
                  className="text-xs font-mono px-2 py-1 rounded-md bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
                  title="Klik untuk salin"
                >
                  {ph}
                </button>
              ))}
            </div>
          )}
          <Textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            rows={12}
            disabled={isSaving}
            className="text-sm"
          />
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving || isResetting}
              className="h-10 px-4 rounded-md border border-danger-200 text-sm font-medium text-danger-600 hover:bg-danger-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResetting ? 'Mereset...' : 'Reset ke Default'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="h-10 px-5 rounded-md bg-brand-teal-600 text-white text-sm font-semibold hover:bg-brand-teal-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Preview (data contoh)</label>
          <div className="w-full h-full min-h-[280px] border border-neutral-200 rounded-md bg-neutral-50 p-4 text-sm text-neutral-700 whitespace-pre-wrap">
            {renderPreview(draftText)}
          </div>
        </div>
      </div>
    </div>
  )
}
