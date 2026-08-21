'use client'

// components/admin/distribution/RecapTable.tsx — CP3 ronde 3
//
// TABEL, BUKAN PIE CHART. Angka di sini dibaca untuk diputuskan: "produk
// mana yang kurang pasokan minggu ini, dan berapa kurangnya". Pertanyaan
// itu dijawab angka persis, bukan luas juring. Grafik dipakai di tempat
// lain hanya kalau bentuk datanya memang lebih terbaca sebagai bentuk —
// lihat DESIGN-SYSTEM §4.11.
//
// Satu-satunya elemen grafis di sini adalah bilah pemenuhan: ia menjawab
// "seberapa jauh dari target" dalam sekali lihat, dan angkanya tetap
// tertulis di sebelahnya.

import { formatKg } from '@/lib/rfq-units'
import type { ProductRecap } from '@/lib/data/distribution'

export function RecapTable({ rows }: { rows: ProductRecap[] }) {
  if (rows.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-ink-900/[0.07] text-left">
            <th className="font-ui pb-2 text-xs font-medium text-neutral-500">Jenis garam</th>
            <th className="font-ui pb-2 text-right text-xs font-medium text-neutral-500">Dijanjikan</th>
            <th className="font-ui pb-2 text-right text-xs font-medium text-neutral-500">Terkirim</th>
            <th className="font-ui pb-2 text-right text-xs font-medium text-neutral-500">Selisih</th>
            <th className="font-ui pb-2 pl-4 text-xs font-medium text-neutral-500">Pemenuhan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-900/[0.06]">
          {rows.map((r) => {
            const pct = r.deliveredKg === null || r.promisedKg === 0
              ? null
              : Math.min(Math.round((r.deliveredKg / r.promisedKg) * 100), 999)
            const short = r.gapKg !== null && r.gapKg > 0
            return (
              <tr key={r.productSlug}>
                <td className="py-2.5 pr-3 text-ink-700">{r.productName}</td>
                <td className="mono-tech py-2.5 pr-3 text-right text-neutral-700">
                  {formatKg(r.promisedKg)}
                </td>
                <td className="mono-tech py-2.5 pr-3 text-right">
                  {r.deliveredKg === null ? (
                    /* BUKAN 0. Belum ada catatan pengiriman untuk produk ini,
                       dan itu kenyataan yang berbeda dari "terkirim nol". */
                    <span className="text-xs text-neutral-400">belum ada catatan</span>
                  ) : (
                    <span className="text-neutral-700">{formatKg(r.deliveredKg)}</span>
                  )}
                </td>
                <td className="mono-tech py-2.5 pr-3 text-right">
                  {r.gapKg === null ? (
                    <span className="text-xs text-neutral-400">—</span>
                  ) : (
                    <span className={short ? 'text-warning-700' : 'text-success-700'}>
                      {short ? '−' : '+'}{formatKg(Math.abs(r.gapKg))}
                    </span>
                  )}
                </td>
                <td className="py-2.5 pl-4">
                  {pct === null ? (
                    <span className="text-xs text-neutral-400">—</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-24 overflow-hidden rounded-sm bg-neutral-200">
                        <span
                          className={`block h-full ${pct >= 100 ? 'bg-success-600' : pct >= 70 ? 'bg-warning-600' : 'bg-danger-600'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </span>
                      <span className="mono-tech text-xs text-neutral-600">{pct}%</span>
                    </span>
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
