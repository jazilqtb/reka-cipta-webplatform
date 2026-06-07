'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ADMIN_NAV_MAIN, ADMIN_NAV_SETTINGS, type AdminNavItem } from '@/constants/adminNavigation'

interface AdminSidebarProps {
  userEmail: string
}

function isActive(href: string, pathname: string, exact: boolean): boolean {
  if (exact) return pathname === href
  return pathname.startsWith(href)
}

function getInitials(email: string): string {
  const [local] = email.split('@')
  return local.slice(0, 2).toUpperCase()
}

export function AdminSidebar({ userEmail }: AdminSidebarProps) {
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
    <aside
      className="fixed top-0 left-0 bottom-0 w-[240px] bg-ink-900 border-r border-white/5 flex flex-col z-30 overflow-y-auto"
      aria-label="Admin navigation"
    >
      {/* Logo */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-white/[0.07] shrink-0">
        <div className="h-8 w-8 rounded-lg bg-brand-teal-600 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">RC</span>
        </div>
        <span className="text-sm font-semibold text-white truncate">
          Reka Cipta
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto" aria-label="Admin menu">
        {/* Menu Utama */}
        <div>
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/35">
            Menu Utama
          </p>
          <ul className="space-y-0.5" role="list">
            {ADMIN_NAV_MAIN.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </ul>
        </div>

        {/* Pengaturan */}
        <div>
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/35">
            Pengaturan
          </p>
          <ul className="space-y-0.5" role="list">
            {ADMIN_NAV_SETTINGS.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </ul>
        </div>
      </nav>

      {/* User info + Logout */}
      <div className="shrink-0 px-3 py-4 border-t border-white/[0.07] space-y-2">
        <div className="flex items-center gap-2.5 px-3">
          <div className="w-8 h-8 rounded-full bg-brand-teal-600/20 flex items-center justify-center text-brand-teal-400 text-xs font-bold shrink-0">
            {getInitials(userEmail)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/40 truncate" title={userEmail}>
              {userEmail}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-2.5 w-full h-9 px-3 rounded-lg text-sm text-white/50 hover:bg-danger-600/15 hover:text-danger-500 active:bg-danger-600/25 focus-visible:outline-none focus-visible:shadow-focus-dark transition-colors duration-100 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <LogOut size={18} aria-hidden="true" />
          {isLoggingOut ? 'Memproses...' : 'Logout'}
        </button>
      </div>
    </aside>
  )
}

function NavLink({ item, pathname }: { item: AdminNavItem; pathname: string }) {
  const active = isActive(item.href, pathname, item.matchExact)
  const Icon = item.icon

  return (
    <li>
      <Link
        href={item.href}
        className={[
          'flex items-center gap-2.5 h-10 px-3 rounded-lg text-sm transition-colors duration-100',
          'focus-visible:outline-none focus-visible:shadow-focus-dark',
          active
            ? 'bg-brand-teal-600 text-white font-semibold'
            : 'text-white/65 hover:bg-white/[0.08] hover:text-white/90 font-medium',
        ].join(' ')}
        aria-current={active ? 'page' : undefined}
      >
        <Icon size={18} aria-hidden="true" className={active ? '' : 'opacity-75'} />
        {item.label}
      </Link>
    </li>
  )
}
