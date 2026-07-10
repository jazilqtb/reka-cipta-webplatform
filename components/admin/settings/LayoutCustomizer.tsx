'use client'

// components/admin/settings/LayoutCustomizer.tsx
// Epic 4B Slice 3C (E4B-S3C-FE-01) — Header/footer/logo/warna untuk PDF
// proposal. R-43: Save WAJIB disabled sampai admin preview minimal
// sekali untuk nilai yang sedang diedit — supaya tidak ada layout rusak
// ke-save lalu baru ketahuan pas generate proposal real.
//
// 1 row DB yang sama dengan prompt (Slice 3A) — save di sini mengirim
// full ProposalSettingsUpdateRequest (prompt fields dari `settings` prop,
// tidak berubah; hanya layout_* yang di-override).
//
// NOTE: implemented ahead of Slice 3 trigger criteria — lihat catatan di
// PromptEditor.tsx / types/api.ts.

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { updateProposalSettings, fetchLayoutPreviewPdfBlobUrl, ApiFetchError } from '@/lib/api'
import type { ProposalSettings } from '@/types/api'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface Props {
  settings: ProposalSettings
  onSaved: (settings: ProposalSettings) => void
}

export function LayoutCustomizer({ settings, onSaved }: Props) {
  const [headerText, setHeaderText] = useState(settings.layout_header_text ?? '')
  const [footerText, setFooterText] = useState(settings.layout_footer_text ?? '')
  const [logoUrl, setLogoUrl] = useState(settings.layout_logo_url ?? '')
  const [primaryColor, setPrimaryColor] = useState(settings.layout_primary_color)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  // R-43 guard: preview jadi stale (harus di-generate ulang) tiap field berubah.
  const [previewIsStale, setPreviewIsStale] = useState(true)

  // Cleanup blob URL — R-43 note di guide: cache preview blob URL tanpa
  // revoke = memory leak kalau admin preview berkali-kali.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function markDirty<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value)
      setPreviewIsStale(true)
    }
  }

  async function handlePreview() {
    setIsPreviewing(true)
    try {
      const url = await fetchLayoutPreviewPdfBlobUrl({
        layout_header_text: headerText || null,
        layout_footer_text: footerText || null,
        layout_logo_url: logoUrl || null,
        layout_primary_color: primaryColor,
      })
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(url)
      setPreviewIsStale(false)
    } catch {
      toast.error('Gagal membuat preview PDF.')
    } finally {
      setIsPreviewing(false)
    }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const updated = await updateProposalSettings({
        prompt_role: settings.prompt_role,
        prompt_task: settings.prompt_task,
        prompt_constraints: settings.prompt_constraints,
        prompt_output_format: settings.prompt_output_format,
        default_temperature: settings.default_temperature,
        default_max_tokens: settings.default_max_tokens,
        layout_header_text: headerText || null,
        layout_footer_text: footerText || null,
        layout_logo_url: logoUrl || null,
        layout_primary_color: primaryColor,
      })
      onSaved(updated)
      toast.success('Layout tersimpan. Proposal berikutnya akan pakai layout ini.')
    } catch (err) {
      const msg = err instanceof ApiFetchError ? err.message : 'Gagal menyimpan layout.'
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8">
      <h2 className="text-lg font-semibold text-ink-700">Layout PDF Proposal</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Header, footer, logo, dan warna aksen untuk PDF proposal. Preview dulu sebelum simpan.
      </p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="layout_header_text">Header Text (opsional)</Label>
            <Input
              id="layout_header_text"
              value={headerText}
              onChange={(e) => markDirty(setHeaderText)(e.target.value)}
              maxLength={100}
              placeholder="mis. CV Reka Cipta Indonesia"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="layout_footer_text">Footer Text (opsional)</Label>
            <Input
              id="layout_footer_text"
              value={footerText}
              onChange={(e) => markDirty(setFooterText)(e.target.value)}
              maxLength={150}
              placeholder="mis. CV Reka Cipta Indonesia — Surabaya"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="layout_logo_url">Logo URL (opsional)</Label>
            <Input
              id="layout_logo_url"
              type="url"
              value={logoUrl}
              onChange={(e) => markDirty(setLogoUrl)(e.target.value)}
              placeholder="https://...supabase.co/storage/v1/object/public/..."
            />
            <p className="text-xs text-neutral-500">
              Upload logo ke Supabase Storage dulu, lalu paste URL publiknya di sini.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="layout_primary_color">Warna Aksen (Heading)</Label>
            <div className="flex items-center gap-2">
              <input
                id="layout_primary_color"
                type="color"
                value={primaryColor}
                onChange={(e) => markDirty(setPrimaryColor)(e.target.value)}
                className="h-9 w-14 rounded-md border border-neutral-300 cursor-pointer"
              />
              <span className="text-sm text-neutral-600 font-mono">{primaryColor}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handlePreview}
              disabled={isPreviewing}
              className="h-10 px-4 rounded-md border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPreviewing ? 'Memuat...' : 'Preview PDF'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || previewIsStale || !previewUrl}
              title={previewIsStale ? 'Preview dulu sebelum simpan' : undefined}
              className="h-10 px-5 rounded-md bg-brand-teal-600 text-white text-sm font-semibold hover:bg-brand-teal-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Layout'}
            </button>
          </div>
          {previewIsStale && previewUrl && (
            <p className="text-xs text-amber-700">Ada perubahan belum di-preview — klik &quot;Preview PDF&quot; lagi sebelum simpan.</p>
          )}
        </div>

        <div>
          <Label className="mb-1.5 block">Preview</Label>
          {previewUrl ? (
            <iframe src={previewUrl} className="w-full h-96 border border-neutral-200 rounded-md" title="Preview Layout PDF" />
          ) : (
            <div className="w-full h-96 border border-dashed border-neutral-300 rounded-md flex items-center justify-center text-sm text-neutral-400 text-center px-6">
              Klik &quot;Preview PDF&quot; untuk melihat hasil sebelum disimpan
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
