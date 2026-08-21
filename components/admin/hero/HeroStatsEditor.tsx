'use client'

// components/admin/hero/HeroStatsEditor.tsx — CP3 (2026-08-21)
//
// Angka statistik hero = BASELINE (ditetapkan admin) + DINAMIS (dihitung
// dari data nyata). Panel ini memperlihatkan keduanya secara terpisah,
// bukan hanya hasil akhirnya — kalau admin cuma melihat "12", ia tidak bisa
// tahu bagian mana yang akan ikut berubah sendiri besok.

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { FloppyDiskIcon } from '@phosphor-icons/react'
import { AdminCard } from '@/components/admin/ui/AdminPrimitives'
import { InfoHint } from '@/components/admin/ui/InfoHint'
import { heroStatTotal, type HeroStat } from '@/lib/data/hero'
import { saveHeroBaselines } from '@/app/actions/hero-stats'

export function HeroStatsEditor({ stats }: { stats: HeroStat[] }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(stats.map((s) => [s.key, String(s.baseline)]))
  )
  const [pending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      const res = await saveHeroBaselines(values)
      if (res.ok) toast.success('Angka dasar disimpan')
      else toast.error(res.error ?? 'Gagal menyimpan')
    })
  }

  return (
    <AdminCard className="p-4 md:p-5">
      <div className="mb-1 flex items-center gap-1.5">
        <h2 className="font-ui text-sm font-semibold text-ink-700">Angka statistik</h2>
        <InfoHint title="Angka dasar + data nyata">
          Angka yang tampil di beranda = angka dasar yang Anda isi + angka yang
          dihitung otomatis dari data. Isi angka dasar dengan capaian yang belum
          tercatat di sistem, misalnya kemitraan sebelum situs ini ada.
        </InfoHint>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-ink-900/[0.07] text-left">
              <th className="font-ui pb-2 text-xs font-medium text-neutral-500">Statistik</th>
              <th className="font-ui pb-2 text-xs font-medium text-neutral-500">Angka dasar</th>
              <th className="font-ui pb-2 text-xs font-medium text-neutral-500">Dari data</th>
              <th className="font-ui pb-2 text-right text-xs font-medium text-neutral-500">Tampil</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/[0.06]">
            {stats.map((s) => {
              const baseline = Number(values[s.key] ?? s.baseline) || 0
              const total = heroStatTotal({ ...s, baseline })
              return (
                <tr key={s.key}>
                  <td className="py-2.5 pr-3 text-ink-700">{s.label}</td>
                  <td className="py-2.5 pr-3">
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={values[s.key] ?? ''}
                      disabled={pending}
                      onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                      aria-label={`Angka dasar ${s.label}`}
                      className="h-9 w-24 rounded-md border border-ink-900/15 px-2 text-sm text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
                    />
                  </td>
                  <td className="py-2.5 pr-3">
                    {s.dynamic === null ? (
                      /* Dinyatakan apa adanya, bukan disamarkan sebagai 0 —
                         "tidak punya sumber" dan "sumbernya nol" adalah dua
                         hal berbeda, dan admin berhak tahu bedanya. */
                      <span className="font-ui text-xs text-neutral-400">
                        belum ada sumber
                      </span>
                    ) : (
                      <span className="mono-tech text-sm text-success-700">+{s.dynamic}</span>
                    )}
                  </td>
                  <td className="mono-tech py-2.5 text-right text-base font-semibold text-ink-700">
                    {total}
                    {s.suffix}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-neutral-500">
        <strong className="font-medium text-ink-700">Ton Distribusi</strong> belum
        punya sumber otomatis. Satu-satunya angka volume di sistem adalah volume
        bulanan yang <em>diminta</em> pada tiap RFQ — bukan tonase yang sudah
        dikirim. Menjumlahkannya akan menghasilkan angka yang terlihat resmi tapi
        artinya keliru, jadi angka ini murni dari isian Anda.
      </p>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="font-ui inline-flex h-9 items-center gap-2 rounded-md bg-brand-teal-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-teal-500 focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-50"
        >
          <FloppyDiskIcon size={16} weight="bold" aria-hidden="true" />
          {pending ? 'Menyimpan…' : 'Simpan angka dasar'}
        </button>
      </div>
    </AdminCard>
  )
}
