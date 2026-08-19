// components/admin/lead/LeadsWorkspace.tsx
// CP2 (2026-08-19) — akar permukaan Leads. Pemilik tunggal data & filter.
//
// KENAPA FETCH DIANGKAT KE SINI:
// Sebelumnya LeadsKanbanBoard yang mengambil data, menyimpan filter, DAN
// merender papan. Begitu ada tampilan kedua (Daftar), keduanya harus
// berbagi data yang sama — kalau masing-masing mengambil sendiri, ganti
// tampilan akan memicu request ulang dan status hasil drag di satu
// tampilan tidak terlihat di tampilan lain. Workspace memegang datanya;
// kedua tampilan jadi murni presentasi.
//
// LeadsKanbanBoard kini TERKENDALI (menerima leads + onStatusChange).

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { getLeads, updateLead, ApiFetchError } from '@/lib/api'
import { LABEL_MAP } from '@/lib/constants/lead-status'
import { DATE_PRESETS, isoDaysAgo, type DatePresetKey } from '@/lib/lead-format'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { TextLineSkeleton } from '@/components/ui/skeletons'
import { LeadsToolbar, type LeadsView } from './LeadsToolbar'
import { LeadsListView } from './LeadsListView'
import { LeadDetailPanel } from './LeadDetailPanel'
import { LeadsKanbanBoard } from './LeadsKanbanBoard'
import type { LeadStatus, RFQLead } from '@/types/api'

export function LeadsWorkspace({ productNames }: { productNames: Record<string, string> }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Panel detail hanya muat mulai lg. Di bawah itu, memilih lead berpindah
  // ke halaman detail — pola master-detail yang lazim di layar sempit.
  const isNarrow = useIsMobile(1024)

  const industry = searchParams.get('industry') ?? ''
  const datePreset = (searchParams.get('range') ?? 'all') as DatePresetKey
  const view = (searchParams.get('view') ?? 'list') as LeadsView

  const dateFrom = useMemo(() => {
    const preset = DATE_PRESETS.find((p) => p.key === datePreset)
    return preset?.days ? isoDaysAgo(preset.days) : undefined
  }, [datePreset])

  const [leads, setLeads] = useState<RFQLead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const data = await getLeads({ industry: industry || undefined, date_from: dateFrom })
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
  }, [industry, dateFrom, router])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLeads()
  }, [fetchLeads])

  function updateQuery(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(next).forEach(([k, v]) => {
      if (v && v !== 'all' && !(k === 'view' && v === 'list')) params.set(k, v)
      else params.delete(k)
    })
    const q = params.toString()
    router.replace(`${pathname}${q ? `?${q}` : ''}`, { scroll: false })
  }

  const applyStatusChange = useCallback(
    async (leadId: string, newStatus: LeadStatus) => {
      const original = leads.find((l) => l.id === leadId)
      if (!original || original.status === newStatus) return

      // Optimistic — `original` ditangkap SEBELUM setState supaya rollback
      // tidak membaca closure basi.
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)))
      try {
        await updateLead(leadId, { status: newStatus })
        toast.success(`Status diubah ke ${LABEL_MAP[newStatus]}`)
      } catch {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: original.status } : l)))
        toast.error('Gagal mengubah status. Coba lagi.')
      }
    },
    [leads]
  )

  const countByStatus = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const l of leads) acc[l.status] = (acc[l.status] ?? 0) + 1
    return acc
  }, [leads])

  const visibleLeads = useMemo(() => {
    const term = search.trim().toLowerCase()
    return leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false
      if (!term) return true
      return (
        l.company_name.toLowerCase().includes(term) ||
        l.full_name.toLowerCase().includes(term)
      )
    })
  }, [leads, search, statusFilter])

  const selectedLead = useMemo(
    () => visibleLeads.find((l) => l.id === selectedId) ?? null,
    [visibleLeads, selectedId]
  )

  function handleSelect(lead: RFQLead) {
    if (isNarrow) {
      router.push(`/admin/leads/${lead.id}`)
      return
    }
    setSelectedId(lead.id)
  }

  const hasActiveFilters = !!(industry || datePreset !== 'all' || search || statusFilter !== 'all')

  function handleReset() {
    setSearch('')
    setStatusFilter('all')
    router.replace(pathname, { scroll: false })
  }

  if (isLoading) {
    return (
      <div className="space-y-3 rounded-xl border border-ink-900/[0.07] bg-white p-5">
        {Array.from({ length: 5 }).map((_, i) => <TextLineSkeleton key={i} />)}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-4 rounded-xl border border-ink-900/[0.07] bg-white p-8 text-center">
        <p className="text-sm text-neutral-600">Gagal memuat leads.</p>
        <button
          type="button"
          onClick={fetchLeads}
          className="font-ui h-9 rounded-xl bg-brand-teal-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-teal-500"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <LeadsToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        countByStatus={countByStatus}
        totalCount={leads.length}
        industry={industry}
        onIndustryChange={(v) => updateQuery({ industry: v || undefined })}
        datePreset={datePreset}
        onDatePresetChange={(k) => updateQuery({ range: k })}
        view={view}
        onViewChange={(v) => updateQuery({ view: v })}
        onReset={handleReset}
        hasActiveFilters={hasActiveFilters}
      />

      {leads.length === 0 ? (
        <div className="rounded-xl border border-ink-900/[0.07] bg-white p-10 text-center">
          <p className="font-ui text-sm font-medium text-ink-700">Belum ada RFQ masuk</p>
          <p className="mt-1 text-xs text-neutral-500">
            Bagikan halaman /minta-penawaran untuk mulai mengumpulkan lead.
          </p>
        </div>
      ) : view === 'kanban' ? (
        <LeadsKanbanBoard leads={visibleLeads} onStatusChange={applyStatusChange} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(320px,380px)_1fr]">
          <div className="overflow-hidden rounded-xl border border-ink-900/[0.07] bg-white">
            {visibleLeads.length === 0 ? (
              <p className="p-6 text-center text-xs text-neutral-500">
                Tidak ada lead yang cocok dengan filter ini.
              </p>
            ) : (
              <LeadsListView leads={visibleLeads} selectedId={selectedId} onSelect={handleSelect} />
            )}
          </div>

          {/* Panel konteks — disembunyikan di bawah lg, tempatnya diambil
              alih halaman detail (lihat handleSelect). */}
          <div className="hidden overflow-hidden rounded-xl border border-ink-900/[0.07] bg-white lg:block">
            <LeadDetailPanel lead={selectedLead} productNames={productNames} onStatusChange={applyStatusChange} />
          </div>
        </div>
      )}

      <p className="mono-tech text-xs text-neutral-400">
        {visibleLeads.length} dari {leads.length} lead
      </p>
    </div>
  )
}
