'use client'

// components/admin/lead/KanbanColumn.tsx
// Epic 4B Slice 1 (E4B-S1-FE-04) — droppable column, 1 per status.

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { LABEL_MAP, COLUMN_ACCENT_MAP } from '@/lib/constants/lead-status'
import { LeadKanbanCard } from './LeadKanbanCard'
import type { LeadStatus, RFQLead } from '@/types/api'

interface Props {
  status: LeadStatus
  leads: RFQLead[]
}

export function KanbanColumn({ status, leads }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-72 rounded-lg border-t-4 border border-neutral-200 bg-neutral-50 p-3 flex flex-col',
        COLUMN_ACCENT_MAP[status],
        isOver && 'border-dashed border-brand-teal-600 bg-brand-teal-50'
      )}
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <h3 className="font-semibold text-sm text-ink-700">{LABEL_MAP[status]}</h3>
        <span className="text-xs font-medium text-neutral-500 bg-white rounded-full px-2 py-0.5 border border-neutral-200">
          {leads.length}
        </span>
      </header>

      <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-260px)] min-h-[80px]">
        {leads.length === 0 && (
          <p className="text-sm text-neutral-400 text-center py-6">Belum ada lead</p>
        )}
        {leads.map((lead) => (
          <LeadKanbanCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  )
}
