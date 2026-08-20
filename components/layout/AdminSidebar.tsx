// components/layout/AdminSidebar.tsx
//
// CP1 (2026-08-19) — sidebar jadi TERKENDALI (controlled) oleh AdminShell.
// State-nya tidak lagi di sini; komponen ini murni presentasi + logout.
//
// Tiga mode:
//   <lg            drawer off-canvas + overlay, dibuka hamburger AdminHeader
//   >=lg mengembang 256px, label terlihat
//   >=lg mengecil   64px, hanya ikon + tooltip native
//
// Sebelumnya `fixed w-[240px]` tanpa kelas responsif apa pun — di bawah
// 1024px ia menimpa konten permanen tanpa cara menutup. Lihat catatan di
// AdminShell.tsx.
//
// TOOLTIP: memakai atribut `title` bawaan browser, bukan komponen tooltip.
// Saat mengecil, label adalah satu-satunya cara mengenali menu, jadi
// tooltip TIDAK BOLEH bergantung pada JS yang mungkin belum terhidrasi.

'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  SignOutIcon, CircleNotchIcon, CaretDoubleLeftIcon, CaretDoubleRightIcon, XIcon,
} from '@phosphor-icons/react/ssr'
import { Logo } from '@/components/brand/Logo'
import { createClient } from '@/lib/supabase/client'
import { ADMIN_NAV_MAIN, ADMIN_NAV_SETTINGS, type AdminNavItem } from '@/constants/adminNavigation'

interface AdminSidebarProps {
  userEmail: string
  collapsed: boolean
  mobileOpen: boolean
  onToggleCollapsed: () => void
  onCloseMobile: () => void
}

function isActive(href: string, pathname: string, exact: boolean): boolean {
  if (exact) return pathname === href
  return pathname.startsWith(href)
}

function getInitials(email: string): string {
  const [local] = email.split('@')
  return local.slice(0, 2).toUpperCase()
}

