// components/layout/AdminHeader.tsx
//
// ⚠️ GOD NODE SURFACE ADMIN: dipakai 14 halaman /admin/*.
// KONTRAK PROPS TETAP { title, breadcrumb? } — tidak berubah di CP1, jadi
// tidak ada satu pun dari 14 file itu yang perlu disentuh.
//
// CP1 (2026-08-19) — tiga perubahan:
//
// 1. Jadi Client Component. Dibutuhkan untuk tombol hamburger yang membuka
//    drawer navigasi lewat useAdminShell(). Semua props-nya string, jadi
//    perpindahan ini aman untuk ke-14 pemanggilnya.
//
// 2. Hamburger di <lg. Sebelum CP1 sidebar tidak punya cara dibuka/ditutup
//    di layar kecil sama sekali.
//
// 3. Breadcrumb tidak lagi mengulang judul. Audit visual produksi
//    menemukan "Admin › Dashboard" persis di bawah judul "Dashboard", dan
//    "Admin › Artikel" di bawah "Manajemen Artikel" — segmen terakhirnya
//    nol informasi baru. Sekarang segmen itu hanya dirender kalau benar-
//    benar menambah sesuatu yang tidak ada di judul; kalau tidak, yang
//    tersisa cuma tautan "Admin" untuk kembali. Ini penyakit yang sama
//    dengan redundansi copy Beranda, di permukaan yang berbeda.

'use client'

import Link from 'next/link'
import { CaretRightIcon, ListIcon } from '@phosphor-icons/react/ssr'
import { useAdminShell } from './AdminShell'

interface AdminHeaderProps {
  title: string
  breadcrumb?: string
}

/** Segmen breadcrumb hanya berguna kalau judul belum mengandungnya. */
function addsInformation(breadcrumb: string, title: string): boolean {
  return !title.toLowerCase().includes(breadcrumb.toLowerCase())
}

export function AdminHeader({ title, breadcrumb }: AdminHeaderProps) {
  const { openMobileNav } = useAdminShell()
  const showTrail = breadcrumb ? addsInformation(breadcrumb, title) : false

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-ink-900/10 bg-white/95 px-4 backdrop-blur-sm md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={openMobileNav}
          aria-label="Buka menu navigasi"
          className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-700 transition-colors duration-100 hover:bg-ink-900/[0.06] focus-visible:shadow-focus focus-visible:outline-none lg:hidden"
        >
          <ListIcon size={20} weight="bold" aria-hidden="true" />
        </button>

        <div className="min-w-0">
          <h1 className="font-ui truncate text-lg font-semibold leading-tight text-ink-700">
            {title}
          </h1>
          {showTrail && (
            <nav aria-label="Breadcrumb" className="mt-0.5">
              <ol className="font-ui flex items-center gap-1.5 text-xs text-neutral-400" role="list">
                <li>
                  <Link href="/admin/dashboard" className="transition-colors hover:text-brand-teal-600">
                    Admin
                  </Link>
                </li>
                <li aria-hidden="true" className="flex items-center">
                  <CaretRightIcon size={16} weight="bold" />
                </li>
                <li className="truncate font-medium text-neutral-600">{breadcrumb}</li>
              </ol>
            </nav>
          )}
        </div>
      </div>

      {/* POIN 16 (2026-08-21) — tombol notifikasi DIHAPUS, bukan
          disembunyikan. Ia `disabled` dengan judul "belum tersedia", yang
          jujur, tapi kontrol mati di pojok kanan atas tetap menempati
          tempat paling berharga di layar tanpa memberi apa pun. Kalau
          notifikasi in-app benar-benar dibangun nanti, tombolnya dibuat
          ulang bersama fiturnya — bukan diwariskan sebagai cangkang.
          Impor BellIcon ikut dicabut supaya tidak ada kode mati tertinggal. */}
    </header>
  )
}
