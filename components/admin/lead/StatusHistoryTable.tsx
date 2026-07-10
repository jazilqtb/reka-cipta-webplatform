// components/admin/lead/StatusHistoryTable.tsx
// Epic 4B Slice 1 (E4B-S1-FE-12) — tabel histori perubahan status,
// data dari trigger DB (lead_status_history), read-only.

import { LABEL_MAP } from '@/lib/constants/lead-status'
import type { LeadStatusHistory } from '@/types/api'

function formatDateIndonesian(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function StatusHistoryTable({ history }: { history: LeadStatusHistory[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-neutral-400 py-4">Belum ada histori status</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-neutral-500 border-b border-neutral-200">
            <th className="py-2 pr-4 font-medium">Waktu</th>
            <th className="py-2 pr-4 font-medium">Dari</th>
            <th className="py-2 font-medium">Ke</th>
          </tr>
        </thead>
        <tbody>
          {history.map((row) => (
            <tr key={row.id} className="border-b border-neutral-100 last:border-0">
              <td className="py-2 pr-4 text-neutral-600 whitespace-nowrap">
                {formatDateIndonesian(row.changed_at)}
              </td>
              <td className="py-2 pr-4 text-neutral-600">
                {row.from_status ? LABEL_MAP[row.from_status] : <span className="italic text-neutral-400">(awal)</span>}
              </td>
              <td className="py-2 font-medium text-ink-700">{LABEL_MAP[row.to_status]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