export function AdminSidebar({
  userEmail, collapsed, mobileOpen, onToggleCollapsed, onCloseMobile,
}: AdminSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <>
      {/* Overlay drawer — hanya <lg */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Tutup menu navigasi"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        aria-label="Navigasi admin"
        className={[
          'fixed bottom-0 left-0 top-0 z-50 flex flex-col border-r border-white/5 bg-ink-900',
          'transition-[width,transform] duration-200 ease-out',
          collapsed ? 'lg:w-16' : 'lg:w-64',
          // <lg: lebar tetap 264px, digeser keluar layar saat tertutup.
          'w-[264px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Identitas perusahaan.
            Sebelumnya: kotak "RC" buatan sendiri + teks "Reka Cipta" —
            memangkas nama resmi dan mengabaikan logo yang sudah dipakai
            portal publik, sehingga admin terasa seperti aplikasi lain.
            Sekarang memakai <Logo> yang SAMA dengan Navbar/Footer publik,
            varian `dark` karena sidebar berlatar ink-900 (persis seperti
            Footer).

            Saat mengecil (64px) logo bertulis tidak mungkin terbaca, jadi
            diganti monogram "RCI" — monogram yang sama dengan fallback
            bawaan komponen Logo, supaya identitasnya tetap satu. */}
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/[0.07] px-3">
          <Link
            href="/admin/dashboard"
            aria-label="Dashboard CV Reka Cipta Indonesia"
            className="flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:shadow-focus-dark focus-visible:outline-none"
          >
            <span
              aria-hidden="true"
              className={[
                'hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-teal-600 text-xs font-bold text-white',
                collapsed ? 'lg:flex' : '',
              ].join(' ')}
            >
              RCI
            </span>
            <span className={collapsed ? 'lg:hidden' : ''}>
              <Logo variant="dark" height={30} asLink={false} />
            </span>
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Tutup menu"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          >
            <XIcon size={20} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Menu admin">
          <NavGroup label="Menu Utama" items={ADMIN_NAV_MAIN} pathname={pathname} collapsed={collapsed} onNavigate={onCloseMobile} />
          <NavGroup label="Pengaturan" items={ADMIN_NAV_SETTINGS} pathname={pathname} collapsed={collapsed} onNavigate={onCloseMobile} />
        </nav>

        <div className="shrink-0 space-y-1 border-t border-white/[0.07] px-3 py-3">
          {/* Tombol kecilkan/besarkan — hanya masuk akal di lg ke atas,
              karena di bawah itu sidebar berupa drawer. */}
          <button
            type="button"
            onClick={onToggleCollapsed}
            title={collapsed ? 'Besarkan sidebar' : 'Kecilkan sidebar'}
            aria-label={collapsed ? 'Besarkan sidebar' : 'Kecilkan sidebar'}
            className="font-ui hidden h-9 w-full items-center gap-2.5 rounded-xl px-3 text-xs font-medium text-white/45 transition-colors duration-100 hover:bg-white/[0.08] hover:text-white/80 focus-visible:shadow-focus-dark focus-visible:outline-none lg:flex"
          >
            {collapsed
              ? <CaretDoubleRightIcon size={16} weight="bold" aria-hidden="true" />
              : <CaretDoubleLeftIcon size={16} weight="bold" aria-hidden="true" />}
            {!collapsed && <span>Kecilkan</span>}
          </button>

          <div className={['flex items-center gap-2.5 px-3 py-1', collapsed ? 'lg:justify-center lg:px-0' : ''].join(' ')}>
            <div
              title={userEmail}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-teal-600/20 text-xs font-bold text-brand-teal-400"
            >
              {getInitials(userEmail)}
            </div>
            <p className={['min-w-0 flex-1 truncate text-xs text-white/40', collapsed ? 'lg:hidden' : ''].join(' ')} title={userEmail}>
              {userEmail}
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Keluar dari akun"
            className={[
              'font-ui flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-white/60',
              'transition-colors duration-100 hover:bg-danger-600/15 hover:text-danger-500',
              'active:bg-danger-600/25 focus-visible:shadow-focus-dark focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-60',
              collapsed ? 'lg:justify-center lg:px-0' : '',
            ].join(' ')}
          >
            {isLoggingOut
              ? <CircleNotchIcon size={20} weight="bold" className="animate-spin" aria-hidden="true" />
              : <SignOutIcon size={20} weight="duotone" aria-hidden="true" />}
            <span className={collapsed ? 'lg:hidden' : ''}>
              {isLoggingOut ? 'Memproses…' : 'Logout'}
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}

function NavGroup({
  label, items, pathname, collapsed, onNavigate,
}: { label: string; items: AdminNavItem[]; pathname: string; collapsed: boolean; onNavigate: () => void }) {
  return (
    <div>
      {/* Judul grup disembunyikan saat mengecil — pada lebar 64px ia
          terpotong jadi cacahan huruf yang tidak terbaca. Garis tipis
          menggantikannya sebagai pemisah supaya pengelompokan tetap ada. */}
      <p
        className={[
          'font-ui mb-2 px-3 text-xs font-bold uppercase tracking-wider text-white/35',
          collapsed ? 'lg:hidden' : '',
        ].join(' ')}
      >
        {label}
      </p>
      <div className={['mb-2 hidden h-px bg-white/[0.07]', collapsed ? 'lg:block' : ''].join(' ')} aria-hidden="true" />
      <ul className="space-y-0.5" role="list">
        {items.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </ul>
    </div>
  )
}

function NavLink({
  item, pathname, collapsed, onNavigate,
}: { item: AdminNavItem; pathname: string; collapsed: boolean; onNavigate: () => void }) {
  const active = isActive(item.href, pathname, item.matchExact)
  const Icon = item.icon

  return (
    <li>
      <Link
        href={item.href}
        title={item.label}
        onClick={onNavigate}
        className={[
          'font-ui flex h-10 items-center gap-2.5 rounded-xl px-3 text-sm transition-all duration-150',
          'focus-visible:shadow-focus-dark focus-visible:outline-none',
          collapsed ? 'lg:justify-center lg:px-0' : '',
          active
            ? 'bg-brand-teal-600 font-semibold text-white'
            : 'font-medium text-white/65 hover:bg-white/[0.08] hover:text-white/90',
        ].join(' ')}
        aria-current={active ? 'page' : undefined}
      >
        <Icon size={20} weight="duotone" aria-hidden="true" className={active ? '' : 'opacity-70'} />
        <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
      </Link>
    </li>
  )
}
