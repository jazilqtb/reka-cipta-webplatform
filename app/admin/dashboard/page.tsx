// app/admin/dashboard/page.tsx
//
// CP4 (2026-08-19) — dashboard jadi "Beranda Kerja".
//
// KEPUTUSAN: Jazil memilih opsi A — dashboard tetap halaman terpisah
// (bukan digabung ke /admin/leads).
//
// KENAPA TIDAK DITAMBAH GRAFIK:
// Data nyata saat perancangan: 2 lead baru, 0 supplier, 6 artikel, 5
// produk. Grafik tren di atas angka sekecil itu bukan informasi, melainkan
// teater — ia MENYIRATKAN pola yang datanya belum sanggup dukung. Yang
// betul-betul dibutuhkan tiap pagi bukan "berapa banyak", tapi "apa yang
// perlu saya kerjakan hari ini".
//
// Maka pusat halaman ini adalah DAFTAR TINDAKAN, bukan papan angka. Kartu
// angka tetap ada tapi turun ke bawah, sebagai konteks, bukan bintang utama.
//
// Setiap baris tindakan HANYA muncul kalau memang ada yang harus dikerjakan
// — dan ketika semuanya beres, halaman berkata demikian dengan jujur alih-
// alih memaksakan daftar kosong.

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { StatTile, AdminPageHeader } from '@/components/admin/ui/AdminPrimitives'
import {
  ClipboardTextIcon, PlantIcon, BookOpenIcon, PackageIcon, WarningIcon,
  CheckCircleIcon, ArrowRightIcon, PlusIcon, GearIcon, EnvelopeSimpleIcon,
} from '@phosphor-icons/react/ssr'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { formatKg } from '@/lib/rfq-units'
import { TaskList } from '@/components/admin/task/TaskList'
import { getOpenTasks, bucketTasks } from '@/lib/data/tasks'

export const metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

interface StatCard {
  label: string
  value: number | null // null = query gagal, dibedakan dari 0
  hint: string
  href: string
  icon: PhosphorIcon
}

interface ActionItem {
  text: string
  cta: string
  href: string
  tone: 'urgent' | 'normal'
}

/** Ambang "lead terlantar" dalam hari — sejalan dengan badge stale di
 *  /admin/leads supaya kedua halaman tidak berbeda pendapat. */
const STALE_DAYS = 3

/** Pembacaan jam DISENGAJA ditaruh di luar badan komponen.
 *  React Compiler menandai panggilan tak-murni (Date.now/new Date) yang
 *  dilakukan langsung saat render — aturannya benar, karena nilai seperti
 *  itu membuat hasil render tidak deterministik. Halaman ini `force-dynamic`
 *  dan memang HARUS membaca jam tiap request, jadi jawabannya bukan
 *  membisukan aturannya, melainkan memindahkan pembacaannya keluar. */
