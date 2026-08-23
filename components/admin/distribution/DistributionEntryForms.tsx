'use client'

// components/admin/distribution/DistributionEntryForms.tsx — CP3 ronde 3
// Tab CRUD manual: komitmen (janji) dan pengiriman (realisasi).

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { FloppyDiskIcon, TrashIcon } from '@phosphor-icons/react'
import { AdminCard } from '@/components/admin/ui/AdminPrimitives'
import { AdminState } from '@/components/admin/ui/AdminState'
import { RFQ_UNITS } from '@/lib/rfq-units'
import { formatKg } from '@/lib/rfq-units'
import { saveCommitment, saveShipment, deleteDistributionRow } from '@/app/actions/distribution'

export interface Option { id: string; label: string }
export interface ExistingRow {
  id: string
  companyName: string
  productName: string
  qtyKg: number
  meta: string
  source?: string
}

interface Props {
  companies: Option[]
  products: Option[]
  suppliers: Option[]
  commitments: ExistingRow[]
  shipments: ExistingRow[]
}

export function DistributionEntryForms({ companies, products, suppliers, commitments, shipments }: Props) {
  const [tab, setTab] = useState<'commitment' | 'shipment'>('shipment')

  return (
    <AdminCard className="p-4 md:p-5">
      <div className="mb-4 flex gap-2">
        {([
          ['shipment', 'Pengiriman (realisasi)'],
          ['commitment', 'Komitmen (janji)'],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            aria-pressed={tab === k}
            className={[
              'font-ui h-8 rounded-md px-3 text-xs font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none',
              tab === k ? 'bg-brand-teal-600 text-white' : 'border border-ink-900/12 text-neutral-600 hover:bg-neutral-50',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'shipment' ? (
        <EntryForm
          key="shipment"
          kind="shipment"
          companies={companies}
          products={products}
          suppliers={suppliers}
          rows={shipments}
          hint="Catat setiap pengiriman yang benar-benar terjadi. Inilah satu-satunya sumber angka realisasi — tanpa baris di sini, rekap hanya bisa menampilkan janji."
        />
      ) : (
        <EntryForm
          key="commitment"
          kind="commitment"
          companies={companies}
          products={products}
          suppliers={[]}
          rows={commitments}
          hint="Kesepakatan pasokan berulang: berapa yang dijanjikan ke mitra setiap periode. Dipakai sebagai pembanding realisasi."
        />
      )}
    </AdminCard>
  )
}

function EntryForm({
  kind, companies, products, suppliers, rows, hint,
}: {
  kind: 'commitment' | 'shipment'
  companies: Option[]
  products: Option[]
  suppliers: Option[]
  rows: ExistingRow[]
  hint: string
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    company_id: companies[0]?.id ?? '',
    product_slug: products[0]?.id ?? '',
    quantity: '',
    unit: 'ton',
    date: today,
    period: 'monthly',
    supplier_id: '',
    notes: '',
  })
  const [pending, startTransition] = useTransition()

  function submit() {
    const qty = Number(form.quantity)
    if (!form.company_id || !form.product_slug || !Number.isFinite(qty) || qty <= 0) {
      toast.error('Lengkapi mitra, jenis garam, dan volume.')
      return
    }
    startTransition(async () => {
      const res = kind === 'shipment'
        ? await saveShipment({
            company_id: form.company_id, product_slug: form.product_slug,
            quantity: qty, unit: form.unit, shipped_on: form.date,
            supplier_id: form.supplier_id || null, notes: form.notes || null,
          })
        : await saveCommitment({
            company_id: form.company_id, product_slug: form.product_slug,
            quantity: qty, unit: form.unit, period: form.period,
            starts_on: form.date, notes: form.notes || null,
          })
      if (res.ok) { toast.success('Tersimpan'); setForm({ ...form, quantity: '', notes: '' }) }
      else toast.error(res.error ?? 'Gagal menyimpan')
    })
  }

  return (
    <div>
      <p className="mb-3 text-xs leading-relaxed text-neutral-500">{hint}</p>

      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Mitra">
          <select value={form.company_id} disabled={pending}
            onChange={(e) => setForm({ ...form, company_id: e.target.value })}
            className={selectCls}>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Jenis garam">
          <select value={form.product_slug} disabled={pending}
            onChange={(e) => setForm({ ...form, product_slug: e.target.value })}
            className={selectCls}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </Field>
        <Field label="Volume">
          <div className="flex gap-2">
            <input type="number" min="0" step="0.01" value={form.quantity} disabled={pending}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className={`${inputCls} mono-tech min-w-0 flex-1`} />
            <select value={form.unit} disabled={pending}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              aria-label="Satuan" className={`${unitSelectCls} w-32 shrink-0`}>
              {RFQ_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
        </Field>
        <Field label={kind === 'shipment' ? 'Tanggal kirim' : 'Mulai berlaku'}>
          <input type="date" value={form.date} disabled={pending}
            onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} />
        </Field>
        {kind === 'shipment' ? (
          <Field label="Supplier (opsional)">
            <select value={form.supplier_id} disabled={pending}
              onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className={selectCls}>
              <option value="">— tidak dicatat —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
        ) : (
          <Field label="Periode">
            <select value={form.period} disabled={pending}
              onChange={(e) => setForm({ ...form, period: e.target.value })} className={selectCls}>
              <option value="weekly">Mingguan</option>
              <option value="biweekly">Dua mingguan</option>
              <option value="monthly">Bulanan</option>
            </select>
          </Field>
        )}
        <Field label="Catatan (opsional)">
          <input type="text" value={form.notes} disabled={pending}
            onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
        </Field>
      </div>

      <div className="mt-3 flex justify-end">
        <button type="button" onClick={submit} disabled={pending}
          className="font-ui inline-flex h-9 items-center gap-2 rounded-md bg-brand-teal-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-teal-500 focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-50">
          <FloppyDiskIcon size={16} weight="bold" aria-hidden="true" />
          {pending ? 'Menyimpan…' : 'Tambah'}
        </button>
      </div>

      <h3 className="font-ui mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-neutral-400">
        Tercatat · {rows.length}
      </h3>
      {rows.length === 0 ? (
        <AdminState title="Belum ada catatan" description="Baris yang Anda tambahkan muncul di sini." />
      ) : (
        <ul className="divide-y divide-ink-900/[0.06]">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="font-ui block truncate text-sm text-ink-700">
                  {r.companyName} · {r.productName}
                </span>
                <span className="mono-tech block truncate text-xs text-neutral-500">
                  {formatKg(r.qtyKg)} · {r.meta}
                  {r.source === 'rfq' && ' · dari RFQ'}
                </span>
              </span>
              <DeleteButton table={kind === 'shipment' ? 'shipments' : 'supply_commitments'} id={r.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DeleteButton({ table, id }: { table: 'shipments' | 'supply_commitments'; id: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      type="button"
      aria-label="Hapus baris"
      disabled={pending}
      onClick={() => startTransition(async () => {
        const res = await deleteDistributionRow(table, id)
        if (!res.ok) toast.error(res.error ?? 'Gagal menghapus')
      })}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-danger-50 hover:text-danger-600 focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-40"
    >
      <TrashIcon size={16} aria-hidden="true" />
    </button>
  )
}

const inputCls = 'h-9 w-full rounded-md border border-ink-900/15 px-2.5 text-sm text-ink-700 focus-visible:shadow-focus focus-visible:outline-none'
const selectCls = 'font-ui h-9 w-full rounded-md border border-ink-900/15 bg-white px-2 text-sm text-ink-700 focus-visible:shadow-focus focus-visible:outline-none'
const unitSelectCls = 'font-ui h-9 rounded-md border border-ink-900/15 bg-white px-2 text-sm text-ink-700 focus-visible:shadow-focus focus-visible:outline-none'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-ui mb-1 block text-xs font-medium text-neutral-600">{label}</span>
      {children}
    </label>
  )
}
