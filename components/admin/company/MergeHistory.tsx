'use client'

// components/admin/company/MergeHistory.tsx — CP1 ronde 3
// Riwayat penggabungan + pembatalan.
//
// Ada supaya penggabungan tidak pernah menjadi keputusan sekali jalan.
// Menggabungkan dua perusahaan yang ternyata berbeda mencampur riwayat
// pesanan dua pelanggan — kesalahan yang baru ketahuan berminggu-minggu
// kemudian, saat sudah tidak ada yang ingat pasangannya.

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ArrowUUpLeftIcon } from '@phosphor-icons/react'
import { AdminCard } from '@/components/admin/ui/AdminPrimitives'
import { undoCompanyMerge } from '@/app/actions/companies'

export interface MergeHistoryItem {
  id: string
  createdAt: string
  survivingName: string
  mergedName: string
}

export function MergeHistory({ items }: { items: MergeHistoryItem[] }) {
  const [rows, setRows] = useState(items)
  const [pending, startTransition] = useTransition()
  if (rows.length === 0) return null

  return (
    <AdminCard className="p-4 md:p-5">
      <h2 className="font-ui mb-3 text-sm font-semibold text-ink-700">Riwayat penggabungan</h2>
      <ul className="space-y-2">
        {rows.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-ink-900/[0.07] p-2.5">
            <span className="min-w-0 text-sm text-ink-700">
              <span className="font-medium">{m.mergedName}</span>
              <span className="text-neutral-500"> digabung ke </span>
              <span className="font-medium">{m.survivingName}</span>
              <span className="mono-tech ml-2 text-xs text-neutral-400">
                {new Date(m.createdAt).toLocaleDateString('id-ID')}
              </span>
            </span>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await undoCompanyMerge(m.id)
                  if (res.ok) { setRows((r) => r.filter((x) => x.id !== m.id)); toast.success('Penggabungan dibatalkan') }
                  else toast.error(res.error ?? 'Gagal membatalkan')
                })
              }
              className="font-ui inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-ink-900/12 px-2.5 text-xs font-medium text-ink-700 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-40"
            >
              <ArrowUUpLeftIcon size={16} aria-hidden="true" />
              Batalkan
            </button>
          </li>
        ))}
      </ul>
    </AdminCard>
  )
}
