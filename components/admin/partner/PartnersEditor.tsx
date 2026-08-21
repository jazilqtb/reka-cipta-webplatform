'use client'

// components/admin/partner/PartnersEditor.tsx — CP5 ronde 3
//
// CATATAN MARQUEE: trek marquee digandakan TEPAT 2x lalu bergeser -50%
// (DESIGN-SYSTEM §7.1). Karena penggandaannya dilakukan komponen tampilan
// dari daftar apa pun yang diterimanya, menambah atau menghapus mitra
// TIDAK bisa merusak sambungan trek — panjangnya selalu genap dengan
// sendirinya. Diuji dengan 2 dan 15 mitra; keduanya menyambung mulus.

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  ArrowDownIcon, ArrowUpIcon, FloppyDiskIcon, ImageIcon,
  PlusIcon, SpinnerGapIcon, TrashIcon,
} from '@phosphor-icons/react'
import { AdminCard } from '@/components/admin/ui/AdminPrimitives'
import { AdminState } from '@/components/admin/ui/AdminState'
import { createClient } from '@/lib/supabase/client'
import { compressImage, formatBytes } from '@/lib/image-compress'
import { partnerLogoUrl } from '@/lib/data/partners'
import { savePartners, deletePartner } from '@/app/actions/partners'

export interface PartnerDraft {
  id?: string
  name: string
  industry: string
  logo_path: string | null
}

const MAX_BYTES = 1024 * 1024

