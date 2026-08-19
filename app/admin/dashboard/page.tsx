// app/admin/dashboard/page.tsx
//
// CHECKPOINT 4 (2026-08-15) — metrik dashboard DIBANGUN.
//
// KOREKSI DIAGNOSIS: metrik ini tidak "gagal render". Sebelum ini
// TIDAK ADA jalur datanya sama sekali — STAT_CARDS adalah konstanta
// level-modul dengan `value: '—'` sebagai string literal, dan satu-
// satunya panggilan Supabase adalah auth.getUser() untuk email.
// Diverifikasi lewat graph: `graphify path "dashboard/page.tsx"
// "RFQLead"` -> "No path found". Jadi ini pekerjaan MEMBANGUN fitur,
// bukan memperbaiki query yang rusak — dan RLS tidak pernah terlibat.
//
// PENDEKATAN: count agregat sisi server dengan
// `.select('*', { count: 'exact', head: true })`. `head: true` berarti
// TIDAK ada baris yang ditransfer — hanya header Content-Range berisi
// jumlah. Jauh lebih murah daripada menarik baris lalu menghitungnya di
// JS, dan tidak butuh view/RPC/skema baru sama sekali.
//
// KEAMANAN: query berjalan lewat createClient() (sesi user), jadi TETAP
// tunduk pada RLS. Setelah Checkpoint 1, tabel ini hanya bisa dibaca
// anggota public.admin_users — angka di sini tidak akan pernah bocor ke
// akun non-admin sekalipun halaman ini berhasil dirender.

import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { StatTile, AdminPageHeader } from '@/components/admin/ui/AdminPrimitives'
import {
  ClipboardTextIcon, PlantIcon, BookOpenIcon, PackageIcon, WarningIcon,
} from '@phosphor-icons/react/ssr'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'

export const metadata = { title: 'Dashboard' }

// Angka harus selalu segar — dashboard yang menampilkan jumlah lead basi
// lebih buruk daripada tidak menampilkan apa pun.
export const dynamic = 'force-dynamic'

interface StatCard {
  label: string
  value: number | null // null = query gagal, dibedakan dari 0
  hint: string
  href: string
  icon: PhosphorIcon
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Semua count paralel — 4 round-trip berurutan akan membuat dashboard
  // terasa lambat tanpa alasan.
  const [leadsRes, suppliersRes, articlesRes, productsRes] = await Promise.all([
    supabase.from('rfq_leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('supplier_registrations').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])

  // Gagal != 0. Kartu yang menampilkan "0" padahal query-nya error adalah
  // kebohongan diam-diam — persis kelas masalah yang membuat dashboard
  // ini rusak sejak awal. null -> ditampilkan sebagai "—" + peringatan.
  const failed = [leadsRes, suppliersRes, articlesRes, productsRes].filter((r) => r.error)
  if (failed.length > 0) {
    console.error('[dashboard] count query gagal:', failed.map((r) => r.error?.message))
  }

  const stats: StatCard[] = [
    {
      label: 'Leads Baru',
      value: leadsRes.error ? null : (leadsRes.count ?? 0),
      hint: 'Belum ditindaklanjuti',
      href: '/admin/leads',
      icon: ClipboardTextIcon,
    },
    {
      label: 'Supplier Aktif',
      value: suppliersRes.error ? null : (suppliersRes.count ?? 0),
      hint: 'Berstatus aktif',
      href: '/admin/suppliers',
      icon: PlantIcon,
    },
    {
      label: 'Artikel Terbit',
      value: articlesRes.error ? null : (articlesRes.count ?? 0),
      hint: 'Tayang di situs publik',
      href: '/admin/articles',
      icon: BookOpenIcon,
    },
    {
      label: 'Produk Aktif',
      value: productsRes.error ? null : (productsRes.count ?? 0),
      hint: 'Tampil di katalog',
      href: '/admin/products',
      icon: PackageIcon,
    },
  ]

  // Tanggal dihitung di zona Asia/Jakarta, BUKAN zona server. Server
  // Vercel berjalan di UTC — tanpa timeZone eksplisit, dashboard akan
  // menampilkan tanggal kemarin bagi pengguna Indonesia setiap malam
  // antara pukul 00:00 dan 07:00 WIB.
  const todayWIB = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date())

  return (
    <>
      <AdminHeader title="Dashboard" breadcrumb="Dashboard" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="page-transition mx-auto max-w-[1440px] space-y-6">
          <AdminPageHeader
            title="Ringkasan"
            description={todayWIB}
          />

          {failed.length > 0 && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700"
            >
              <WarningIcon size={16} weight="duotone" aria-hidden="true" className="mt-0.5 shrink-0 text-danger-600" />
              <span>
                {failed.length} dari {stats.length} metrik gagal dimuat. Angka yang
                ditampilkan sebagai &ldquo;&mdash;&rdquo; belum tentu nol.
              </span>
            </div>
          )}

          {/* Kartu statistik — StatTile (primitif B1). Sekaligus jalan
              pintas ke halaman terkait: angka tanpa tindak lanjut hanya
              jadi hiasan. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatTile
                key={stat.label}
                label={stat.label}
                value={stat.value}
                hint={stat.hint}
                href={stat.href}
                icon={stat.icon}
              />
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
