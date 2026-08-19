// components/admin/ui/AdminPrimitives.tsx
// BATCH 1 (2026-08-15) — primitif bersama untuk seluruh surface /admin/*.
//
// KENAPA FILE INI ADA:
// Audit menemukan admin memakai NOL token portal publik: font-ui 0×,
// .panel-card 0×, .tag-pill 0×, rule-index 0×, sementara rounded-md 93×
// dan border-neutral-* 128×. Menambal token satu per satu di 41 komponen
// admin akan melahirkan gaya ketiga yang setengah jadi. Primitif ini
// jadi SATU tempat token itu diterapkan; halaman tinggal memakainya.
//
// DIALEK ADMIN (keputusan chair, lihat TASK-PLAN §0):
// Token-nya SAMA dengan portal publik (warna, tipografi, radius, shadow,
// ikon Phosphor). Bahasa MARKETING-nya TIDAK ikut: tanpa SectionDivider,
// tanpa ParallaxBlob, tanpa hero gradien. Dashboard butuh kepadatan
// informasi dan pola pindai yang berlawanan dengan halaman kampanye —
// mengimpor treatment hero ke CRM akan merusak kegunaannya.
//
// BATAS: components/ui/* (primitif shadcn/Base UI) TIDAK diedit —
// aturan CLAUDE.md. Yang di sini adalah lapisan di ATASNYA.

import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

/* ───────────────────────────── AdminCard ─────────────────────────────
   Panel dasar. rounded-2xl + border ink-900/10 (bukan neutral-200) =
   bahasa kartu yang sama dengan .panel-card portal publik.
   `interactive` menyalakan hover lift — HANYA untuk kartu yang benar-
   benar bisa diklik. Kartu statis yang ikut mengangkat saat hover
   menyiratkan aksi yang tidak ada. */
export function AdminCard({
  children,
  className,
  interactive = false,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  interactive?: boolean
  as?: 'div' | 'section' | 'li'
}) {
  const Tag = as
  return (
    <Tag
      className={cn(
        'rounded-2xl border border-ink-900/10 bg-white shadow-sm',
        interactive &&
          'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:shadow-focus',
        className
      )}
    >
      {children}
    </Tag>
  )
}

/* ─────────────────────────── AdminPageHeader ───────────────────────
   Judul halaman di DALAM area konten (bukan mengganti AdminHeader yang
   sticky). Memakai .rule-index — eyebrow bergaris yang sama persis
   dengan setiap section portal publik, jadi kedua sisi produk terbaca
   sebagai satu bahasa. `actions` untuk tombol utama halaman. */
export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  // CP1 (2026-08-19) — `eyebrow` (.rule-index) dan `titleAccent` (aksen
  // italic) DIHAPUS. Keduanya perangkat retorika Beranda: eyebrow bergaris
  // untuk menandai babak naratif, italic untuk menekankan satu kata dalam
  // janji pemasaran. Di alat kerja yang dibuka delapan jam sehari, keduanya
  // hanya menambah tinggi tanpa menambah informasi — audit visual produksi
  // menemukan "Ringkasan / Selamat *Datang* / email" memakan 3 baris untuk
  // menyampaikan nol fakta yang belum ada di tempat lain.
  //
  // Aman diubah: AdminPageHeader hanya punya SATU konsumen (dashboard),
  // diverifikasi lewat grep sebelum signature-nya disentuh.
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-ui text-xl font-semibold text-ink-700">{title}</h2>
        {description && (
          <p className="mt-1 max-w-2xl text-pretty text-sm text-neutral-600">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

/* ───────────────────────────── StatTile ──────────────────────────────
   Kartu metrik. Angka pakai .mono-tech (tabular-nums) supaya kolom
   angka sejajar rapi — bahasa yang sama dengan nilai lab & statistik
   di portal publik.
   `value: null` SENGAJA dibedakan dari 0: query gagal yang ditampilkan
   sebagai "0" adalah kebohongan diam-diam. null -> em-dash. */
export function StatTile({
  label,
  value,
  hint,
  href,
  icon: Icon,
}: {
  label: string
  value: number | string | null
  hint?: string
  href?: string
  icon: PhosphorIcon
}) {
  const body = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-ui text-sm font-medium text-neutral-500">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-teal-50">
          <Icon size={18} weight="duotone" className="text-brand-teal-600" aria-hidden="true" />
        </div>
      </div>
      <p className="mono-tech text-3xl font-bold text-ink-700">{value === null ? '—' : value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="group rounded-2xl border border-ink-900/10 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:shadow-focus"
      >
        {body}
      </Link>
    )
  }
  return <AdminCard className="p-5">{body}</AdminCard>
}

/* ──────────────────────────── StatusPill ─────────────────────────────
   Badge status. Bentuk pil bulat = satu-satunya bentuk badge teks di
   seluruh situs (aturan bentuk Ronde 4). Sebelumnya tiap komponen admin
   menggulung badge-nya sendiri dengan warna berbeda-beda. */
export type StatusTone = 'neutral' | 'teal' | 'sand' | 'success' | 'danger' | 'info'

const TONE: Record<StatusTone, string> = {
  neutral: 'border-ink-900/12 bg-neutral-100 text-neutral-700',
  teal: 'border-brand-teal-600/20 bg-brand-teal-50 text-brand-teal-700',
  sand: 'border-sand-600/20 bg-sand-100 text-sand-700',
  success: 'border-success-600/20 bg-success-50 text-success-700',
  danger: 'border-danger-600/20 bg-danger-50 text-danger-700',
  info: 'border-info-600/20 bg-info-50 text-info-700',
}

export function StatusPill({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: StatusTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'font-ui inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        TONE[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

/* ──────────────────────────── EmptyState ─────────────────────────────
   Audit menemukan halaman admin menampilkan tabel kosong tanpa
   penjelasan. Kondisi kosong harus memberi tahu APA yang kosong dan
   APA langkah berikutnya — bukan sekadar ruang putih. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: PhosphorIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <Icon size={40} weight="duotone" className="text-neutral-300" aria-hidden="true" />
      <p className="font-ui text-base font-semibold text-ink-700">{title}</p>
      {description && <p className="max-w-sm text-sm text-neutral-600">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/* ─────────────────────────── AdminButton ─────────────────────────────
   rounded-xl = radius tombol tunggal di seluruh situs. Hover lift +
   shadow, TANPA border menyala (aturan Ronde 7).
   Sengaja BUKAN membungkus components/ui/button.tsx: primitif itu
   dipakai portal publik dengan varian yang berbeda, dan aturan repo
   melarang mengeditnya. */
const BTN_BASE =
  'font-ui inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-60'

const BTN_VARIANT = {
  primary: 'bg-brand-teal-600 text-white hover:-translate-y-0.5 hover:bg-brand-teal-500',
  secondary:
    'border border-ink-900/15 bg-white text-ink-700 hover:-translate-y-0.5 hover:bg-salt-50',
  danger: 'bg-danger-600 text-white hover:-translate-y-0.5 hover:bg-danger-500',
  ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-ink-700',
} as const

export type AdminButtonVariant = keyof typeof BTN_VARIANT

export function adminButtonClass(
  variant: AdminButtonVariant = 'primary',
  className?: string
): string {
  return cn(BTN_BASE, BTN_VARIANT[variant], className)
}

export function AdminButton({
  children,
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: AdminButtonVariant }) {
  return (
    <button className={adminButtonClass(variant, className)} {...props}>
      {children}
    </button>
  )
}
