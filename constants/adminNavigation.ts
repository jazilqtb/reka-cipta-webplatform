import {
  LayoutDashboard,
  ClipboardList,
  Sprout,
  BookOpen,
  Package,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface AdminNavItem {
  label: string
  href: string
  icon: LucideIcon
  matchExact: boolean
}

export const ADMIN_NAV_MAIN: AdminNavItem[] = [
  { label: 'Dashboard',    href: '/admin/dashboard',  icon: LayoutDashboard, matchExact: true  },
  { label: 'Leads & RFQ',  href: '/admin/leads',      icon: ClipboardList,   matchExact: false },
  { label: 'Supplier',     href: '/admin/suppliers',  icon: Sprout,          matchExact: false },
  { label: 'Artikel',      href: '/admin/articles',   icon: BookOpen,        matchExact: false },
  { label: 'Produk',       href: '/admin/products',   icon: Package,         matchExact: false },
] as const

export const ADMIN_NAV_SETTINGS: AdminNavItem[] = [
  { label: 'Pengaturan',   href: '/admin/settings',   icon: Settings,        matchExact: true  },
] as const

export const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/leads':     'Leads & RFQ',
  '/admin/suppliers': 'Manajemen Supplier',
  '/admin/articles':  'Manajemen Artikel',
  '/admin/products':  'Manajemen Produk',
  '/admin/settings':  'Pengaturan',
}
