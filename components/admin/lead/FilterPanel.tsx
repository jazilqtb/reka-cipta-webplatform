'use client'

// components/admin/lead/FilterPanel.tsx
// Epic 4B Slice 1 (E4B-S1-FE-06) — filter industri + date range (refetch
// backend) + search (client-side, real-time). URL query params disinkron
// via router.replace supaya filter state deep-linkable.

import { useRouter, usePathname } from 'next/navigation'
import { INDUSTRY_OPTIONS } from '@/lib/validation/rfq-schema'

export interface LeadFilters {
  industry?: string
  date_from?: string
  date_to?: string
  search?: string
}

interface Props {
  filters: LeadFilters
  search: string
  onSearchChange: (value: string) => void
}

export function FilterPanel({ filters, search, onSearchChange }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function updateQuery(next: Partial<LeadFilters>) {
    const merged = { ...filters, ...next }
    const params = new URLSearchParams()
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    const query = params.toString()
    router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false })
  }

  function handleReset() {
    onSearchChange('')
    router.replace(pathname, { scroll: false })
  }

  const hasActiveFilters = !!(filters.industry || filters.date_from || filters.date_to || search)

  return (
    <div className="flex flex-wrap items-end gap-3 bg-white rounded-lg border border-neutral-200 p-3">
      <div className="flex-1 min-w-[180px]">
        <label htmlFor="lead-search" className="block text-xs font-medium text-neutral-600 mb-1">
          Cari
        </label>
        <input
          id="lead-search"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Nama atau perusahaan..."
          className="w-full h-9 rounded-md border border-neutral-300 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600"
        />
      </div>

      <div>
        <label htmlFor="lead-industry" className="block text-xs font-medium text-neutral-600 mb-1">
          Industri
        </label>
        <select
          id="lead-industry"
          value={filters.industry ?? ''}
          onChange={(e) => updateQuery({ industry: e.target.value || undefined })}
          className="h-9 rounded-md border border-neutral-300 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600"
        >
          <option value="">Semua Industri</option>
          {INDUSTRY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="lead-date-from" className="block text-xs font-medium text-neutral-600 mb-1">
          Dari Tanggal
        </label>
        <input
          id="lead-date-from"
          type="date"
          value={filters.date_from ?? ''}
          onChange={(e) => updateQuery({ date_from: e.target.value || undefined })}
          className="h-9 rounded-md border border-neutral-300 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600"
        />
      </div>

      <div>
        <label htmlFor="lead-date-to" className="block text-xs font-medium text-neutral-600 mb-1">
          Sampai Tanggal
        </label>
        <input
          id="lead-date-to"
          type="date"
          value={filters.date_to ?? ''}
          onChange={(e) => updateQuery({ date_to: e.target.value || undefined })}
          className="h-9 rounded-md border border-neutral-300 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600"
        />
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleReset}
          className="h-9 px-3 rounded-md border border-neutral-300 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          Reset Filter
        </button>
      )}
    </div>
  )
}
