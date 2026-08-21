// app/admin/tugas/page.tsx — CP4 ronde 3
//
// PENGINGAT TANPA LAYANAN PENJADWALAN. Tidak ada cron, tidak ada worker,
// tidak ada ketergantungan baru yang dipasang diam-diam. Mekanismenya
// berbasis TAMPILAN: tugas yang terlewat dan yang jatuh tempo hari ini
// muncul paling atas di halaman ini DAN di dashboard — dua tempat yang
// pasti dibuka admin setiap kali masuk.
//
// Batasnya jujur: kalau admin tidak membuka panel, tidak ada yang
// mengingatkan. Untuk tim 1-2 orang yang membuka panel tiap hari, itu
// cukup. Rancangan pengingat email terjadwal ditulis di ACTION REQUIRED —
// bukan dipasang tanpa diminta.

import { AdminHeader } from '@/components/layout/AdminHeader'
import { AdminPageHeader, AdminCard } from '@/components/admin/ui/AdminPrimitives'
import { TaskList } from '@/components/admin/task/TaskList'
import { getOpenTasks, bucketTasks } from '@/lib/data/tasks'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tugas' }

export default async function TugasPage() {
  const tasks = await getOpenTasks(200)
  const b = bucketTasks(tasks)

  const groups = [
    { key: 'overdue',  title: 'Terlewat',            rows: b.overdue,  tone: 'danger' as const },
    { key: 'today',    title: 'Jatuh tempo hari ini', rows: b.today,    tone: 'warning' as const },
    { key: 'upcoming', title: 'Akan datang',          rows: b.upcoming, tone: 'normal' as const },
    { key: 'undated',  title: 'Tanpa tenggat',        rows: b.undated,  tone: 'normal' as const },
  ].filter((g) => g.rows.length > 0)

  return (
    <>
      <AdminHeader title="Tugas" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="page-transition mx-auto max-w-3xl space-y-5">
          <AdminPageHeader
            title="Tugas & Follow-up"
            description="Tugas selalu melekat pada satu lead, perusahaan, supplier, atau pengiriman — dibuat dari halaman entitasnya."
          />

          {groups.length === 0 ? (
            <AdminCard>
              <TaskList
                tasks={[]}
                emptyTitle="Tidak ada tugas terbuka"
                emptyDescription="Tambahkan follow-up dari halaman lead, perusahaan, atau supplier."
              />
            </AdminCard>
          ) : (
            groups.map((g) => (
              <AdminCard key={g.key} className="p-0">
                <h2
                  className={[
                    'font-ui border-b border-ink-900/[0.06] px-4 py-3 text-xs font-bold uppercase tracking-wider',
                    g.tone === 'danger' ? 'text-danger-600'
                      : g.tone === 'warning' ? 'text-warning-700'
                      : 'text-neutral-400',
                  ].join(' ')}
                >
                  {g.title} · {g.rows.length}
                </h2>
                <div className="px-4">
                  <TaskList tasks={g.rows} />
                </div>
              </AdminCard>
            ))
          )}
        </div>
      </main>
    </>
  )
}
