'use client'

// components/admin/supplier/FilterPanel.tsx
// Epic 5 Admin (E5-ADM-FE-05, R-58) — filter status + search, keduanya
// disinkron ke URL query params (reuse pattern Epic 4B FilterPanel, beda
// dari situ: search di sini JUGA di-push ke URL, bukan cuma client-state).
// Search debounce 300ms sebelum router.push.

import { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { SUPPLIER_STATUS_LABELS } from './StatusBadge'
import type { SupplierStatus } from '@/types/api'

const STATUS_OPTIONS: Array<{ value: SupplierStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Semua Status' },
  ...(Object.entries(SUPPLIER_STATUS_LABELS) as Array<[SupplierStatus, string]>).map(([value, label]) => ({
    value,
    label,
  })),
]

export function FilterPanel() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchValue, setSearchValue] = useState(searchParams.get('search') ?? '')
  const currentStatus = searchParams.get('status') ?? 'all'

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false })
  }

  // Debounce search 300ms sebelum push URL (R-58)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParam('search', searchValue || null)
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  const hasActiveFilter = currentStatus !== 'all' || !!searchParams.get('search')

  function handleReset() {
    setSearchValue('')
    router.push(pathname, { scroll: false })
  }

  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3 md:flex-row md:items-center">
      <div className="relative w-full flex-1 md:max-w-md">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="search"
          placeholder="Cari nama usaha atau lokasi..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="h-9 w-full rounded-md border border-neutral-300 pl-10 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600"
        />
      </div>

      <select
        value={currentStatus}
        onChange={(e) => updateParam('status', e.target.value === 'all' ? null : e.target.value)}
        className="h-9 rounded-md border border-neutral-300 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {hasActiveFilter && (
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"
        >
          <X className="h-4 w-4" />
          Reset
        </button>
      )}
    </div>
  )
}
