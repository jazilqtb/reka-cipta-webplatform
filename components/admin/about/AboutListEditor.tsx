'use client'

// components/admin/about/AboutListEditor.tsx — CP4 (2026-08-21)
//
// SATU editor untuk tiga daftar (timeline, misi, tim). Ketiganya adalah
// hal yang sama secara struktur: daftar terurut berisi judul + uraian,
// bisa ditambah, dihapus, dan diurutkan. Menulis tiga editor yang hampir
// identik hanya memindahkan biaya perawatan ke ronde berikutnya — dan
// menjamin ketiganya berbeda perilaku dalam enam bulan.
//
// PENGURUTAN memakai tombol naik/turun, bukan drag-and-drop. Alasannya
// bukan kemudahan implementasi: drag-and-drop tidak bisa dioperasikan
// dengan keyboard tanpa lapisan tambahan yang panjang, dan di ponsel ia
// bertabrakan dengan gerakan menggulir halaman — dua tempat di mana admin
// justru paling mungkin merapikan urutan sambil berjalan.

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  ArrowDownIcon, ArrowUpIcon, FloppyDiskIcon, PlusIcon, TrashIcon,
} from '@phosphor-icons/react'
import { AdminCard } from '@/components/admin/ui/AdminPrimitives'
import { AdminState } from '@/components/admin/ui/AdminState'
import { saveAboutRows, deleteAboutRow, type AboutTable } from '@/app/actions/about'

export interface EditableRow {
  id?: string
  year?: number
  title?: string
  name?: string
  position?: string
  description?: string
  photo_path?: string | null
  [k: string]: unknown
}

interface FieldSpec {
  key: keyof EditableRow & string
  label: string
  type?: 'text' | 'number' | 'textarea'
  placeholder?: string
  maxLength?: number
}

interface Props {
  table: AboutTable
  heading: string
  description: string
  fields: FieldSpec[]
  initialRows: EditableRow[]
  emptyLabel: string
  /** Slot tambahan per baris — dipakai tim untuk unggah foto.
   *  `patch` diberikan supaya slot BISA menulis balik ke state daftar tanpa
   *  memutasi objek baris. Versi pertama memutasi `row` langsung dan React
   *  Compiler menolaknya — dengan benar: baris itu prop, dan memutasinya
   *  membuat perubahan tidak pernah memicu render ulang begitu memoization
   *  aktif. */
  renderExtra?: (
    row: EditableRow,
    index: number,
    patch: (key: string, value: unknown) => void
  ) => React.ReactNode
}

export function AboutListEditor({
  table, heading, description, fields, initialRows, emptyLabel, renderExtra,
}: Props) {
  const [rows, setRows] = useState<EditableRow[]>(initialRows)
  const [pending, startTransition] = useTransition()

  function patch(i: number, key: string, value: unknown) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)))
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= rows.length) return
    const next = [...rows]
    ;[next[i], next[j]] = [next[j], next[i]]
    setRows(next)
  }
  function addRow() {
    setRows([...rows, Object.fromEntries(fields.map((f) => [f.key, f.type === 'number' ? new Date().getFullYear() : ''])) as EditableRow])
  }
  function removeRow(i: number) {
    const row = rows[i]
    setRows(rows.filter((_, idx) => idx !== i))
    // Baris yang belum pernah tersimpan tidak punya id — tidak ada yang
    // perlu dihapus di server.
    if (!row.id) return
    startTransition(async () => {
      const res = await deleteAboutRow(table, row.id!)
      if (!res.ok) toast.error(res.error ?? 'Gagal menghapus')
    })
  }
  function save() {
    startTransition(async () => {
      const res = await saveAboutRows(table, rows)
      if (res.ok) toast.success(`${heading} disimpan`)
      else toast.error(res.error ?? 'Gagal menyimpan')
    })
  }

  return (
    <AdminCard className="p-4 md:p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-ui text-sm font-semibold text-ink-700">{heading}</h2>
        <span className="font-ui text-xs text-neutral-500">{rows.length} entri</span>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-neutral-500">{description}</p>

      {rows.length === 0 ? (
        <AdminState title={emptyLabel} description="Tambahkan entri pertama lewat tombol di bawah." />
      ) : (
        <ul className="space-y-3">
          {rows.map((row, i) => (
            <li key={row.id ?? `new-${i}`} className="rounded-md border border-ink-900/[0.09] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-ui text-xs font-medium text-neutral-400">#{i + 1}</span>
                <div className="flex items-center gap-1">
                  <IconBtn label={`Naikkan entri ${i + 1}`} disabled={pending || i === 0} onClick={() => move(i, -1)}>
                    <ArrowUpIcon size={16} aria-hidden="true" />
                  </IconBtn>
                  <IconBtn label={`Turunkan entri ${i + 1}`} disabled={pending || i === rows.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDownIcon size={16} aria-hidden="true" />
                  </IconBtn>
                  <IconBtn label={`Hapus entri ${i + 1}`} danger disabled={pending} onClick={() => removeRow(i)}>
                    <TrashIcon size={16} aria-hidden="true" />
                  </IconBtn>
                </div>
              </div>

              <div className="space-y-2">
                {fields.map((f) => (
                  <label key={f.key} className="block">
                    <span className="font-ui mb-1 block text-xs font-medium text-neutral-600">{f.label}</span>
                    {f.type === 'textarea' ? (
                      <textarea
                        rows={3}
                        value={String(row[f.key] ?? '')}
                        maxLength={f.maxLength}
                        disabled={pending}
                        placeholder={f.placeholder}
                        onChange={(e) => patch(i, f.key, e.target.value)}
                        className="w-full rounded-md border border-ink-900/15 px-2.5 py-2 text-sm leading-relaxed text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
                      />
                    ) : (
                      <input
                        type={f.type === 'number' ? 'number' : 'text'}
                        value={String(row[f.key] ?? '')}
                        maxLength={f.maxLength}
                        disabled={pending}
                        placeholder={f.placeholder}
                        onChange={(e) => patch(i, f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                        className="h-9 w-full rounded-md border border-ink-900/15 px-2.5 text-sm text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
                      />
                    )}
                  </label>
                ))}
                {renderExtra?.(row, i, (key, value) => patch(i, key, value))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={addRow}
          disabled={pending}
          className="font-ui inline-flex h-8 items-center gap-1.5 rounded-md border border-ink-900/12 px-2.5 text-xs font-medium text-ink-700 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-40"
        >
          <PlusIcon size={16} aria-hidden="true" />
          Tambah entri
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="font-ui inline-flex h-9 items-center gap-2 rounded-md bg-brand-teal-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-teal-500 focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-50"
        >
          <FloppyDiskIcon size={16} weight="bold" aria-hidden="true" />
          {pending ? 'Menyimpan…' : `Simpan ${heading.toLowerCase()}`}
        </button>
      </div>
    </AdminCard>
  )
}

function IconBtn({
  label, onClick, disabled, danger, children,
}: {
  label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 transition-colors focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-30',
        danger ? 'hover:bg-danger-50 hover:text-danger-600' : 'hover:bg-neutral-100 hover:text-ink-700',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
