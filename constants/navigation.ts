import {
  Home,
  Package,
  Info,
  BookOpen,
  Calculator,
  Mail,
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

// RONDE Tahap 9 (2026-08): "Kontak" ditambahkan — sebelumnya halaman
// /kontak TIDAK punya trigger navigasi sama sekali (bukan cuma tidak
// menonjol — benar-benar tidak ada di NAV_ITEMS/Footer/Navbar manapun).
// Satu-satunya jalan masuk sebelumnya adalah tile Sektor Industri di
// Beranda yang tidak relevan (link produk → kontak, sudah dihapus, lihat
// IndustriesGrid.tsx) dan tombol "Hubungi Kami"/"Minta Sampel" di dalam
// CTA halaman /produk/[slug] & /tentang-kami — keduanya baru ketemu
// setelah user menavigasi cukup dalam, bukan discoverable dari mana pun.
// Ditambah di sini (bukan komponen terpisah) supaya SATU perubahan data
// otomatis muncul di 3 tempat sekaligus: Navbar desktop, drawer mobile,
// DAN kolom "Navigasi" Footer (ketiganya me-map NAV_ITEMS yang sama) —
// tidak perlu sentuh kode komponen, tidak ada elemen visual baru yang
// dikarang, murni reuse pola yang sudah ada.
export const NAV_ITEMS: NavItem[] = [
  { label: 'Beranda',      href: '/',              icon: Home,       matchExact: true  },
  { label: 'Produk',       href: '/produk',        icon: Package,    matchExact: false },
  { label: 'Tentang Kami', href: '/tentang-kami',  icon: Info,       matchExact: true  },
  { label: 'Artikel',      href: '/artikel',       icon: BookOpen,   matchExact: false },
  { label: 'Kalkulator',   href: '/kalkulator',    icon: Calculator, matchExact: true  },
  { label: 'Kontak',       href: '/kontak',        icon: Mail,       matchExact: true  },
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
