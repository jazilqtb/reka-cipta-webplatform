'use client'

// components/admin/lead/MobileLeadsView.tsx
// Epic 4B Slice 1 (R-26) — fallback mobile (<768px): single-column list
// dengan dropdown status per card, bukan drag-drop (touch drag UX buruk
// untuk kasus ini, AR-06).

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { LABEL_MAP, LEAD_STATUSES } from '@/lib/constants/lead-status'
import type { LeadStatus, RFQLead } from '@/types/api'

interface Props {
  leads: RFQLead[]
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void
}

export function MobileLeadsView({ leads, onStatusChange }: Props) {
  if (leads.length === 0) {
    return <p className="text-sm text-neutral-400 text-center py-10">Belum ada lead</p>
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <div key={lead.id} className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
          <Link href={`/admin/leads/${lead.id}`} className="block">
            <h4 className="font-semibold text-sm text-ink-700">{lead.company_name}</h4>
            <p className="text-xs text-neutral-500 mt-0.5">{lead.industry_type}</p>
            <div className="mt-2 flex flex-col gap-1 text-xs text-neutral-600">
              <span>📦 {lead.volume_per_month} ton</span>
              <span>📍 {lead.delivery_city}</span>
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              {formatDistanceToNow(new Date(lead.created_at), { locale: idLocale, addSuffix: true })}
            </p>
          </Link>

          <label className="mt-3 block">
            <span className="sr-only">Ubah status {lead.company_name}</span>
            <select
              value={lead.status}
              onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
              className="w-full h-11 rounded-md border border-neutral-300 px-3 text-sm text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600"
            >
              {LEAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {LABEL_MAP[status]}
                </option>
              ))}
            </select>
          </label>
        </div>
      ))}
    </div>
  )
}
