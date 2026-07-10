'use client'

// components/admin/settings/EmailTemplateEditor.tsx
// Epic 4B Slice 3B (E4B-S3B-FE-01) — Edit email konfirmasi RFQ (Epic 4
// CF). Saat ini hanya 1 template ('rfq_confirmation') — kalau nanti
// nambah jenis email lain, list-view bisa ditambah di atas editor ini.
//
// NOTE: implemented ahead of Slice 3 trigger criteria — lihat catatan di
// PromptEditor.tsx.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  getEmailTemplates,
  updateEmailTemplate,
  resetEmailTemplateToDefault,
  ApiFetchError,
} from '@/lib/api'
import type { EmailTemplate } from '@/types/api'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TextLineSkeleton } from '@/components/ui/skeletons'

const SAMPLE_CONTEXT: Record<string, string> = {
  full_name: 'Budi Santoso',
  product_names: 'Garam Halus Yodium (PRO YD)',
  company_name: 'PT Contoh Sejahtera',
  volume_per_month: '50',
  frequency_label: 'bulan',
  delivery_city: 'Surabaya',
  whatsapp_masked: '+6281****5678',
}

function renderPreview(text: string): string {
  let out = text
  for (const [key, value] of Object.entries(SAMPLE_CONTEXT)) {
    out = out.replaceAll(`{{${key}}}`, value)
  }
  return out
}

export function EmailTemplateEditor() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  async function fetchTemplate() {
    setIsLoading(true)
    setIsError(false)
    try {
      const templates = await getEmailTemplates()
      const rfqConfirmation = templates.find((t) => t.template_type === 'rfq_confirmation') ?? templates[0]
      if (!rfqConfirmation) throw new Error('NO_TEMPLATE')
      setTemplate(rfqConfirmation)
      setSubject(rfqConfirmation.subject)
      setBodyHtml(rfqConfirmation.body_html)
      setBodyText(rfqConfirmation.body_text)
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
    fetchTemplate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave() {
    if (!template) return
    if (!subject.trim() || !bodyHtml.trim() || !bodyText.trim()) {
      toast.error('Subject, body HTML, dan body text wajib diisi')
      return
    }
    setIsSaving(true)
    try {
      const updated = await updateEmailTemplate(template.template_type, {
        subject,
        body_html: bodyHtml,
        body_text: bodyText,
      })
      setTemplate(updated)
      toast.success('Template email tersimpan')
    } catch (err) {
      const msg = err instanceof ApiFetchError ? err.message : 'Gagal menyimpan template'
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleReset() {
    if (!template) return
    if (!window.confirm('Reset template email ke default?')) return
    setIsResetting(true)
    try {
      const updated = await resetEmailTemplateToDefault(template.template_type)
      setTemplate(updated)
      setSubject(updated.subject)
      setBodyHtml(updated.body_html)
      setBodyText(updated.body_text)
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

  if (isError || !template) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center space-y-4">
        <p className="text-neutral-600">Gagal memuat template email.</p>
        <button
          type="button"
          onClick={fetchTemplate}
          className="h-9 px-4 rounded-md bg-brand-teal-600 text-white text-sm font-semibold hover:bg-brand-teal-500 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8">
      <h2 className="text-lg font-semibold text-ink-700">Email Konfirmasi RFQ</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Dikirim otomatis ke customer setelah submit form Minta Penawaran.
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {template.available_placeholders.map((ph) => (
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

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email-subject">Subject</Label>
            <Input id="email-subject" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={isSaving} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email-body-html">Body (HTML)</Label>
            <Textarea
              id="email-body-html"
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              rows={10}
              disabled={isSaving}
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email-body-text">Body (Plain Text — fallback)</Label>
            <Textarea
              id="email-body-text"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={6}
              disabled={isSaving}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
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
          <Label className="mb-1.5 block">Preview (data contoh)</Label>
          <div className="border border-neutral-200 rounded-md overflow-hidden">
            <div className="bg-neutral-50 px-3 py-2 text-xs text-neutral-500 border-b border-neutral-200 truncate">
              Subject: {renderPreview(subject)}
            </div>
            <iframe
              srcDoc={renderPreview(bodyHtml)}
              sandbox="allow-same-origin"
              title="Preview Email"
              className="w-full h-80 bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
