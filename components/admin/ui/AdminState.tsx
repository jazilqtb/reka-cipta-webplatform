// components/admin/ui/AdminState.tsx
// Satu bentuk untuk SETIAP keadaan-bukan-data di area admin: kosong,
// gagal, dan tidak ditemukan.
//
// KENAPA ADA. Audit CP7 mencatat 14 tempat berbeda yang menuliskan
// keadaan ini sendiri-sendiri, dan tidak ada dua yang sama:
//
//     <p className="text-neutral-600">Lead tidak ditemukan.</p>
//     <p className="text-sm text-neutral-400 text-center py-6">Belum ada lead</p>
//     <p className="text-sm text-neutral-600">Gagal memuat leads.</p>
//
// Sebagian berukuran text-sm, sebagian text-base; sebagian rata tengah,
// sebagian rata kiri; sebagian punya tombol pemulihan, sebagian membiarkan
// operator buntu. Padahal ini justru momen ketika antarmuka paling perlu
// terbaca tenang dan seragam — pengguna sudah tidak mendapat yang ia cari.
//
// Tiga nada, bukan satu, karena ketiganya berarti hal yang berbeda:
//   empty  — sistem sehat, datanya memang belum ada. Netral.
//   error  — sistem gagal. Harus menawarkan jalan keluar.
//   missing— alamatnya salah/basi. Harus menawarkan jalan kembali.

import type { ReactNode } from 'react'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import {
  FileMagnifyingGlassIcon,
  PlugsConnectedIcon,
  TrayIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react/ssr'

type Tone = 'empty' | 'error' | 'missing' | 'blocked'

const TONE: Record<Tone, { icon: PhosphorIcon; ring: string; fg: string }> = {
  empty:   { icon: TrayIcon,               ring: 'bg-neutral-100', fg: 'text-neutral-500' },
  error:   { icon: WarningCircleIcon,      ring: 'bg-danger-50',   fg: 'text-danger-600' },
  missing: { icon: FileMagnifyingGlassIcon, ring: 'bg-neutral-100', fg: 'text-neutral-500' },
  /* 'blocked' (2026-08-21) — permintaan tidak pernah SAMPAI ke server:
     origin ditolak CORS, atau jaringan putus. Dipisah dari 'error' karena
     jalan keluarnya berbeda: 'error' minta dicoba lagi, 'blocked' minta
     alamat/konfigurasi diperiksa. Menyuruh orang "coba lagi" pada
     kegagalan CORS berarti menyuruhnya mengulang hal yang pasti gagal. */
  blocked: { icon: PlugsConnectedIcon, ring: 'bg-warning-50', fg: 'text-warning-700' },
}

interface AdminStateProps {
  tone?: Tone
  title: string
  /** Satu kalimat. Kalau tidak menambah apa pun di luar judul, kosongkan. */
  description?: string
  /** Tombol/tautan pemulihan. Wajib diisi untuk tone 'error' dan 'missing'. */
  action?: ReactNode
  className?: string
}

export function AdminState({
  tone = 'empty',
  title,
  description,
  action,
  className,
}: AdminStateProps) {
  const { icon: Icon, ring, fg } = TONE[tone]
  return (
    <div
      role={tone === 'error' || tone === 'blocked' ? 'alert' : undefined}
      className={['flex flex-col items-center justify-center px-6 py-10 text-center', className]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-md ${ring}`}>
        <Icon size={20} weight="duotone" className={fg} aria-hidden="true" />
      </span>
      <p className="font-ui text-sm font-semibold text-ink-700">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
