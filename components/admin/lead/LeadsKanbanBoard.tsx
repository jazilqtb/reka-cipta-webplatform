'use client'

// components/admin/lead/LeadsKanbanBoard.tsx
// Epic 4B Slice 1 (E4B-S1-FE-03) — Kanban board: fetch-on-mount (pattern
// SettingsForm — plain useEffect/useState, bukan Server Component fetch,
// karena apiFetch(auth:true) butuh browser Supabase client, lihat komentar
// lib/api.ts), drag-drop dengan optimistic update + rollback, mobile
// fallback dropdown.

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { toast } from 'sonner'
import { getLeads, updateLead, ApiFetchError } from '@/lib/api'
import { LABEL_MAP, LEAD_STATUSES } from '@/lib/constants/lead-status'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { TextLineSkeleton } from '@/components/ui/skeletons'
import { KanbanColumn } from './KanbanColumn'
import { LeadKanbanCard } from './LeadKanbanCard'
import { MobileLeadsView } from './MobileLeadsView'
import { FilterPanel } from './FilterPanel'
import type { LeadStatus, RFQLead } from '@/types/api'

export function LeadsKanbanBoard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()

  const filters = useMemo(
    () => ({
      industry: searchParams.get('industry') ?? undefined,
      date_from: searchParams.get('date_from') ?? undefined,
      date_to: searchParams.get('date_to') ?? undefined,
    }),
    [searchParams]
  )

  const [leads, setLeads] = useState<RFQLead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [search, setSearch] = useState('')
  const [activeLead, setActiveLead] = useState<RFQLead | null>(null)

  // PointerSensor dengan activation constraint 8px — klik singkat (tanpa
  // gerak) diteruskan ke <Link> anak, gerak >8px baru dianggap drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  async function fetchLeads() {
    setIsLoading(true)
    setIsError(false)
    try {
      const data = await getLeads(filters)
      setLeads(data.leads)
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 401) {
        router.push('/admin/login')
        return
      }
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.industry, filters.date_from, filters.date_to])

  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leads
    const lower = search.toLowerCase()
    return leads.filter(
      (l) => l.company_name.toLowerCase().includes(lower) || l.full_name.toLowerCase().includes(lower)
    )
  }, [leads, search])

  async function applyStatusChange(leadId: string, newStatus: LeadStatus) {
    const originalLead = leads.find((l) => l.id === leadId)
    if (!originalLead || originalLead.status === newStatus) return

    // Optimistic update — capture originalLead SEBELUM setState supaya
    // rollback tidak baca closure stale (R-23).
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)))

    try {
      await updateLead(leadId, { status: newStatus })
      toast.success(`Status diubah ke ${LABEL_MAP[newStatus]}`)
    } catch {
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: originalLead.status } : l)))
      toast.error('Gagal mengubah status. Coba lagi.')
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const lead = leads.find((l) => l.id === event.active.id)
    if (lead) setActiveLead(lead)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveLead(null)
    const { active, over } = event
    if (!over) return
    await applyStatusChange(active.id as string, over.id as LeadStatus)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <TextLineSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center space-y-4">
        <p className="text-neutral-600">Gagal memuat leads.</p>
        <button
          type="button"
          onClick={fetchLeads}
          className="h-9 px-4 rounded-md bg-brand-teal-600 text-white text-sm font-semibold hover:bg-brand-teal-500 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <FilterPanel filters={filters} search={search} onSearchChange={setSearch} />

      {filteredLeads.length === 0 && leads.length > 0 && (
        <p className="text-sm text-neutral-500">Tidak ada lead sesuai filter</p>
      )}

      {leads.length === 0 && (
        <p className="text-sm text-neutral-500">
          Belum ada RFQ masuk. Share halaman /minta-penawaran untuk mulai kumpulkan leads.
        </p>
      )}

      {isMobile ? (
        <MobileLeadsView leads={filteredLeads} onStatusChange={applyStatusChange} />
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {LEAD_STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                leads={filteredLeads.filter((l) => l.status === status)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeLead && <LeadKanbanCard lead={activeLead} isDragging />}
          </DragOverlay>
        </DndContext>
      )}

      <p className="text-sm text-neutral-500">Total: {leads.length} leads</p>
    </div>
  )
}