export function PartnersEditor({ initial }: { initial: PartnerDraft[] }) {
  const [rows, setRows] = useState<PartnerDraft[]>(initial)
  const [pending, startTransition] = useTransition()

  function patch(i: number, next: Partial<PartnerDraft>) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...next } : r)))
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= rows.length) return
    const next = [...rows]
    ;[next[i], next[j]] = [next[j], next[i]]
    setRows(next)
  }
  function remove(i: number) {
    const row = rows[i]
    setRows(rows.filter((_, idx) => idx !== i))
    if (!row.id) return
    startTransition(async () => {
      const res = await deletePartner(row.id!)
      if (!res.ok) toast.error(res.error ?? 'Gagal menghapus')
    })
  }
  function save() {
    startTransition(async () => {
      const res = await savePartners(rows)
      if (res.ok) toast.success('Daftar mitra disimpan')
      else toast.error(res.error ?? 'Gagal menyimpan')
    })
  }

  return (
    <AdminCard className="p-4 md:p-5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="font-ui text-sm font-semibold text-ink-700">Daftar mitra</h2>
        <span className="font-ui text-xs text-neutral-500">{rows.length} mitra</span>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-neutral-500">
        Mitra tanpa logo tetap tampil sebagai nama perusahaan — jadi Anda bisa menambahkan
        nama lebih dulu dan menyusulkan logonya.
      </p>

      {rows.length === 0 ? (
        <AdminState title="Belum ada mitra" description="Tambahkan mitra pertama lewat tombol di bawah." />
      ) : (
        <ul className="space-y-3">
          {rows.map((r, i) => (
            <li key={r.id ?? `new-${i}`} className="rounded-md border border-ink-900/[0.09] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-ui text-xs font-medium text-neutral-400">#{i + 1}</span>
                <div className="flex items-center gap-1">
                  <IconBtn label={`Naikkan ${r.name || i + 1}`} disabled={pending || i === 0} onClick={() => move(i, -1)}>
                    <ArrowUpIcon size={16} aria-hidden="true" />
                  </IconBtn>
                  <IconBtn label={`Turunkan ${r.name || i + 1}`} disabled={pending || i === rows.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDownIcon size={16} aria-hidden="true" />
                  </IconBtn>
                  <IconBtn label={`Hapus ${r.name || i + 1}`} danger disabled={pending} onClick={() => remove(i)}>
                    <TrashIcon size={16} aria-hidden="true" />
                  </IconBtn>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="font-ui mb-1 block text-xs font-medium text-neutral-600">Nama</span>
                  <input value={r.name} disabled={pending}
                    onChange={(e) => patch(i, { name: e.target.value })} className={inputCls} />
                </label>
                <label className="block">
                  <span className="font-ui mb-1 block text-xs font-medium text-neutral-600">Industri</span>
                  <input value={r.industry} disabled={pending}
                    onChange={(e) => patch(i, { industry: e.target.value })} className={inputCls} />
                </label>
              </div>

              <LogoUpload value={r.logo_path} disabled={pending}
                onChange={(path) => patch(i, { logo_path: path })} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <button type="button" disabled={pending}
          onClick={() => setRows([...rows, { name: '', industry: '', logo_path: null }])}
          className="font-ui inline-flex h-8 items-center gap-1.5 rounded-md border border-ink-900/12 px-2.5 text-xs font-medium text-ink-700 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-40">
          <PlusIcon size={16} aria-hidden="true" />
          Tambah mitra
        </button>
        <button type="button" onClick={save} disabled={pending}
          className="font-ui inline-flex h-9 items-center gap-2 rounded-md bg-brand-teal-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-teal-500 focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-50">
          <FloppyDiskIcon size={16} weight="bold" aria-hidden="true" />
          {pending ? 'Menyimpan…' : 'Simpan daftar mitra'}
        </button>
      </div>
    </AdminCard>
  )
}

function LogoUpload({
  value, onChange, disabled,
}: { value: string | null; onChange: (p: string | null) => void; disabled?: boolean }) {
  const [busy, setBusy] = useState(false)
  const preview = partnerLogoUrl(value)

  async function upload(file: File) {
    setBusy(true)
    try {
      // Logo mitra tampil setinggi 36px — 400px sudah lebih dari cukup.
      // SVG dilewati compressImage (lihat catatan PASSTHROUGH di sana).
      const { file: out } = await compressImage(file, { maxDimension: 400, quality: 0.9 })
      if (out.size > MAX_BYTES) {
        toast.error(`Ukuran masih ${formatBytes(out.size)} setelah dikompres — batasnya ${formatBytes(MAX_BYTES)}.`)
        return
      }
      const supabase = createClient()
      const ext = out.name.split('.').pop()?.toLowerCase() ?? 'png'
      const path = `${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('partner-logos')
        .upload(path, out, { cacheControl: '3600', upsert: false, contentType: out.type })
      if (error) throw error
      onChange(path)
      toast.success('Logo terunggah')
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err)
      console.error('[partner-logo] gagal unggah:', err)
      toast.error(
        /row-level security|policy/i.test(raw)
          ? 'Izin unggah ke penyimpanan belum aktif.'
          : `Gagal mengunggah: ${raw}`
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-2 flex items-center gap-3">
      <div className="flex h-10 w-20 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-neutral-100">
        {preview ? (
          <Image src={preview} alt="" width={80} height={40} className="h-full w-full object-contain" />
        ) : (
          <ImageIcon size={16} className="text-neutral-400" aria-hidden="true" />
        )}
      </div>
      <label className="font-ui inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-ink-900/12 px-2.5 text-xs font-medium text-ink-700 transition-colors hover:bg-neutral-50">
        {busy ? <SpinnerGapIcon size={16} className="animate-spin" aria-hidden="true" /> : <ImageIcon size={16} aria-hidden="true" />}
        {preview ? 'Ganti logo' : 'Unggah logo'}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" hidden
          disabled={disabled || busy}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
      </label>
      {preview && (
        <button type="button" disabled={disabled || busy} onClick={() => onChange(null)}
          className="font-ui text-xs font-medium text-neutral-500 transition-colors hover:text-danger-600">
          Hapus logo
        </button>
      )}
    </div>
  )
}

function IconBtn({ label, onClick, disabled, danger, children }: {
  label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode
}) {
  return (
    <button type="button" aria-label={label} onClick={onClick} disabled={disabled}
      className={['flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 transition-colors focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-30',
        danger ? 'hover:bg-danger-50 hover:text-danger-600' : 'hover:bg-neutral-100 hover:text-ink-700'].join(' ')}>
      {children}
    </button>
  )
}

const inputCls = 'h-9 w-full rounded-md border border-ink-900/15 px-2.5 text-sm text-ink-700 focus-visible:shadow-focus focus-visible:outline-none'
