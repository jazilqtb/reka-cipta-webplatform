// components/layout/AdminShell.tsx
//
// CP1 (2026-08-19) — shell admin baru. Pemilik tunggal state sidebar.
//
// KENAPA KOMPONEN BARU, BUKAN LOGIKA DI layout.tsx:
// app/admin/layout.tsx adalah Server Component (ia melakukan cek auth +
// gerbang allowlist, keduanya wajib di server). State sidebar butuh
// useState. Memisahkannya ke sini membuat layout tetap server, dan
// `children` yang sudah dirender di server dioper apa adanya sebagai prop
// — jadi TIDAK ada halaman admin yang berubah jadi Client Component.
//
// MASALAH YANG DITUTUP (audit visual produksi, 2026-08-19):
// AdminSidebar lama `fixed w-[240px]` tanpa SATU PUN kelas responsif,
// sementara kontennya cuma diberi `lg:ml-[240px]`. Di bawah 1024px
// sidebar menimpa konten secara permanen dan tidak bisa ditutup —
// admin praktis tidak bisa dipakai di ponsel maupun tablet portrait.
//
// KENAPA COOKIE, BUKAN localStorage SAJA:
// localStorage baru terbaca setelah hidrasi, jadi sidebar akan berkedip
// dari lebar ke sempit di tiap muat halaman. Cookie ikut terkirim pada
// request pertama, sehingga server merender lebar yang benar sejak awal.

'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AdminSidebar } from './AdminSidebar'

const COOKIE = 'admin_sidebar'

interface AdminShellCtx {
  /** Buka drawer navigasi di layar <lg. Dipakai tombol hamburger AdminHeader. */
  openMobileNav: () => void
}

const Ctx = createContext<AdminShellCtx>({ openMobileNav: () => {} })

export function useAdminShell() {
  return useContext(Ctx)
}

interface AdminShellProps {
  userEmail: string
  /** Dibaca dari cookie di server supaya lebar awal tidak berkedip. */
  initialCollapsed: boolean
  children: React.ReactNode
}

export function AdminShell({ userEmail, initialCollapsed, children }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)

  // CATATAN: drawer ditutup lewat onCloseMobile yang dipanggil AdminSidebar
  // saat sebuah item nav diklik — BUKAN lewat useEffect pada pathname.
  // `setState` sinkron di dalam effect melanggar react-hooks/set-state-in-effect
  // (memicu render berantai), dan repo ini sudah pernah kena kelas bug yang
  // sama. Menutup di titik interaksi juga lebih jujur: yang menutup drawer
  // adalah tindakan pengguna, bukan efek samping perubahan URL.

  // Escape menutup drawer — pola yang sama dengan menu mobile portal publik.
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  // Kunci scroll body selagi drawer terbuka.
  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      document.cookie = `${COOKIE}=${next ? 'collapsed' : 'expanded'}; path=/; max-age=31536000; SameSite=Lax`
      return next
    })
  }, [])

  const openMobileNav = useCallback(() => setMobileOpen(true), [])

  return (
    <Ctx.Provider value={{ openMobileNav }}>
      <div className="flex min-h-dvh bg-neutral-50">
        <AdminSidebar
          userEmail={userEmail}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleCollapsed={toggleCollapsed}
          onCloseMobile={() => setMobileOpen(false)}
        />

        {/* Padding kiri mengikuti lebar sidebar, HANYA dari lg ke atas.
            Di bawah lg sidebar berupa drawer melayang, jadi konten harus
            memakai lebar penuh. */}
        <div
          className={[
            'flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ease-out',
            collapsed ? 'lg:pl-16' : 'lg:pl-64',
          ].join(' ')}
        >
          {children}
        </div>
      </div>
    </Ctx.Provider>
  )
}
