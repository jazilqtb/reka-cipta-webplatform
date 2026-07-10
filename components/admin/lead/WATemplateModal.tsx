'use client'

// components/admin/lead/WATemplateModal.tsx
// Epic 4B Slice 1 (E4B-S1-FE-13) — modal preview template WA, editable,
// dengan tombol buka wa.me. Template fetched dari backend saat modal open.

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getWATemplate } from '@/lib/api'
import { LABEL_MAP } from '@/lib/constants/lead-status'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { LeadStatus } from '@/types/api'

interface Props {
  leadId: string
  status: LeadStatus
  whatsapp: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function maskWhatsapp(whatsapp: string): string {
  if (whatsapp.length <= 6) return whatsapp
  return `${whatsapp.slice(0, 5)}****${whatsapp.slice(-2)}`
}

export function WATemplateModal({ leadId, status, whatsapp, open, onOpenChange }: Props) {
  const [template, setTemplate] = useState('')
  const [whatsappClean, setWhatsappClean] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadTemplate() {
    setLoading(true)
    try {
      const res = await getWATemplate(leadId, status)
      setTemplate(res.template)
      setWhatsappClean(res.whatsapp_number)
    } catch {
      toast.error('Gagal memuat template')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTemplate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leadId, status])

  function openWhatsApp() {
    const url = `https://wa.me/${whatsappClean}?text=${encodeURIComponent(template)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buat Pesan WhatsApp</DialogTitle>
          <p className="text-sm text-neutral-500">Status saat ini: {LABEL_MAP[status]}</p>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-neutral-500 py-6 text-center">Memuat template...</p>
        ) : (
          <>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={10}
              className="w-full rounded-md border border-neutral-300 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600"
            />
            <p className="text-sm text-neutral-500">Nomor tujuan: {maskWhatsapp(whatsapp)}</p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-10 px-4 rounded-md border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={openWhatsApp}
                disabled={!whatsappClean}
                className="h-10 px-5 rounded-md bg-brand-teal-600 text-white text-sm font-semibold hover:bg-brand-teal-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Buka di WhatsApp
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
