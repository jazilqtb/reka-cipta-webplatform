// components/admin/supplier/StatusBadge.tsx
// Epic 5 Admin (E5-ADM-FE-01) — badge status supplier, dipakai di
// SupplierTable dan SupplierDetailView header.

import { cn } from '@/lib/utils'
import type { SupplierStatus } from '@/types/api'

const STATUS_CONFIG: Record<SupplierStatus, { label: string; className: string }> = {
  new: { label: 'Baru', className: 'bg-blue-100 text-blue-800' },
  verified: { label: 'Diverifikasi', className: 'bg-yellow-100 text-yellow-800' },
  active: { label: 'Aktif', className: 'bg-green-100 text-green-800' },
  inactive: { label: 'Tidak Aktif', className: 'bg-neutral-100 text-neutral-700' },
}

export function StatusBadge({ status }: { status: SupplierStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className
      )}
    >
      {config.label}
    </span>
  )
}

// Export label map untuk reuse di dropdown option (SupplierStatusPanel, FilterPanel)
export const SUPPLIER_STATUS_LABELS = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([key, val]) => [key, val.label])
) as Record<SupplierStatus, string>
