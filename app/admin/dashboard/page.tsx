import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { ClipboardList, Sprout, BookOpen, Package } from 'lucide-react'

export const metadata = { title: 'Dashboard' }

const STAT_CARDS = [
  { label: 'Leads Baru',     value: '—', icon: ClipboardList, color: 'brand-teal' },
  { label: 'Supplier Aktif', value: '—', icon: Sprout,        color: 'sand'       },
  { label: 'Artikel',        value: '—', icon: BookOpen,      color: 'info'       },
  { label: 'Produk',         value: '—', icon: Package,       color: 'success'    },
] as const

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      <AdminHeader title="Dashboard" breadcrumb="Dashboard" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1440px] mx-auto space-y-6 page-transition">
          {/* Welcome */}
          <div>
            <h2 className="text-2xl font-bold text-ink-700">
              Selamat datang
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              {user?.email}
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STAT_CARDS.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="bg-white rounded-xl border border-neutral-100 p-5 hover:shadow-md transition-shadow duration-150"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-neutral-500 font-medium">
                      {stat.label}
                    </p>
                    <div className="h-9 w-9 rounded-lg bg-brand-teal-50 flex items-center justify-center">
                      <Icon size={18} className="text-brand-teal-600" aria-hidden="true" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-ink-700">
                    {stat.value}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Placeholder section */}
          <div className="bg-white rounded-xl border border-neutral-100 p-8 text-center">
            <p className="text-sm text-neutral-400 font-mono">
              [ Dashboard content akan diimplementasi mulai Epic 2 ]
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
