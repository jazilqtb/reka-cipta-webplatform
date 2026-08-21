// app/admin/distribusi/page.tsx — CP3 ronde 3
//
// Pusat pemantauan distribusi: apa yang DIJANJIKAN vs apa yang
// DIREALISASIKAN, per periode, plus sisi pasokan.
//
// SETIAP BLOK DI HALAMAN INI LULUS UJI "apa yang akan dilakukan admin
// berbeda setelah melihat angka ini?":
//   · Rekap per jenis garam -> tahu jenis mana yang kurang pasokan, dan
//     berapa kurangnya, sehingga bisa menghubungi supplier yang tepat.
//   · Rekap per mitra -> tahu mitra mana yang janjinya belum terpenuhi,
//     sehingga tahu siapa yang harus dikabari sebelum ia menagih.
//   · Sisi supplier -> tahu kapasitas siapa yang masih longgar.
// Yang TIDAK dibuat: "total lead sepanjang masa", "rata-rata nilai deal",
// dan sejenisnya — angka yang enak dilihat tapi tidak mengubah tindakan
// siapa pun pada tim beranggota satu sampai dua orang.

import Link from 'next/link'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { AdminPageHeader, AdminCard } from '@/components/admin/ui/AdminPrimitives'
import { AdminState } from '@/components/admin/ui/AdminState'
import { RecapTable } from '@/components/admin/distribution/RecapTable'
import { DistributionEntryForms } from '@/components/admin/distribution/DistributionEntryForms'
import { getDistributionRecap, PERIODS, type PeriodKey } from '@/lib/data/distribution'
import { createClient } from '@/lib/supabase/server'
import { formatKg } from '@/lib/rfq-units'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Distribusi' }

interface Props { searchParams: Promise<{ period?: string }> }

