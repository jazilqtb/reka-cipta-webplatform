'use client'

// components/admin/company/DuplicateReview.tsx — CP1 ronde 3
//
// Daftar kandidat duplikat, dan admin yang memutuskan.
//
// TIDAK ADA tombol "gabungkan semua". Itu disengaja. Penggabungan massal
// terlihat efisien sampai satu pasangan ternyata dua perusahaan berbeda —
// dan setelah riwayat pesanan tercampur, tidak ada yang tahu baris mana milik
// siapa. Setiap pasangan diputuskan sendiri-sendiri, dan setiap keputusan
// bisa dibatalkan.

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ArrowsMergeIcon, ArrowClockwiseIcon, XIcon } from '@phosphor-icons/react'
import { AdminCard } from '@/components/admin/ui/AdminPrimitives'
import { AdminState } from '@/components/admin/ui/AdminState'
import { mergeCompanies, rejectMergeCandidate, refreshMergeCandidates } from '@/app/actions/companies'

export interface CandidateRow {
  id: string
  score: number
  reason: string
  a: { id: string; name: string; rfqCount: number; createdAt: string }
  b: { id: string; name: string; rfqCount: number; createdAt: string }
}

export function DuplicateReview({ candidates }: { candidates: CandidateRow[] }) {
  const [rows, setRows] = useState(candidates)
  const [pending, startTransition] = useTransition()

  function doMerge(c: CandidateRow, survivingId: string) {
    const mergedId = survivingId === c.a.id ? c.b.id : c.a.id
    startTransition(async () => {
      const res = await mergeCompanies(survivingId, mergedId)
      if (res.ok) {
        setRows((r) => r.filter((x) => x.id !== c.id))
        toast.success('Perusahaan digabungkan. Bisa dibatalkan dari riwayat.')
      } else toast.error(res.error ?? 'Gagal menggabungkan')
    })
  }
  function doReject(c: CandidateRow) {
    startTransition(async () => {
      const res = await rejectMergeCandidate(c.id)
      if (res.ok) {
        setRows((r) => r.filter((x) => x.id !== c.id))
        toast.success('Ditandai bukan duplikat')
      } else toast.error(res.error ?? 'Gagal menyimpan')
    })
  }

  return (
    <AdminCard className="p-4 md:p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-ui text-sm font-semibold text-ink-700">Kemungkinan duplikat</h2>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await refreshMergeCandidates()
              if (res.ok) toast.success(`Pemindaian selesai — ${res.found ?? 0} kandidat baru`)
              else toast.error(res.error ?? 'Gagal memindai')
            })
          }
          className="font-ui inline-flex h-8 items-center gap-1.5 rounded-md border border-ink-900/12 px-2.5 text-xs font-medium text-ink-700 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-40"
        >
          <ArrowClockwiseIcon size={16} aria-hidden="true" />
          Pindai ulang
        </button>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-neutral-500">
        Sistem hanya <strong className="font-medium text-ink-700">mengusulkan</strong>. Tidak ada
        perusahaan yang digabungkan tanpa Anda tekan tombolnya. Pilih perusahaan mana yang
        dipertahankan — seluruh RFQ dan kontak dari yang satunya akan berpindah ke sana.
      </p>

      {rows.length === 0 ? (
        <AdminState
          title="Tidak ada kandidat duplikat"
          description="Perusahaan baru diperiksa otomatis setiap kali RFQ masuk."
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((c) => (
            <li key={c.id} className="rounded-md border border-ink-900/[0.09] p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="mono-tech rounded-sm bg-warning-50 px-1.5 py-0.5 text-xs text-warning-700">
                  {Math.round(c.score * 100)}% mirip
                </span>
                <span className="text-xs text-neutral-500">{c.reason}</span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {[c.a, c.b].map((side) => (
                  <div key={side.id} className="rounded-md border border-ink-900/[0.07] bg-neutral-50 p-2.5">
                    <p className="font-ui truncate text-sm font-medium text-ink-700">{side.name}</p>
                    <p className="mono-tech mt-0.5 text-xs text-neutral-500">
                      {side.rfqCount} RFQ · sejak {new Date(side.createdAt).getFullYear()}
                    </p>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => doMerge(c, side.id)}
                      className="font-ui mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-brand-teal-600 px-2.5 text-xs font-medium text-white transition-colors hover:bg-brand-teal-500 focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-50"
                    >
                      <ArrowsMergeIcon size={16} aria-hidden="true" />
                      Pertahankan yang ini
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={pending}
                onClick={() => doReject(c)}
                className="font-ui mt-2 inline-flex items-center gap-1 text-xs font-medium text-neutral-500 transition-colors hover:text-ink-700 focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-50"
              >
                <XIcon size={16} aria-hidden="true" />
                Bukan duplikat
              </button>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  )
}
