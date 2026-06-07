import {
  Home,
  Package,
  Info,
  BookOpen,
  Calculator,
  Sprout,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon?: LucideIcon
  matchExact: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Beranda',      href: '/',              icon: Home,       matchExact: true  },
  { label: 'Produk',       href: '/produk',        icon: Package,    matchExact: false },
  { label: 'Tentang Kami', href: '/tentang-kami',  icon: Info,       matchExact: true  },
  { label: 'Artikel',      href: '/artikel',       icon: BookOpen,   matchExact: false },
  { label: 'Kalkulator',   href: '/kalkulator',    icon: Calculator, matchExact: true  },
] as const

export const SUPPLIER_LINK: NavItem = {
  label: 'Jadi Supplier',
  href: '/jadi-supplier',
  icon: Sprout,
  matchExact: true,
}

export const CTA_LINK = {
  label: 'Minta Penawaran',
  href: '/minta-penawaran',
  icon: ArrowRight,
} as const

export const COMPANY_INFO = {
  name: 'CV Reka Cipta Indonesia',
  tagline: 'Garam Lokal, Standar Industri',
  description:
    'Distributor garam lokal bersertifikat SNI untuk kebutuhan industri Indonesia. Menghubungkan petani garam Madura dengan mitra industri di seluruh Nusantara.',
  address: {
    street: 'Jl. Bratang Gede III-I No. 16A',
    district: 'Kel. Ngagel Rejo, Kec. Wonokromo',
    city: 'Surabaya 60245, Jawa Timur',
  },
  contacts: {
    wa1: { display: '082136096528', url: 'https://wa.me/6282136096528', label: 'WA 1' },
    wa2: { display: '087839031378', url: 'https://wa.me/6287839031378', label: 'WA 2' },
    email: 'rekaciptaindonesiaa@gmail.com',
  },
  legal: {
    nib: '0280010102479',
    year: 2025,
  },
} as const
