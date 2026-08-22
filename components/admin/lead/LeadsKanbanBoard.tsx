'use client'

// components/admin/lead/LeadsKanbanBoard.tsx
// Epic 4B Slice 1 (E4B-S1-FE-03) — papan Kanban dengan drag-drop.
//
// CP2 (2026-08-19) — jadi TERKENDALI. Fetch, filter, pencarian, dan
// optimistic update dipindah ke LeadsWorkspace; komponen ini sekarang
// murni papan. Alasannya: begitu ada tampilan kedua (Daftar), keduanya
// harus membaca data yang SAMA — kalau masing-masing mengambil sendiri,
// berganti tampilan akan memicu request ulang dan hasil drag di satu
// tampilan tidak terlihat di tampilan lain.
//
// Kanban tidak lagi jadi tampilan utama (lihat LeadsListView), tapi tetap
// dipertahankan: memindahkan tahap dengan drag memang lebih enak di sini
// ketika lead sudah banyak.

import { useState } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { LEAD_STATUSES } from '@/lib/constants/lead-status'
import { useMediaQuery } from '@/hooks/use-media-query'
import { KanbanColumn } from './KanbanColumn'
import { LeadKanbanCard } from './LeadKanbanCard'
import { MobileLeadsView } from './MobileLeadsView'
import type { LeadStatus, RFQLead } from '@/types/api'

interface Props {
  leads: RFQLead[]
  onStatusChange: (leadId: string, status: LeadStatus) => void | Promise<void>
}

export function LeadsKanbanBoard({ leads, onStatusChange }: Props) {
  /* Alasan sama dengan LeadsWorkspace: tanyakan ke mesin CSS, jangan
     mengukur sendiri. `md` Tailwind v4 = 48rem, bukan 768px. */
  const isMobile = !useMediaQuery('(min-width: 48rem)')
  const [activeLead, setActiveLead] = useState<RFQLead | null>(null)

  // Activation constraint 8px — klik singkat (tanpa gerak) diteruskan ke
  // <Link> anak, gerak >8px baru dianggap drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragStart(event: DragStartEvent) {
    const lead = leads.find((l) => l.id === event.active.id)
    if (lead) setActiveLead(lead)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveLead(null)
    const { active, over } = event
    if (!over) return
    await onStatusChange(active.id as string, over.id as LeadStatus)
  }

  if (isMobile) {
    return <MobileLeadsView leads={leads} onStatusChange={onStatusChange} />
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {LEAD_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            leads={leads.filter((l) => l.status === status)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead && <LeadKanbanCard lead={activeLead} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}
