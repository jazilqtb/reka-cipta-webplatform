'use client'

// components/admin/task/TaskList.tsx — CP4 ronde 3
//
// Satu daftar tugas, dipakai di dashboard, halaman /admin/tugas, dan
// panel entitas. Bentuknya sama di ketiga tempat supaya operator tidak
// perlu belajar dua kali.

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { CheckIcon, TrashIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { AdminState } from '@/components/admin/ui/AdminState'
import { setTaskStatus, deleteTask } from '@/app/actions/tasks'
import type { TaskRow } from '@/lib/data/tasks'

const PARENT_LABEL: Record<string, string> = {
  company: 'Perusahaan', contact: 'Kontak', rfq: 'RFQ',
  supplier: 'Supplier', shipment: 'Pengiriman',
}

export function TaskList({
  tasks, emptyTitle = 'Tidak ada tugas terbuka', emptyDescription,
  showParent = true,
}: {
  tasks: TaskRow[]
  emptyTitle?: string
  emptyDescription?: string
  showParent?: boolean
}) {
  const [rows, setRows] = useState(tasks)
  const [pending, startTransition] = useTransition()

  function complete(id: string) {
    // Dihapus dari daftar SEBELUM server menjawab. Kalau gagal, baris
    // dikembalikan — menunggu round-trip untuk mencentang satu tugas
    // membuat daftar terasa lamban justru saat dipakai berturut-turut.
    const prev = rows
    setRows((r) => r.filter((t) => t.id !== id))
    startTransition(async () => {
      const res = await setTaskStatus(id, 'done')
      if (!res.ok) { setRows(prev); toast.error(res.error ?? 'Gagal menyelesaikan tugas') }
      else toast.success('Tugas selesai')
    })
  }
  function remove(id: string) {
    const prev = rows
    setRows((r) => r.filter((t) => t.id !== id))
    startTransition(async () => {
      const res = await deleteTask(id)
      if (!res.ok) { setRows(prev); toast.error(res.error ?? 'Gagal menghapus') }
    })
  }

  if (rows.length === 0) {
    return <AdminState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <ul role="list" className="divide-y divide-ink-900/[0.06]">
      {rows.map((t) => {
        const overdue = t.daysUntilDue !== null && t.daysUntilDue < 0
        const today = t.daysUntilDue === 0
        return (
          <li key={t.id} className="flex items-start gap-3 py-2.5">
            <button
              type="button"
              aria-label={`Tandai selesai: ${t.title}`}
              disabled={pending}
              onClick={() => complete(t.id)}
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-ink-900/20 text-transparent transition-colors hover:border-success-600 hover:bg-success-50 hover:text-success-700 focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-40"
            >
              <CheckIcon size={16} weight="bold" aria-hidden="true" />
            </button>

            <span className="min-w-0 flex-1">
              <span className="font-ui block text-sm text-ink-700">{t.title}</span>
              <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                {showParent && t.parentKind && (
                  <span className="mono-tech text-xs text-neutral-500">
                    {PARENT_LABEL[t.parentKind]} · {t.parentLabel}
                  </span>
                )}
                {t.dueOn && (
                  <span
                    className={[
                      'mono-tech flex items-center gap-1 text-xs',
                      overdue ? 'font-medium text-danger-600' : today ? 'font-medium text-warning-700' : 'text-neutral-500',
                    ].join(' ')}
                  >
                    {overdue && <WarningCircleIcon size={16} weight="fill" aria-hidden="true" />}
                    {overdue
                      ? `terlewat ${Math.abs(t.daysUntilDue!)} hari`
                      : today
                        ? 'jatuh tempo hari ini'
                        : `${t.daysUntilDue} hari lagi`}
                  </span>
                )}
              </span>
              {t.notes && <span className="mt-0.5 block text-xs text-neutral-500">{t.notes}</span>}
            </span>

            <button
              type="button"
              aria-label={`Hapus tugas: ${t.title}`}
              disabled={pending}
              onClick={() => remove(t.id)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-danger-50 hover:text-danger-600 focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-40"
            >
              <TrashIcon size={16} aria-hidden="true" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
