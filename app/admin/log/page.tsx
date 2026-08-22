// app/admin/log/page.tsx — CP0 ronde 4
//
// KENAPA HALAMAN INI ADA
//
// Poin 4 ronde ini bertahan satu ronde penuh karena kegagalannya tidak
// terlihat di mana pun: tidak di layar pengunjung, dan tidak di satu tempat
// pun yang bisa dibuka Jazil. Halaman ini menutup separuh kedua itu.
//
// APA YANG BISA DIJAWABNYA: "apa yang terjadi tadi?" — kapan, dari metode
// dan path apa, dijawab dengan status berapa, berapa lama, dan kalau gagal
// karena apa.
//
// APA YANG TIDAK BISA DIJAWABNYA, DINYATAKAN JUJUR: kegagalan yang terjadi
// SEBELUM permintaan meninggalkan browser tidak akan pernah muncul di sini.
// Validasi klien yang menolak, preflight CORS yang ditolak, dan jaringan
// yang putus semuanya berarti tidak ada permintaan yang sampai ke server —
// jadi tidak ada yang bisa dicatat server. Justru kelas itulah yang menjadi
// poin 4, dan penutupnya bukan halaman ini melainkan keadaan kegagalan yang
// terlihat di formulirnya sendiri (components/forms/SubmitFeedback.tsx).
// Keduanya diperlukan; tidak ada satu pun yang cukup sendirian.

import Link from 'next/link'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { AdminPageHeader, AdminCard } from '@/components/admin/ui/AdminPrimitives'
import { ApiLogTable } from '@/components/admin/log/ApiLogTable'
import { getApiLog, API_LOG_PAGE_SIZE, type ApiLogFilter } from '@/lib/data/api-log'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Catatan API' }

export default async function AdminLogPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter: raw } = await searchParams
  const filter: ApiLogFilter = raw === 'failed' ? 'failed' : 'all'
  const rows = await getApiLog(filter)

  return (
    <>
      <AdminHeader title="Catatan API" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Tabel data: lebar penuh tanpa batas wadah — §4.7 aturan 7. */}
        <div className="page-transition space-y-5">
          <AdminPageHeader
            title="Catatan API"
            description={`${API_LOG_PAGE_SIZE} kejadian terakhir. Yang dicatat: setiap permintaan yang mengubah data, dan setiap permintaan yang gagal. Pembacaan yang berhasil sengaja dilewati.`}
          />

          <div className="flex flex-wrap gap-2">
            <FilterChip href="/admin/log" label="Semua" active={filter === 'all'} />
            <FilterChip href="/admin/log?filter=failed" label="Hanya yang gagal" active={filter === 'failed'} />
          </div>

          <AdminCard className="p-4">
            <ApiLogTable rows={rows} />
          </AdminCard>

          {/* Batas & privasi dinyatakan di layar, bukan hanya di kode —
              yang membaca halaman ini perlu tahu apa yang TIDAK ada di sini
              sebelum menyimpulkan "berarti tidak terjadi apa-apa". */}
          <AdminCard className="p-4">
            <h2 className="font-ui text-sm font-semibold text-ink-700">Batas catatan ini</h2>
            <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
              <li>
                · Kegagalan yang terjadi <strong>sebelum</strong> permintaan meninggalkan browser
                (validasi form, penolakan CORS, jaringan putus) tidak muncul di sini — tidak ada
                permintaan yang sampai ke server untuk dicatat. Kegagalan itu ditampilkan di
                formulirnya sendiri.
              </li>
              <li>
                · Tidak pernah dicatat: token, header <span className="mono-tech text-xs">Authorization</span>,
                isi konfigurasi, body permintaan, serta nama, email, dan nomor telepon pengirim RFQ.
              </li>
              <li>
                · Alamat IP disimpan terpotong sampai blok <span className="mono-tech text-xs">/24</span> saja.
              </li>
              <li>
                · Catatan dipangkas otomatis: maksimal 30 hari <strong>atau</strong> 5.000 baris terbaru,
                mana pun yang lebih ketat. Tidak ada penjadwal — pemangkasan menumpang pada penulisan.
              </li>
            </ul>
          </AdminCard>
        </div>
      </main>
    </>
  )
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={
        active
          ? 'font-ui inline-flex h-8 items-center rounded-md border border-marine-600 bg-marine-50 px-3 text-xs font-medium text-marine-700'
          : 'font-ui inline-flex h-8 items-center rounded-md border border-ink-900/10 bg-white px-3 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50'
      }
    >
      {label}
    </Link>
  )
}
