'use client'

// components/admin/lead/ProposalGeneratorPanel.tsx
// Epic 4B Slice 2 (E4B-S2-FE-01) — generate (Anthropic Haiku, blocking
// 10-30s) -> preview (sandboxed iframe) -> download PDF (JWT blob
// workaround, R-32) -> send ke customer (confirm dialog dulu).
//
// Epic 4B Slice 3A (E4B-S3A-FE-02, R-38/R-39, CROSS-SLICE) — tambah
// Advanced Mode toggle (temperature/max_tokens/custom_instructions,
// semua optional). Toggle OFF (default) = Quick Mode, `handleGenerate`
// memanggil `generateProposal(lead.id)` tanpa argumen ke-2 — behavior
// identik Slice 2, TIDAK berubah.
//
// NOTE: implemented ahead of Slice 3 trigger criteria (task breakdown
// "Trigger Criteria") per instruksi eksplisit supaya kode siap begitu
// Anthropic API key tersedia — belum pernah divalidasi end-to-end.

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { generateProposal, sendProposal, getProposalPDFUrl, ApiFetchError } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import type { RFQLead } from '@/types/api'

interface Props {
  lead: RFQLead
  onLeadUpdated: (lead: RFQLead) => void
}

type ActionState = 'idle' | 'generating' | 'sending'

const CUSTOM_INSTRUCTIONS_MAX = 2000

function sanitizeFilename(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'lead'
}

