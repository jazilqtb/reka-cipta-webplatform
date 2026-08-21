'use client'

// components/admin/about/AboutWorkspace.tsx — CP4 (2026-08-21)
// Menyatukan empat editor Tentang Kami dalam satu halaman.

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { FloppyDiskIcon } from '@phosphor-icons/react'
import { AdminCard } from '@/components/admin/ui/AdminPrimitives'
import { AboutListEditor, type EditableRow } from './AboutListEditor'
import { TeamPhotoUpload } from './TeamPhotoUpload'
import { saveAboutVision } from '@/app/actions/about'

interface Props {
  vision: string
  timeline: EditableRow[]
  mission: EditableRow[]
  team: EditableRow[]
}

export function AboutWorkspace({ vision, timeline, mission, team }: Props) {
  return (
    <div className="space-y-5">
      <VisionEditor initial={vision} />

      <AboutListEditor
        table="timeline"
        heading="Perjalanan Kami"
        description="Tampil sebagai garis waktu. Di ponsel bertumpuk vertikal; di desktop bisa digeser mendatar, jadi jumlah entri boleh bertambah tanpa merusak tata letak."
        emptyLabel="Belum ada entri perjalanan"
        initialRows={timeline}
        fields={[
          { key: 'year', label: 'Tahun', type: 'number' },
          { key: 'title', label: 'Judul', maxLength: 120, placeholder: 'Peristiwa penting tahun itu' },
          { key: 'description', label: 'Keterangan', type: 'textarea', placeholder: 'Satu sampai dua kalimat.' },
        ]}
      />

      <AboutListEditor
        table="mission"
        heading="Misi"
        description="Tampil sebagai accordion — judul selalu terlihat, uraian dibuka saat diklik. Tulis judul yang bisa berdiri sendiri, karena itulah yang dibaca lebih dulu."
        emptyLabel="Belum ada poin misi"
        initialRows={mission}
        fields={[
          { key: 'title', label: 'Judul poin', maxLength: 160, placeholder: 'Inti misi dalam satu frasa' },
          { key: 'description', label: 'Uraian', type: 'textarea' },
        ]}
      />

      <AboutListEditor
        table="team"
        heading="Tim Kami"
        description="Ditampilkan sebagai kisi foto. Anggota tanpa foto tetap tampil dengan inisial namanya, jadi entri baru tidak pernah kosong."
        emptyLabel="Belum ada anggota tim"
        initialRows={team}
        fields={[
          { key: 'name', label: 'Nama', maxLength: 120 },
          { key: 'position', label: 'Jabatan', maxLength: 120 },
        ]}
        renderExtra={(row, i, patch) => (
          <TeamPhotoUpload
            key={`photo-${i}`}
            value={row.photo_path as string | null}
            onChange={(p) => patch('photo_path', p)}
          />
        )}
      />
    </div>
  )
}

function VisionEditor({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial)
  const [pending, startTransition] = useTransition()
  return (
    <AdminCard className="p-4 md:p-5">
      <h2 className="font-ui mb-1 text-sm font-semibold text-ink-700">Visi</h2>
      <p className="mb-3 text-xs text-neutral-500">
        Satu paragraf. Tampil sebagai kutipan besar di halaman Tentang Kami.
      </p>
      <textarea
        rows={4}
        value={value}
        maxLength={400}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-md border border-ink-900/15 px-2.5 py-2 text-sm leading-relaxed text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="font-ui text-xs text-neutral-500">{value.length}/400</span>
        <button
          type="button"
          disabled={pending || !value.trim()}
          onClick={() =>
            startTransition(async () => {
              const res = await saveAboutVision(value)
              if (res.ok) toast.success('Visi disimpan')
              else toast.error(res.error ?? 'Gagal menyimpan')
            })
          }
          className="font-ui inline-flex h-9 items-center gap-2 rounded-md bg-brand-teal-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-teal-500 focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-50"
        >
          <FloppyDiskIcon size={16} weight="bold" aria-hidden="true" />
          {pending ? 'Menyimpan…' : 'Simpan visi'}
        </button>
      </div>
    </AdminCard>
  )
}
