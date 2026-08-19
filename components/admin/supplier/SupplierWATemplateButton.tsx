'use client'

// components/admin/supplier/SupplierWATemplateButton.tsx
// Epic 5 Admin (E5-ADM-FE-14) — tombol + modal template WA supplier, 3
// state (loading, ready-with-template, ready-empty utk status 'inactive').
// Reuse components/ui/dialog.tsx (Base UI wrapper) — pattern identik
// components/admin/lead/WATemplateModal.tsx, BUKAN import raw
// @base-ui-components/react/dialog (nama paket tidak match project ini).

import { useState } from 'react'
import { toast } from 'sonner'
import { MessageSquare } from 'lucide-react'
import { generateSupplierWATemplate, ApiFetchError } from '@/lib/api'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BrandDialogContent } from '@/components/brand/BrandDialogContent'
import { SUPPLIER_STATUS_LABELS } from './StatusBadge'
import type { SupplierStatus } from '@/types/api'

interface Props {
  supplierId: string
  currentStatus: SupplierStatus
  whatsapp: string
  businessName: string
}

function maskWhatsapp(whatsapp: string): string {
  if (whatsapp.length <= 6) return whatsapp
  return `${whatsapp.slice(0, 5)}****${whatsapp.slice(-2)}`
}

export function SupplierWATemplateButton({ supplierId, currentStatus, whatsapp, businessName }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [template, setTemplate] = useState('')
  const [whatsappClean, setWhatsappClean] = useState('')

  async function loadTemplate() {
    setLoading(true)
    try {
      const res = await generateSupplierWATemplate({ supplier_id: supplierId, status: currentStatus })
      setTemplate(res.template)
      setWhatsappClean(res.whatsapp_number)
    } catch (err) {
      if (!(err instanceof ApiFetchError && err.status === 401)) {
        toast.error('Gagal memuat template')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) loadTemplate()
  }

  function handleCopy() {
    navigator.clipboard.writeText(template)
    toast.success('Teks disalin')
  }

  function openWhatsApp() {
    const url = `https://wa.me/${whatsappClean}?text=${encodeURIComponent(template)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-brand-teal-600 text-sm font-semibold text-white transition-colors hover:bg-brand-teal-500"
      >
        <MessageSquare className="h-4 w-4" aria-hidden="true" />
        Buat Pesan WA
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <BrandDialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Template Pesan WhatsApp</DialogTitle>
            <p className="text-sm text-neutral-500">
              Untuk: {businessName} · Status: {SUPPLIER_STATUS_LABELS[currentStatus]}
            </p>
          </DialogHeader>

          {loading ? (
            <p className="py-6 text-center text-sm text-neutral-500">Menyiapkan template...</p>
          ) : (
            <>
              {template === '' && (
                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
                  Tidak ada template default untuk status &quot;{SUPPLIER_STATUS_LABELS[currentStatus]}&quot;.
                  Ketik pesan manual di bawah.
                </div>
              )}
              <textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={10}
                className="w-full rounded-md border border-neutral-300 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600"
                placeholder="Ketik pesan..."
              />
              <p className="text-sm text-neutral-500">Nomor tujuan: {maskWhatsapp(whatsapp)}</p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!template}
                  className="h-10 rounded-md border border-neutral-300 px-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Salin Teks
                </button>
                <button
                  type="button"
                  onClick={openWhatsApp}
                  disabled={!template || !whatsappClean}
                  className="h-10 rounded-md bg-brand-teal-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Buka di WhatsApp
                </button>
              </div>
            </>
          )}
        </BrandDialogContent>
      </Dialog>
    </div>
  )
}
