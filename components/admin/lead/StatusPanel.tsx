'use client'

// components/admin/lead/StatusPanel.tsx
// Epic 4B Slice 1 (E4B-S1-FE-11) — dropdown update status + tombol buka
// modal template WA. AR-08: transisi status bebas, tidak ada state machine.

import { useState } from 'react'
import { toast } from 'sonner'
import { updateLead, ApiFetchError } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { LABEL_MAP, LEAD_STATUSES } from '@/lib/constants/lead-status'
import { WATemplateModal } from './WATemplateModal'
import type { LeadStatus, RFQLead } from '@/types/api'

interface Props {
  lead: RFQLead
  onStatusChanged: (newStatus: LeadStatus) => void
}

export function StatusPanel({ lead, onStatusChanged }: Props) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [waModalOpen, setWaModalOpen] = useState(false)

  async function handleStatusChange(newStatus: LeadStatus) {
    if (newStatus === lead.status) return
    setIsUpdating(true)
    try {
      await updateLead(lead.id, { status: newStatus })
      onStatusChanged(newStatus)
      toast.success(`Status diubah ke ${LABEL_MAP[newStatus]}`)
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 401) {
        router.push('/admin/login')
        return
      }
      toast.error('Gagal mengubah status. Coba lagi.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-ink-700">Status & Aksi</h2>

      <div className="space-y-1.5">
        <label htmlFor="lead-status" className="block text-sm font-medium text-neutral-600">
          Status
        </label>
        <select
          id="lead-status"
          value={lead.status}
          disabled={isUpdating}
          onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
          className="w-full h-10 rounded-md border border-neutral-300 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600 disabled:opacity-60"
        >
          {LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {LABEL_MAP[status]}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => setWaModalOpen(true)}
        className="w-full h-10 rounded-md bg-brand-teal-600 text-white text-sm font-semibold hover:bg-brand-teal-500 transition-colors"
      >
        Buat Pesan WA
      </button>

      <WATemplateModal
        leadId={lead.id}
        status={lead.status}
        whatsapp={lead.whatsapp}
        open={waModalOpen}
        onOpenChange={setWaModalOpen}
      />
    </div>
  )
}
