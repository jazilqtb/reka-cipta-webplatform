// components/admin/supplier/MetadataCard.tsx
// Epic 5 Admin (E5-ADM-FE-03) — created_at/updated_at supplier, format
// relatif (date-fns, locale id) dengan tooltip tanggal lengkap.

import { format, formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface Props {
  createdAt: string
  updatedAt: string
}

export function MetadataCard({ createdAt, updatedAt }: Props) {
  const createdDate = new Date(createdAt)
  const updatedDate = new Date(updatedAt)

  return (
    <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
      <div>
        <span className="text-neutral-500">Terdaftar:</span>{' '}
        <span title={format(createdDate, 'PPpp', { locale: idLocale })}>
          {format(createdDate, 'd MMM yyyy', { locale: idLocale })}
        </span>
      </div>
      <div>
        <span className="text-neutral-500">Update terakhir:</span>{' '}
        <span title={format(updatedDate, 'PPpp', { locale: idLocale })}>
          {formatDistanceToNow(updatedDate, { locale: idLocale, addSuffix: true })}
        </span>
      </div>
    </div>
  )
}
