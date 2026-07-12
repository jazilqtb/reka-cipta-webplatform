// components/admin/supplier/SaltTypesCell.tsx
// Epic 5 Admin (E5-ADM-FE-02) — render daftar jenis garam di SupplierTable,
// truncate ke 2 + "N lainnya" via native title tooltip kalau > 2 (native
// <span title>, bukan Radix Tooltip — memori project: Base UI/native saja).

import { SUPPLIER_SALT_TYPE_LABELS } from '@/lib/constants/supplier-salt-types'

export function SaltTypesCell({ types }: { types: string[] }) {
  const labels = types.map((t) => SUPPLIER_SALT_TYPE_LABELS[t] || t)

  if (labels.length <= 2) {
    return <span>{labels.join(', ')}</span>
  }

  const [first, second, ...rest] = labels
  const fullList = labels.join(', ')

  return (
    <span title={fullList} className="cursor-help underline decoration-dotted">
      {first}, {second} +{rest.length} lainnya
    </span>
  )
}