export default async function DistribusiPage({ searchParams }: Props) {
  const sp = await searchParams
  const period = (PERIODS.some((p) => p.value === sp.period) ? sp.period : '1m') as PeriodKey

  const supabase = await createClient()
  const [recap, { data: companies }, { data: products }, { data: suppliers },
         { data: commitRows }, { data: shipRows }] = await Promise.all([
    getDistributionRecap(period),
    supabase.from('companies').select('id, name').is('merged_into_id', null).order('name'),
    supabase.from('products').select('slug, name').order('name'),
    supabase.from('supplier_registrations').select('id, business_name').eq('status', 'active'),
    supabase.from('supply_commitments')
      .select('id, qty_kg, period, source, product_slug, companies(name)')
      .order('created_at', { ascending: false }).limit(50),
    supabase.from('shipments')
      .select('id, qty_kg, shipped_on, product_slug, companies(name)')
      .order('shipped_on', { ascending: false }).limit(50),
  ])

  const productLabel = new Map((products ?? []).map((p) => [p.slug as string, p.name as string]))
  const nameOf = (r: unknown) => ((r as { name?: string } | null)?.name) ?? '(tidak diketahui)'

  const hasData = recap.totals.commitmentCount > 0 || recap.totals.shipmentCount > 0

  return (
    <>
      <AdminHeader title="Distribusi" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="page-transition mx-auto max-w-6xl space-y-5">
          <AdminPageHeader
            title="Distribusi"
            description={`Janji vs realisasi, ${recap.from} sampai ${recap.to}.`}
          />

          {/* Pemilih periode + ekspor */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {PERIODS.map((p) => (
                <Link
                  key={p.value}
                  href={`/admin/distribusi?period=${p.value}`}
                  aria-current={p.value === period ? 'page' : undefined}
                  className={[
                    'font-ui inline-flex h-8 items-center rounded-md px-3 text-xs font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none',
                    p.value === period
                      ? 'bg-brand-teal-600 text-white'
                      : 'border border-ink-900/12 text-neutral-600 hover:bg-neutral-50',
                  ].join(' ')}
                >
                  {p.label}
                </Link>
              ))}
            </div>
            <div className="flex gap-2">
              {(['csv', 'json'] as const).map((f) => (
                <a
                  key={f}
                  href={`/api/admin/distribusi/export?period=${period}&format=${f}`}
                  className="font-ui inline-flex h-8 items-center rounded-md border border-ink-900/12 px-2.5 text-xs font-medium text-ink-700 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none"
                >
                  Ekspor {f.toUpperCase()}
                </a>
              ))}
            </div>
          </div>

          {!hasData ? (
            <AdminCard>
              <AdminState
                title="Belum ada data distribusi"
                description="Sistem ini belum pernah menyimpan realisasi pengiriman. Tambahkan komitmen dan pengiriman di bawah — angka rekap akan muncul begitu ada baris pertama."
              />
            </AdminCard>
          ) : (
            <>
              {/* Ringkasan angka */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tile label="Dijanjikan" value={formatKg(recap.totals.promisedKg)}
                      hint={`${recap.totals.commitmentCount} komitmen aktif`} />
                <Tile
                  label="Terkirim"
                  value={recap.totals.deliveredKg === null ? null : formatKg(recap.totals.deliveredKg)}
                  hint={`${recap.totals.shipmentCount} pengiriman tercatat`}
                />
                <Tile
                  label="Selisih"
                  value={
                    recap.totals.deliveredKg === null
                      ? null
                      : formatKg(Math.abs(recap.totals.promisedKg - recap.totals.deliveredKg))
                  }
                  hint={
                    recap.totals.deliveredKg === null
                      ? 'butuh catatan pengiriman'
                      : recap.totals.deliveredKg >= recap.totals.promisedKg ? 'melebihi janji' : 'kurang dari janji'
                  }
                />
                <Tile label="Mitra aktif" value={String(recap.partners.length)} hint="punya janji/pengiriman" />
              </div>

              <AdminCard className="p-4 md:p-5">
                <h2 className="font-ui mb-3 text-sm font-semibold text-ink-700">Per jenis garam</h2>
                <RecapTable rows={recap.products} />
              </AdminCard>

              <div className="grid gap-5 lg:grid-cols-2">
                <AdminCard className="p-4 md:p-5">
                  <h2 className="font-ui mb-3 text-sm font-semibold text-ink-700">Per mitra</h2>
                  {recap.partners.length === 0 ? (
                    <AdminState title="Belum ada mitra dengan janji atau pengiriman" />
                  ) : (
                    <ul className="divide-y divide-ink-900/[0.06]">
                      {recap.partners.map((m) => (
                        <li key={m.companyId} className="flex items-baseline justify-between gap-3 py-2.5">
                          <span className="min-w-0 truncate text-sm text-ink-700">{m.companyName}</span>
                          <span className="mono-tech shrink-0 text-xs">
                            <span className="text-neutral-700">{formatKg(m.promisedKg)}</span>
                            <span className="text-neutral-400"> / </span>
                            {m.deliveredKg === null
                              ? <span className="text-neutral-400">belum ada catatan</span>
                              : <span className="text-success-700">{formatKg(m.deliveredKg)}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </AdminCard>

                <AdminCard className="p-4 md:p-5">
                  <h2 className="font-ui mb-1 text-sm font-semibold text-ink-700">Sisi pasokan</h2>
                  <p className="mb-3 text-xs text-neutral-500">
                    Kapasitas berasal dari formulir pendaftaran supplier — angka yang mereka
                    nyatakan sendiri, bukan hasil pengukuran.
                  </p>
                  {recap.suppliers.length === 0 ? (
                    <AdminState title="Belum ada supplier berstatus aktif" />
                  ) : (
                    <ul className="divide-y divide-ink-900/[0.06]">
                      {recap.suppliers.map((s) => (
                        <li key={s.supplierId} className="flex items-baseline justify-between gap-3 py-2.5">
                          <span className="min-w-0 truncate text-sm text-ink-700">{s.businessName}</span>
                          <span className="mono-tech shrink-0 text-xs">
                            {s.capacityKg === null
                              ? <span className="text-neutral-400">kapasitas tidak diketahui</span>
                              : <span className="text-neutral-700">{formatKg(s.capacityKg)}</span>}
                            <span className="text-neutral-400"> / </span>
                            {s.suppliedKg === null
                              ? <span className="text-neutral-400">belum ada catatan</span>
                              : <span className="text-success-700">{formatKg(s.suppliedKg)}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </AdminCard>
              </div>
            </>
          )}

          <DistributionEntryForms
            companies={(companies ?? []).map((c) => ({ id: c.id as string, label: c.name as string }))}
            products={(products ?? []).map((p) => ({ id: p.slug as string, label: p.name as string }))}
            suppliers={(suppliers ?? []).map((s) => ({ id: s.id as string, label: s.business_name as string }))}
            commitments={(commitRows ?? []).map((r) => ({
              id: r.id as string,
              companyName: nameOf(r.companies),
              productName: productLabel.get(r.product_slug as string) ?? (r.product_slug as string),
              qtyKg: Number(r.qty_kg),
              meta: `per ${r.period === 'weekly' ? 'minggu' : r.period === 'biweekly' ? '2 minggu' : 'bulan'}`,
              source: r.source as string,
            }))}
            shipments={(shipRows ?? []).map((r) => ({
              id: r.id as string,
              companyName: nameOf(r.companies),
              productName: productLabel.get(r.product_slug as string) ?? (r.product_slug as string),
              qtyKg: Number(r.qty_kg),
              meta: new Date(r.shipped_on as string).toLocaleDateString('id-ID'),
            }))}
          />
        </div>
      </main>
    </>
  )
}

function Tile({ label, value, hint }: { label: string; value: string | null; hint: string }) {
  return (
    <AdminCard className="p-3.5">
      <p className="font-ui text-xs font-medium text-neutral-500">{label}</p>
      {value === null ? (
        /* "belum ada sumber", BUKAN 0 — aturan kejujuran data. */
        <p className="mono-tech mt-1 text-sm text-neutral-400">belum ada sumber</p>
      ) : (
        <p className="mono-tech mt-1 text-xl font-semibold text-ink-700">{value}</p>
      )}
      <p className="mt-0.5 text-xs text-neutral-500">{hint}</p>
    </AdminCard>
  )
}
