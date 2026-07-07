'use client'

// components/admin/lead/LeadKanbanCard.tsx
// Epic 4B Slice 1 (E4B-S1-FE-05) — kartu draggable di Kanban.
//
// PENTING: <Link> dibungkus DI DALAM div draggable (bukan sebaliknya) —
// kalau <Link> membungkus seluruh kartu, klik akan di-intercept Link
// sebelum dnd-kit sempat detect drag start. useDraggable membedakan
// klik vs drag via activationConstraint jarak (default 8px di
// LeadsKanbanBoard's PointerSensor).

import Link from 'next/link'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { RFQLead } from '@/types/api'

const STALE_DAYS_THRESHOLD = 3

function daysSince(isoDate: string): number {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  return diffMs / (1000 * 60 * 60 * 24)
}

function maskWhatsapp(whatsapp: string): string {
  if (whatsapp.length <= 6) return whatsapp
  return `${whatsapp.slice(0, 5)}****${whatsapp.slice(-2)}`
}

interface Props {
  lead: RFQLead
  isDragging?: boolean
}

export function LeadKanbanCard({ lead, isDragging = false }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isActivelyDragging } =
    useDraggable({ id: lead.id })

  const isStale = daysSince(lead.updated_at) > STALE_DAYS_THRESHOLD

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'rounded-lg border border-neutral-200 bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing touch-none',
        (isActivelyDragging || isDragging) && 'opacity-60 shadow-lg',
        isStale && 'border-l-4 border-l-warning-600'
      )}
    >
      <Link href={`/admin/leads/${lead.id}`} className="block">
        <h4 className="font-semibold text-sm text-ink-700 truncate">{lead.company_name}</h4>
        <p className="text-xs text-neutral-500 mt-0.5">{lead.industry_type}</p>

        <div className="mt-2 flex flex-col gap-1 text-xs text-neutral-600">
          <span>📦 {lead.volume_per_month} ton/{lead.delivery_frequency === 'weekly' ? 'minggu' : lead.delivery_frequency === 'biweekly' ? '2 minggu' : 'bulan'}</span>
          <span>📍 {lead.delivery_city}</span>
          <span>📱 {maskWhatsapp(lead.whatsapp)}</span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-neutral-400">
            {formatDistanceToNow(new Date(lead.created_at), { locale: idLocale, addSuffix: true })}
          </p>
          {isStale && (
            <span className="text-xs font-medium text-warning-600" title="Belum ada update > 3 hari">
              ⚠ stale
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}
