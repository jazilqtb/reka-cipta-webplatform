// components/admin/lead/LeadsToolbar.tsx
// CP2 (2026-08-19) — satu baris kendali untuk seluruh permukaan Leads.
//
// Menggantikan FilterPanel lama (kotak putih 3 baris berisi search,
// <select>, dan dua <input type="date">). Perubahan utamanya BUKAN
// kosmetik:
//
// 1. Status jadi CHIP, bukan kolom. Dengan 3 lead di 6 status, Kanban
//    memaksa 6 kolom yang 4 di antaranya kosong. Chip menampilkan jumlah
//    per status tanpa memakan lebar.
// 2. Tanggal jadi PRESET. Lihat alasannya di lib/lead-format.ts.
// 3. Toggle tampilan Daftar/Kanban — Kanban tidak dibuang, diturunkan
//    jadi pilihan.

'use client'

import { ListIcon, KanbanIcon, MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react/ssr'
import { LEAD_STATUSES, LABEL_MAP } from '@/lib/constants/lead-status'
import { DATE_PRESETS, type DatePresetKey } from '@/lib/lead-format'
import { INDUSTRY_OPTIONS } from '@/lib/validation/rfq-schema'
import type { LeadStatus } from '@/types/api'

export type LeadsView = 'list' | 'kanban'

interface Props {
  search: string
  onSearchChange: (v: string) => void
  statusFilter: LeadStatus | 'all'
  onStatusFilterChange: (s: LeadStatus | 'all') => void
  countByStatus: Record<string, number>
  totalCount: number
  industry: string
  onIndustryChange: (v: string) => void
  datePreset: DatePresetKey
  onDatePresetChange: (k: DatePresetKey) => void
  view: LeadsView
  onViewChange: (v: LeadsView) => void
  onReset: () => void
  hasActiveFilters: boolean
}

export function LeadsToolbar({
  search, onSearchChange, statusFilter, onStatusFilterChange, countByStatus, totalCount,
  industry, onIndustryChange, datePreset, onDatePresetChange, view, onViewChange,
  onReset, hasActiveFilters,
}: Props) {
  return (
    <div className="space-y-3">
      {/* Baris 1 — cari, industri, rentang, toggle tampilan */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <MagnifyingGlassIcon
            size={16} weight="bold" aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama atau perusahaan…"
            aria-label="Cari lead"
            className="h-9 w-full rounded-xl border border-ink-900/10 bg-white pl-9 pr-3 text-sm text-ink-700 placeholder:text-neutral-400 focus-visible:shadow-focus focus-visible:outline-none"
          />
        </div>

        <select
          value={industry}
          onChange={(e) => onIndustryChange(e.target.value)}
          aria-label="Saring menurut industri"
          className="h-9 rounded-xl border border-ink-900/10 bg-white px-2.5 text-sm text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
        >
          <option value="">Semua industri</option>
          {INDUSTRY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={datePreset}
          onChange={(e) => onDatePresetChange(e.target.value as DatePresetKey)}
          aria-label="Saring menurut rentang waktu"
          className="h-9 rounded-xl border border-ink-900/10 bg-white px-2.5 text-sm text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
        >
          {DATE_PRESETS.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="font-ui flex h-9 items-center gap-1.5 rounded-xl border border-ink-900/10 bg-white px-3 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none"
          >
            <XIcon size={13} weight="bold" aria-hidden="true" />
            Reset
          </button>
        )}

        <div className="ml-auto flex items-center gap-0.5 rounded-xl border border-ink-900/10 bg-white p-0.5">
          <ViewButton active={view === 'list'} onClick={() => onViewChange('list')} label="Daftar">
            <ListIcon size={15} weight="bold" aria-hidden="true" />
          </ViewButton>
          <ViewButton active={view === 'kanban'} onClick={() => onViewChange('kanban')} label="Kanban">
            <KanbanIcon size={15} weight="bold" aria-hidden="true" />
          </ViewButton>
        </div>
      </div>

      {/* Baris 2 — chip status. Hanya di tampilan Daftar: di Kanban,
          kolomnya SUDAH menyatakan status, jadi chip akan mubazir. */}
      {view === 'list' && (
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusChip
            active={statusFilter === 'all'}
            onClick={() => onStatusFilterChange('all')}
            label="Semua"
            count={totalCount}
          />
          {LEAD_STATUSES.map((s) => (
            <StatusChip
              key={s}
              active={statusFilter === s}
              onClick={() => onStatusFilterChange(s)}
              label={LABEL_MAP[s]}
              count={countByStatus[s] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ViewButton({
  active, onClick, label, children,
}: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={`Tampilan ${label}`}
      className={[
        'font-ui flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors duration-100',
        'focus-visible:shadow-focus focus-visible:outline-none',
        active ? 'bg-brand-teal-600 text-white' : 'text-neutral-500 hover:bg-neutral-50 hover:text-ink-700',
      ].join(' ')}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function StatusChip({
  active, onClick, label, count,
}: { active: boolean; onClick: () => void; label: string; count: number }) {
  // Status berjumlah nol tetap ditampilkan tapi diredupkan. Menyembunyikannya
  // akan membuat daftar chip berubah-ubah panjang setiap kali data berganti,
  // dan menghilangkan informasi "tahap ini memang kosong".
  const empty = count === 0
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'font-ui flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors duration-100',
        'focus-visible:shadow-focus focus-visible:outline-none',
        active
          ? 'border-brand-teal-600 bg-brand-teal-600 text-white'
          : empty
            ? 'border-ink-900/[0.07] bg-white text-neutral-400 hover:border-ink-900/15'
            : 'border-ink-900/10 bg-white text-ink-700 hover:border-brand-teal-600/40 hover:bg-brand-teal-50/50',
      ].join(' ')}
    >
      {label}
      <span className={['mono-tech text-[11px]', active ? 'text-white/80' : 'text-neutral-400'].join(' ')}>
        {count}
      </span>
    </button>
  )
}