export function ProposalGeneratorPanel({ lead, onLeadUpdated }: Props) {
  const [actionState, setActionState] = useState<ActionState>('idle')
  const [confirmSendOpen, setConfirmSendOpen] = useState(false)

  // Advanced Mode (Slice 3A, R-38) — semua undefined = Quick Mode default.
  const [advancedMode, setAdvancedMode] = useState(false)
  const [temperature, setTemperature] = useState<number | undefined>(undefined)
  const [maxTokens, setMaxTokens] = useState<number | undefined>(undefined)
  const [customInstructions, setCustomInstructions] = useState('')

  const hasProposal = lead.proposal_generated && !!lead.proposal_html
  const isBusy = actionState !== 'idle'

  async function handleGenerate() {
    setActionState('generating')
    try {
      // R-39: toggle off → panggil TANPA argumen ke-2, identik Slice 2.
      const advanced = advancedMode
        ? {
            temperature,
            max_tokens: maxTokens,
            custom_instructions: customInstructions || undefined,
          }
        : undefined
      const data = await generateProposal(lead.id, advanced)
      onLeadUpdated(data.lead)
      toast.success('Proposal berhasil digenerate')
    } catch (err) {
      const msg =
        err instanceof ApiFetchError ? err.message : 'Gagal generate proposal. Coba lagi.'
      toast.error(msg)
    } finally {
      setActionState('idle')
    }
  }

  async function handleDownload() {
    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('UNAUTHORIZED')

      const response = await fetch(getProposalPDFUrl(lead.id), {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `proposal-${sanitizeFilename(lead.company_name)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Gagal download PDF')
    }
  }

  async function handleConfirmSend() {
    setConfirmSendOpen(false)
    setActionState('sending')
    try {
      const data = await sendProposal(lead.id)
      onLeadUpdated(data.lead)
      toast.success(`Proposal terkirim ke ${lead.email}`)
    } catch (err) {
      const msg =
        err instanceof ApiFetchError ? err.message : 'Gagal mengirim proposal. Coba lagi.'
      toast.error(msg)
    } finally {
      setActionState('idle')
    }
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-700">Proposal</h2>
        {lead.proposal_sent_at && (
          <span className="text-xs font-medium text-success-600 bg-success-100 rounded-full px-2 py-0.5">
            Terkirim {formatDistanceToNow(new Date(lead.proposal_sent_at), { locale: idLocale, addSuffix: true })}
          </span>
        )}
      </div>

      {actionState === 'generating' && (
        <div className="flex items-center gap-3 py-8 justify-center text-neutral-600">
          <span className="h-5 w-5 rounded-full border-2 border-brand-teal-600 border-t-transparent animate-spin" />
          <p className="text-sm">AI sedang menulis proposal... biasanya 5-15 detik</p>
        </div>
      )}

      {actionState !== 'generating' && !hasProposal && (
        <div className="text-center py-6 space-y-3">
          <p className="text-sm text-neutral-500">Belum ada proposal untuk lead ini.</p>
          <button
            type="button"
            onClick={handleGenerate}
            className="h-10 px-5 rounded-md bg-brand-teal-600 text-white text-sm font-semibold hover:bg-brand-teal-500 transition-colors"
          >
            Generate Proposal (Quick Mode)
          </button>
        </div>
      )}

      {actionState !== 'generating' && hasProposal && (
        <div className="space-y-4">
          {lead.proposal_generated_at && (
            <p className="text-xs text-neutral-500">
              Digenerate {formatDistanceToNow(new Date(lead.proposal_generated_at), { locale: idLocale, addSuffix: true })}
            </p>
          )}

          {/* R-33: sandbox tanpa allow-scripts — proposal_html dari LLM,
              potential adversarial prompt injection kalau ada allow-scripts. */}
          <iframe
            srcDoc={lead.proposal_html ?? ''}
            sandbox="allow-same-origin"
            title="Preview Proposal"
            className="w-full h-96 border border-neutral-200 rounded-md bg-white"
          />

          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={actionState === 'sending'}
              className="h-10 px-4 rounded-md border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Regenerate
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={actionState === 'sending'}
              className="h-10 px-4 rounded-md border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => setConfirmSendOpen(true)}
              disabled={actionState === 'sending'}
              className="h-10 px-5 rounded-md bg-brand-teal-600 text-white text-sm font-semibold hover:bg-brand-teal-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {actionState === 'sending' ? 'Mengirim...' : 'Kirim ke Customer'}
            </button>
          </div>
        </div>
      )}

      {actionState !== 'generating' && (
        <div className="border-t border-neutral-200 pt-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={advancedMode}
              onChange={(e) => setAdvancedMode(e.target.checked)}
              disabled={isBusy}
              className="h-4 w-4 rounded border-neutral-300 text-brand-teal-600 focus:ring-brand-teal-500"
            />
            <span className="text-sm font-medium text-neutral-700">Advanced Mode</span>
            <span className="text-xs text-neutral-500">(override default AI — biaya bisa lebih tinggi)</span>
          </label>

          {advancedMode && (
            <div className="mt-3 p-3 bg-neutral-50 rounded-lg space-y-3">
              <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2">
                Kosongkan field yang tidak ingin di-override — akan pakai default dari Pengaturan
                Proposal.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-600" htmlFor="adv-temperature">
                    Temperature (opsional)
                  </label>
                  <input
                    id="adv-temperature"
                    type="number"
                    min={0}
                    max={1.5}
                    step={0.1}
                    placeholder="Default"
                    disabled={isBusy}
                    value={temperature ?? ''}
                    onChange={(e) => setTemperature(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full h-9 px-2.5 rounded-md border border-neutral-300 text-sm disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-600" htmlFor="adv-max-tokens">
                    Max Tokens (opsional)
                  </label>
                  <input
                    id="adv-max-tokens"
                    type="number"
                    min={500}
                    max={8000}
                    step={100}
                    placeholder="Default"
                    disabled={isBusy}
                    value={maxTokens ?? ''}
                    onChange={(e) => setMaxTokens(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full h-9 px-2.5 rounded-md border border-neutral-300 text-sm disabled:opacity-60"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600" htmlFor="adv-custom-instructions">
                  Instruksi Tambahan (opsional)
                </label>
                <Textarea
                  id="adv-custom-instructions"
                  value={customInstructions}
                  disabled={isBusy}
                  onChange={(e) => setCustomInstructions(e.target.value.slice(0, CUSTOM_INSTRUCTIONS_MAX))}
                  placeholder="Contoh: Tekankan aspek harga kompetitif dan pengiriman cepat."
                  rows={3}
                  className="text-sm"
                />
                <p className="text-xs text-neutral-400">
                  {customInstructions.length}/{CUSTOM_INSTRUCTIONS_MAX}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={confirmSendOpen} onOpenChange={setConfirmSendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kirim Proposal?</DialogTitle>
            <p className="text-sm text-neutral-500">
              Proposal akan dikirim sebagai PDF ke <strong>{lead.email}</strong>. Aksi ini tidak
              bisa dibatalkan setelah dikirim.
            </p>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setConfirmSendOpen(false)}
              className="h-10 px-4 rounded-md border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmSend}
              className="h-10 px-5 rounded-md bg-brand-teal-600 text-white text-sm font-semibold hover:bg-brand-teal-500 transition-colors"
            >
              Ya, Kirim
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
