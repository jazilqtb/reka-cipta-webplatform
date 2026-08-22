// components/admin/log/ApiLogTable.tsx — CP0 ronde 4
//
// Tabel padat mengikuti DESIGN-SYSTEM.md §4.11: angka rata kanan &
// `mono-tech`, kepala kolom `text-xs` netral, seluruh tabel di dalam
// `overflow-x-auto` dengan `min-width` supaya badan halaman tidak pernah
// menggulir mendatar.

import type { ApiLogRow } from '@/lib/data/api-log'
import { AdminState } from '@/components/admin/ui/AdminState'

/** Warna titik status. Mengikuti palet §4.11: berhasil / perhatian /
 *  gagal. Tidak ada warna baru diperkenalkan. */
function toneFor(status: number): { dot: string; text: string } {
  if (status >= 500) return { dot: 'bg-danger-600', text: 'text-danger-700' }
  if (status >= 400) return { dot: 'bg-warning-500', text: 'text-warning-700' }
  return { dot: 'bg-success-600', text: 'text-success-700' }
}

function formatTime(iso: string): string {
  /* Waktu lokal admin (WIB), bukan UTC. Catatan yang jamnya berselisih
     tujuh jam dari jam dinding pembacanya akan dibaca salah — dan itu
     kesalahan yang persis pernah terjadi pada penjadwalan artikel CP5. */
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatContext(ctx: Record<string, unknown> | null): string {
  if (!ctx || Object.keys(ctx).length === 0) return '—'
  return Object.entries(ctx)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(' · ')
}

export function ApiLogTable({ rows }: { rows: ApiLogRow[] }) {
  if (rows.length === 0) {
    return (
      <AdminState
        tone="empty"
        title="Belum ada catatan"
        description="Catatan muncul setelah ada permintaan yang mengubah data, atau permintaan mana pun yang gagal. Permintaan baca yang berhasil sengaja tidak dicatat."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-ink-900/[0.07] text-left">
            <th className="font-ui pb-2 pr-3 text-xs font-medium text-neutral-500">Waktu</th>
            <th className="font-ui pb-2 pr-3 text-xs font-medium text-neutral-500">Metode</th>
            <th className="font-ui pb-2 pr-3 text-xs font-medium text-neutral-500">Path</th>
            <th className="font-ui pb-2 pr-3 text-right text-xs font-medium text-neutral-500">Status</th>
            <th className="font-ui pb-2 pr-3 text-right text-xs font-medium text-neutral-500">Durasi</th>
            <th className="font-ui pb-2 text-xs font-medium text-neutral-500">Sebab / konteks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-900/[0.06]">
          {rows.map((r) => {
            const tone = toneFor(r.status)
            return (
              <tr key={r.id}>
                <td className="mono-tech whitespace-nowrap py-2.5 pr-3 text-xs text-neutral-600">
                  {formatTime(r.occurred_at)}
                </td>
                <td className="mono-tech py-2.5 pr-3 text-xs text-neutral-700">{r.method}</td>
                <td className="mono-tech py-2.5 pr-3 text-xs text-ink-700">{r.path}</td>
                <td className="py-2.5 pr-3 text-right">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
                    <span className={`mono-tech text-xs ${tone.text}`}>{r.status}</span>
                  </span>
                </td>
                <td className="mono-tech py-2.5 pr-3 text-right text-xs text-neutral-600">
                  {r.duration_ms} ms
                </td>
                <td className="py-2.5 text-xs text-neutral-600">
                  {r.failure_reason ? (
                    <span className={tone.text}>{r.failure_reason}</span>
                  ) : (
                    formatContext(r.context)
                  )}
                  {r.failure_reason && r.context && (
                    <span className="text-neutral-500"> · {formatContext(r.context)}</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
