// components/admin/lead/LeadsListView.tsx
// CP2 (2026-08-19) — daftar padat, menggantikan Kanban sebagai tampilan
// utama.
//
// KENAPA DAFTAR, BUKAN KANBAN, SEBAGAI DEFAULT:
// Data produksi saat audit: 3 lead tersebar di 2 dari 6 status. Kanban
// memaksa 6 kolom sejajar; 4 kosong, dan pada 1440px kolom terakhir
// masih terpotong (terverifikasi di produksi). Daftar tetap terbaca pada
// 3 maupun 300 lead, dan menyisakan ruang untuk panel detail di sebelahnya.
//
// Kanban TIDAK dibuang — ia tetap ada sebagai toggle, karena memindahkan
// tahap dengan drag memang lebih enak di sana ketika lead sudah banyak.

'use client'

import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { WarningCircleIcon } from '@phosphor-icons/react/ssr'
import { LABEL_MAP } from '@/lib/constants/lead-status'
import { formatVolume, industryLabel, isStale, maskWhatsapp } from '@/lib/lead-format'
import type { LeadStatus, RFQLead } from '@/types/api'

/** Warna titik status — dipakai sebagai penanda kecil, bukan badge penuh,
 *  supaya baris daftar tetap ringkas. Token diambil dari globals.css. */
const STATUS_DOT: Record<LeadStatus, string> = {
  new: 'bg-brand-teal-600',
  contacted: 'bg-info-600',
  sample_sent: 'bg-warning-600',
  negotiation: 'bg-sand-600',
  deal: 'bg-success-600',
  lost: 'bg-neutral-400',
}

interface Props {
  leads: RFQLead[]
  selectedId: string | null
  onSelect: (lead: RFQLead) => void
}

export function LeadsListView({ leads, selectedId, onSelect }: Props) {
  return (
    <ul role="list" className="divide-y divide-ink-900/[0.06]">
      {leads.map((lead) => {
        const active = lead.id === selectedId
        const stale = isStale(lead)
        return (
          <li key={lead.id}>
            <button
              type="button"
              onClick={() => onSelect(lead)}
              aria-current={active ? 'true' : undefined}
              className={[
                'w-full px-4 py-3 text-left transition-colors duration-100',
                'focus-visible:shadow-focus focus-visible:outline-none',
                active ? 'bg-brand-teal-50' : 'hover:bg-neutral-50',
              ].join(' ')}
            >
              <div className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className={['mt-1.5 h-2 w-2 shrink-0 rounded-full', STATUS_DOT[lead.status]].join(' ')}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-ui truncate text-sm font-semibold text-ink-700">
                      {lead.company_name}
                    </p>
                    <span className="font-ui shrink-0 text-xs font-medium text-neutral-400">
                      {LABEL_MAP[lead.status]}
                    </span>
                  </div>

                  <p className="mt-0.5 truncate text-xs text-neutral-500">
                    {lead.full_name} · {industryLabel(lead.industry_type)}
                  </p>

                  <div className="mono-tech mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-600">
                    <span>{formatVolume(lead)}</span>
                    <span className="text-neutral-300" aria-hidden="true">·</span>
                    <span>{lead.delivery_city}</span>
                    <span className="text-neutral-300" aria-hidden="true">·</span>
                    <span>{maskWhatsapp(lead.whatsapp)}</span>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-xs text-neutral-400">
                      {formatDistanceToNow(new Date(lead.created_at), { locale: idLocale, addSuffix: true })}
                    </span>
                    {stale && (
                      <span
                        title={`Belum ada update lebih dari 3 hari`}
                        className="font-ui flex items-center gap-1 text-xs font-medium text-warning-600"
                      >
                        <WarningCircleIcon size={16} weight="fill" aria-hidden="true" />
                        perlu ditindak
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