function readClock() {
  const now = new Date()
  return {
    staleSince: new Date(now.getTime() - STALE_DAYS * 86_400_000).toISOString(),
    // Zona Asia/Jakarta, BUKAN zona server. Server Vercel berjalan di UTC —
    // tanpa timeZone eksplisit, dashboard menampilkan tanggal KEMARIN bagi
    // pengguna Indonesia setiap 00:00–07:00 WIB.
    todayWIB: new Intl.DateTimeFormat('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).format(now),
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { staleSince, todayWIB } = readClock()

  // Semua query paralel — berurutan akan membuat halaman ini terasa lambat
  // tanpa alasan.
  const [leadsRes, staleRes, suppliersRes, pendingSupRes, articlesRes, draftRes, productsRes, recentRes] =
    await Promise.all([
      supabase.from('rfqs').select('*', { count: 'exact', head: true }).eq('status', 'new'),
      supabase.from('rfqs').select('*', { count: 'exact', head: true })
        .eq('status', 'new').lt('updated_at', staleSince),
      supabase.from('supplier_registrations').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('supplier_registrations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('is_published', false),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      /* Lima RFQ terakhir. Ini SATU-SATUNYA query di halaman ini yang
         mengambil baris, bukan sekadar menghitung — dan itu disengaja:
         angka memberi tahu ADA berapa, daftar ini memberi tahu SIAPA.
         Untuk distributor yang meninjau dashboard di pagi hari, "siapa
         yang menghubungi semalam" adalah pertanyaan pertama, dan tanpa ini
         ia harus membuka halaman lain untuk menjawabnya. Dibatasi 5 supaya
         tetap ringkasan, bukan duplikat halaman Leads. */
      /* Nama perusahaan kini datang dari relasi, bukan kolom teks di baris
         RFQ — itulah inti perubahan model data CP1. */
      supabase.from('rfqs')
        .select('id, delivery_city, status, created_at, legacy_total_qty_kg, companies(name)')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

  // Gagal != 0. Kartu yang menampilkan "0" padahal query-nya error adalah
  // kebohongan diam-diam.
  /* Banner kegagalan HARUS mencakup tujuh query, bukan empat.
   *
   * Versi sebelumnya hanya memeriksa keempat query yang mengisi kartu angka.
   * Tiga yang tersisa — staleRes, pendingSupRes, draftRes — justru yang
   * mengisi daftar "Perlu tindakan Anda", dan ketiganya jatuh ke 0 saat
   * gagal. Artinya query yang gagal ter-render sebagai "tidak ada yang
   * tertunda": operator melihat dashboard bersih lalu menyimpulkan tidak
   * ada pekerjaan, padahal datanya memang tidak pernah sampai.
   *
   * Ini relevan sejak RLS diperketat ke public.is_admin() (migrasi
   * 20260815090100). Sebelum itu policy-nya USING (TRUE) dan query nyaris
   * tidak mungkin gagal; sesudahnya, sesi apa pun yang tidak lolos
   * allowlist menerima nol baris. */
  const openTasks = await getOpenTasks(50)
  const taskBuckets = bucketTasks(openTasks)
  const urgentTasks = [...taskBuckets.overdue, ...taskBuckets.today]

  const countQueries = [leadsRes, suppliersRes, articlesRes, productsRes, staleRes, pendingSupRes, draftRes]
  const failed = countQueries.filter((r) => r.error)
  const actionDataFailed = [staleRes, pendingSupRes, draftRes].some((r) => r.error)
  if (failed.length > 0) {
    console.error('[dashboard] count query gagal:', failed.map((r) => r.error?.message))
  }

  const newLeads = leadsRes.error ? null : (leadsRes.count ?? 0)
  const staleLeads = staleRes.error ? 0 : (staleRes.count ?? 0)
  const pendingSuppliers = pendingSupRes.error ? 0 : (pendingSupRes.count ?? 0)
  const drafts = draftRes.error ? 0 : (draftRes.count ?? 0)
  const activeSuppliers = suppliersRes.error ? null : (suppliersRes.count ?? 0)

  // Urutan sengaja: yang paling mendesak di atas. Lead yang mendiam >3 hari
  // didahulukan dari lead baru biasa — lead dingin lebih mahal daripada
  // lead yang belum sempat disentuh.
  const actions: ActionItem[] = []
  if (staleLeads > 0) {
    actions.push({
      text: `${staleLeads} lead belum ditindaklanjuti lebih dari ${STALE_DAYS} hari`,
      cta: 'Tindak sekarang', href: '/admin/leads', tone: 'urgent',
    })
  }
  if (newLeads !== null && newLeads - staleLeads > 0) {
    actions.push({
      text: `${newLeads - staleLeads} lead baru menunggu respons`,
      cta: 'Buka', href: '/admin/leads', tone: 'normal',
    })
  }
  if (pendingSuppliers > 0) {
    actions.push({
      text: `${pendingSuppliers} pendaftaran supplier menunggu verifikasi`,
      cta: 'Tinjau', href: '/admin/suppliers', tone: 'normal',
    })
  }
  if (drafts > 0) {
    actions.push({
      text: `${drafts} artikel masih berstatus draf`,
      cta: 'Lanjutkan', href: '/admin/articles?', tone: 'normal',
    })
  }
  if (activeSuppliers === 0) {
    actions.push({
      text: 'Belum ada supplier terdaftar',
      cta: 'Bagikan formulir', href: '/jadi-supplier', tone: 'normal',
    })
  }

  const stats: StatCard[] = [
    { label: 'Lead baru',     value: newLeads,        hint: 'Belum ditindaklanjuti', href: '/admin/leads',     icon: ClipboardTextIcon },
    { label: 'Supplier aktif', value: activeSuppliers, hint: 'Berstatus aktif',       href: '/admin/suppliers', icon: PlantIcon },
    { label: 'Artikel terbit', value: articlesRes.error ? null : (articlesRes.count ?? 0), hint: drafts > 0 ? `${drafts} draf menunggu` : 'Tayang di situs publik', href: '/admin/articles', icon: BookOpenIcon },
    { label: 'Produk aktif',   value: productsRes.error ? null : (productsRes.count ?? 0), hint: 'Tampil di katalog', href: '/admin/products', icon: PackageIcon },
  ]

  return (
    <>
      <AdminHeader title="Dashboard" />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="page-transition mx-auto max-w-[1400px] space-y-5">
          <AdminPageHeader title="Ringkasan" description={todayWIB} />

          {failed.length > 0 && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-danger-100 bg-danger-50 p-3.5 text-xs text-danger-700">
              <WarningIcon size={16} weight="duotone" aria-hidden="true" className="mt-px shrink-0 text-danger-600" />
              <span>
                {failed.length} dari {countQueries.length} query gagal dimuat. Angka yang tampil
                sebagai &ldquo;&mdash;&rdquo; belum tentu nol
                {actionDataFailed ? ', dan daftar tindakan di bawah bisa jadi tidak lengkap' : ''}.
              </span>
            </div>
          )}

          {/* ══ PERLU TINDAKAN — pusat halaman ══ */}
          <section className="rounded-xl border border-ink-900/[0.07] bg-white">
            <h2 className="font-ui border-b border-ink-900/[0.06] px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-400">
              Perlu tindakan Anda
            </h2>

            {actions.length === 0 ? (
              <div className="flex items-center gap-2.5 px-4 py-6">
                <CheckCircleIcon size={20} weight="duotone" aria-hidden="true" className="shrink-0 text-success-600" />
                <div>
                  <p className="font-ui text-sm font-medium text-ink-700">
                    {actionDataFailed ? 'Daftar tindakan tidak dapat dimuat' : 'Tidak ada yang tertunda'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Semua lead sudah ditindaklanjuti dan tidak ada draf menggantung.
                  </p>
                </div>
              </div>
            ) : (
              <ul role="list" className="divide-y divide-ink-900/[0.05]">
                {actions.map((a) => (
                  <li key={a.text}>
                    <Link
                      href={a.href}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className={[
                            'h-2 w-2 shrink-0 rounded-full',
                            a.tone === 'urgent' ? 'bg-warning-600' : 'bg-brand-teal-600',
                          ].join(' ')}
                        />
                        <span className="truncate text-sm text-ink-700">{a.text}</span>
                      </span>
                      <span className="font-ui flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-teal-600">
                        {a.cta}
                        <ArrowRightIcon size={16} weight="bold" aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ══ Angka — konteks, bukan bintang utama ══ */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <StatTile key={s.label} label={s.label} value={s.value} hint={s.hint} href={s.href} icon={s.icon} />
            ))}
          </div>

          {/* ══ TUGAS MENDESAK — CP4 ronde 3 ══
              Ditaruh DI ATAS RFQ terbaru dengan sengaja: tugas yang
              terlewat adalah janji yang sudah lewat waktunya, dan itu lebih
              mendesak daripada permintaan yang baru masuk.
              Inilah setengah dari mekanisme "pengingat tanpa cron" — separuh
              lainnya ada di /admin/tugas. Keduanya berbasis tampilan, bukan
              penjadwal, jadi tidak ada ketergantungan baru yang dipasang. */}
          {urgentTasks.length > 0 && (
            <section className="rounded-md border border-ink-900/[0.07] bg-white">
              <div className="flex items-center justify-between border-b border-ink-900/[0.06] px-4 py-3">
                <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-danger-600">
                  Tugas terlewat &amp; hari ini · {urgentTasks.length}
                </h2>
                <Link
                  href="/admin/tugas"
                  className="font-ui flex items-center gap-1 text-xs font-medium text-brand-teal-600 hover:text-brand-teal-500"
                >
                  Semua tugas
                  <ArrowRightIcon size={16} weight="bold" aria-hidden="true" />
                </Link>
              </div>
              <div className="px-4">
                <TaskList tasks={urgentTasks} />
              </div>
            </section>
          )}

          {/* ══ RFQ terbaru — mengisi paruh bawah halaman dengan hal yang
                 benar-benar dipakai, bukan widget kosong sekadar penuh ══ */}
          <section className="rounded-md border border-ink-900/[0.07] bg-white">
            <div className="flex items-center justify-between border-b border-ink-900/[0.06] px-4 py-3">
              <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-neutral-400">
                RFQ terbaru
              </h2>
              <Link
                href="/admin/leads"
                className="font-ui flex items-center gap-1 text-xs font-medium text-brand-teal-600 hover:text-brand-teal-500"
              >
                Semua lead
                <ArrowRightIcon size={16} weight="bold" aria-hidden="true" />
              </Link>
            </div>
            {recentRes.error ? (
              <p className="px-4 py-6 text-sm text-danger-700">Daftar RFQ tidak dapat dimuat.</p>
            ) : (recentRes.data ?? []).length === 0 ? (
              <p className="px-4 py-6 text-sm text-neutral-500">
                Belum ada permintaan penawaran yang masuk.
              </p>
            ) : (
              <ul role="list" className="divide-y divide-ink-900/[0.06]">
                {(recentRes.data ?? []).map((lead) => (
                  <li key={lead.id as string}>
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="font-ui block truncate text-sm font-medium text-ink-700">
                          {((lead.companies as { name?: string } | null)?.name) || '(tanpa nama perusahaan)'}
                        </span>
                        <span className="mono-tech block truncate text-xs text-neutral-500">
                          {formatKg(lead.legacy_total_qty_kg as number | null)} · {lead.delivery_city as string}
                        </span>
                      </span>
                      <span className="mono-tech shrink-0 text-xs text-neutral-400">
                        {formatDistanceToNow(new Date(lead.created_at as string), {
                          locale: idLocale,
                          addSuffix: true,
                        })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ══ Pintasan ══ */}
          <section className="rounded-xl border border-ink-900/[0.07] bg-white p-4">
            <h2 className="font-ui mb-2.5 text-xs font-bold uppercase tracking-wider text-neutral-400">
              Pintasan
            </h2>
            <div className="flex flex-wrap gap-2">
              <Shortcut href="/admin/articles/new" icon={PlusIcon} label="Artikel baru" />
              <Shortcut href="/admin/products" icon={PackageIcon} label="Katalog produk" />
              <Shortcut href="/admin/email-templates" icon={EnvelopeSimpleIcon} label="Template pesan" />
              <Shortcut href="/admin/settings" icon={GearIcon} label="Pengaturan" />
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

function Shortcut({ href, icon: Icon, label }: { href: string; icon: PhosphorIcon; label: string }) {
  return (
    <Link
      href={href}
      className="font-ui flex h-9 items-center gap-1.5 rounded-xl border border-ink-900/10 px-3 text-xs font-medium text-ink-700 transition-colors hover:bg-neutral-50 hover:text-brand-teal-600 focus-visible:shadow-focus focus-visible:outline-none"
    >
      <Icon size={16} weight="duotone" aria-hidden="true" />
      {label}
    </Link>
  )
}
