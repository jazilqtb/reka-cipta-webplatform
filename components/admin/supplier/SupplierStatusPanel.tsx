'use client'

// components/admin/supplier/SupplierStatusPanel.tsx
// Epic 5 Admin (E5-ADM-FE-13) — dropdown update status supplier, immediate
// on-change save (pattern identik components/admin/lead/StatusPanel.tsx —
// dipilih di atas guide's dirty-state+button variant untuk konsistensi UX
// admin lintas modul, R-58 rationale).

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateSupplier, ApiFetchError } from '@/lib/api'
import { SUPPLIER_STATUS_LABELS } from './StatusBadge'
import type { Supplier, SupplierStatus } from '@/types/api'

const STATUS_OPTIONS = Object.entries(SUPPLIER_STATUS_LABELS) as Array<[SupplierStatus, string]>

interface Props {
  supplier: Supplier
  onStatusChanged: (newStatus: SupplierStatus) => void
}

export function SupplierStatusPanel({ supplier, onStatusChanged }: Props) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)

  async function handleStatusChange(newStatus: SupplierStatus) {
    if (newStatus === supplier.status) return
    setIsUpdating(true)
    try {
      await updateSupplier(supplier.id, { status: newStatus })
      onStatusChanged(newStatus)
      toast.success(`Status diubah ke ${SUPPLIER_STATUS_LABELS[newStatus]}`)
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 401) {
        router.push('/admin/login')
        return
      }
      toast.error('Gagal mengubah status. Coba lagi.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
      <h3 className="font-semibold text-ink-700">Status</h3>
      <select
        value={supplier.status}
        disabled={isUpdating}
        onChange={(e) => handleStatusChange(e.target.value as SupplierStatus)}
        className="h-10 w-full rounded-md border border-neutral-300 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600 disabled:opacity-60"
      >
        {STATUS_OPTIONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}
