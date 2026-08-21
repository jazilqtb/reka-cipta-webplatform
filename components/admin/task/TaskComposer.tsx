'use client'

// components/admin/task/TaskComposer.tsx — CP4 ronde 3
// Menambahkan tugas yang MELEKAT pada satu entitas.

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { PlusIcon } from '@phosphor-icons/react'
import { createTask } from '@/app/actions/tasks'
import type { TaskParentKind } from '@/lib/data/tasks'

/** Tenggat cepat. Tanggal ditawarkan sebagai PILIHAN, bukan diisi sendiri:
 *  "3 hari lagi" jauh lebih cepat diputuskan daripada memilih tanggal di
 *  kalender, dan follow-up hampir selalu dipikirkan dalam satuan "berapa
 *  hari lagi", bukan "tanggal berapa". */
const QUICK = [
  { label: 'Besok', days: 1 },
  { label: '3 hari', days: 3 },
  { label: '1 minggu', days: 7 },
]

function isoIn(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function TaskComposer({
  parentKind, parentId, placeholder = 'Tugas baru… (mis. "Telepon soal sampel")',
}: {
  parentKind: TaskParentKind
  parentId: string
  placeholder?: string
}) {
  const [title, setTitle] = useState('')
  const [dueOn, setDueOn] = useState<string>('')
  const [pending, startTransition] = useTransition()

  function submit() {
    if (!title.trim()) return
    startTransition(async () => {
      const res = await createTask({ title, dueOn: dueOn || null, parentKind, parentId })
      if (res.ok) { setTitle(''); setDueOn(''); toast.success('Tugas ditambahkan') }
      else toast.error(res.error ?? 'Gagal membuat tugas')
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={title}
          disabled={pending}
          placeholder={placeholder}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
          className="h-9 min-w-0 flex-1 rounded-md border border-ink-900/15 px-2.5 text-sm text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending || !title.trim()}
          className="font-ui inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-brand-teal-600 px-3 text-sm font-medium text-white transition-colors hover:bg-brand-teal-500 focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-50"
        >
          <PlusIcon size={16} weight="bold" aria-hidden="true" />
          Tambah
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-ui text-xs text-neutral-500">Tenggat:</span>
        {QUICK.map((q) => {
          const iso = isoIn(q.days)
          const active = dueOn === iso
          return (
            <button
              key={q.label}
              type="button"
              disabled={pending}
              onClick={() => setDueOn(active ? '' : iso)}
              aria-pressed={active}
              className={[
                'font-ui h-7 rounded-md px-2 text-xs font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none',
                active ? 'bg-brand-teal-600 text-white' : 'border border-ink-900/12 text-neutral-600 hover:bg-neutral-50',
              ].join(' ')}
            >
              {q.label}
            </button>
          )
        })}
        <input
          type="date"
          value={dueOn}
          disabled={pending}
          onChange={(e) => setDueOn(e.target.value)}
          aria-label="Tanggal jatuh tempo"
          className="h-7 rounded-md border border-ink-900/12 px-1.5 text-xs text-neutral-600 focus-visible:shadow-focus focus-visible:outline-none"
        />
      </div>
    </div>
  )
}
