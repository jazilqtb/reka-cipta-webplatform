import {
  LayoutDashboard,
  ClipboardList,
  Sprout,
  BookOpen,
  Package,
  Settings,
  Sparkles,
  Mail,
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

// Epic 4B Slice 3A/3B — implemented ahead of Slice 3 trigger criteria
// (task breakdown "Trigger Criteria"), lihat catatan di PromptEditor.tsx.
export const ADMIN_NAV_SETTINGS: AdminNavItem[] = [
  { label: 'Pengaturan',          href: '/admin/settings',           icon: Settings, matchExact: true  },
  { label: 'Pengaturan Proposal', href: '/admin/proposal-settings',  icon: Sparkles, matchExact: true  },
  { label: 'Template Pesan',      href: '/admin/email-templates',    icon: Mail,     matchExact: true  },
] as const

export const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard':          'Dashboard',
  '/admin/leads':              'Leads & RFQ',
  '/admin/suppliers':          'Manajemen Supplier',
  '/admin/articles':           'Manajemen Artikel',
  '/admin/products':           'Manajemen Produk',
  '/admin/settings':           'Pengaturan',
  '/admin/proposal-settings':  'Pengaturan Proposal',
  '/admin/email-templates':    'Template Pesan',
}
