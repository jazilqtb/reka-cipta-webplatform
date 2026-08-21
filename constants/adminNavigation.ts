// constants/adminNavigation.ts
//
// BATCH 1 (2026-08-15) — ikon Lucide → Phosphor duotone.
// Alasannya sama dengan migrasi portal publik di Ronde 4: Lucide adalah
// outline 1px seragam yang terbaca generik; Phosphor duotone punya layer
// isi + stroke sehingga lebih berkarakter. Setelah ini, sidebar admin
// memakai keluarga ikon yang SAMA dengan seluruh situs publik.
//
// Tipe `icon` berubah LucideIcon -> PhosphorIcon. Konsumen (AdminSidebar)
// hanya me-render <Icon size={...} />, dan kedua library sama-sama
// menerima prop `size`, jadi tidak ada perubahan pemakaian selain
// tambahan `weight="duotone"`.

import {
  LayoutIcon,
  BuildingsIcon,
  TruckIcon,
  CheckSquareIcon,
  SquaresFourIcon,      // Dashboard
  ClipboardTextIcon,    // Leads & RFQ
  PlantIcon,            // Supplier
  BookOpenIcon,         // Artikel
  PackageIcon,          // Produk
  GearIcon,             // Pengaturan
  SparkleIcon,          // Pengaturan Proposal
  EnvelopeSimpleIcon,   // Template Pesan
} from '@phosphor-icons/react/ssr'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'

export interface AdminNavItem {
  label: string
  href: string
  icon: PhosphorIcon
  matchExact: boolean
}

export const ADMIN_NAV_MAIN: AdminNavItem[] = [
  { label: 'Dashboard',    href: '/admin/dashboard',  icon: SquaresFourIcon,   matchExact: true  },
  { label: 'Leads & RFQ',  href: '/admin/leads',      icon: ClipboardTextIcon, matchExact: false },
  { label: 'Perusahaan',   href: '/admin/perusahaan', icon: BuildingsIcon,     matchExact: true  },
  { label: 'Distribusi',   href: '/admin/distribusi', icon: TruckIcon,         matchExact: true  },
  { label: 'Tugas',        href: '/admin/tugas',      icon: CheckSquareIcon,   matchExact: true  },
  { label: 'Supplier',     href: '/admin/suppliers',  icon: PlantIcon,         matchExact: false },
  { label: 'Artikel',      href: '/admin/articles',   icon: BookOpenIcon,      matchExact: false },
  { label: 'Produk',       href: '/admin/products',   icon: PackageIcon,       matchExact: false },
] as const

/* Kelompok baru (CP3/CP4, 2026-08-21): permukaan konten situs publik yang
   kini bisa disunting non-teknis. Dipisah dari MENU UTAMA — yang di atas
   adalah pekerjaan harian (lead masuk, artikel terbit), yang di sini
   diubah sesekali dan dampaknya langsung terlihat pengunjung. */
export const ADMIN_NAV_CONTENT: AdminNavItem[] = [
  { label: 'Hero Beranda', href: '/admin/hero',         icon: LayoutIcon, matchExact: true },
  { label: 'Tentang Kami', href: '/admin/tentang-kami', icon: BuildingsIcon, matchExact: true },
] as const

// Epic 4B Slice 3A/3B — implemented ahead of Slice 3 trigger criteria
// (task breakdown "Trigger Criteria"), lihat catatan di PromptEditor.tsx.
export const ADMIN_NAV_SETTINGS: AdminNavItem[] = [
  { label: 'Pengaturan',          href: '/admin/settings',           icon: GearIcon,           matchExact: true  },
  { label: 'Pengaturan Proposal', href: '/admin/proposal-settings',  icon: SparkleIcon,        matchExact: true  },
  { label: 'Template Pesan',      href: '/admin/email-templates',    icon: EnvelopeSimpleIcon, matchExact: true  },
] as const

export const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard':          'Dashboard',
  '/admin/leads':              'Leads & RFQ',
  '/admin/perusahaan':         'Perusahaan',
  '/admin/distribusi':         'Distribusi',
  '/admin/tugas':              'Tugas & Follow-up',
  '/admin/suppliers':          'Manajemen Supplier',
  '/admin/articles':           'Manajemen Artikel',
  '/admin/products':           'Manajemen Produk',
  '/admin/settings':           'Pengaturan',
  '/admin/proposal-settings':  'Pengaturan Proposal',
  '/admin/email-templates':    'Template Pesan',
  '/admin/hero':               'Hero Beranda',
  '/admin/tentang-kami':       'Tentang Kami',
}
