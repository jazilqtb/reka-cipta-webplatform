// components/layout/AdminHeader.tsx
//
// BATCH 1 (2026-08-15) — adopsi token portal publik.
//
// ⚠️ GOD NODE SURFACE ADMIN: dipakai 13 halaman /admin/* (diverifikasi
// via grep, bukan tebakan). KONTRAK PROPS TIDAK BOLEH BERUBAH —
// { title, breadcrumb? } dipertahankan persis apa adanya. Kalau
// signature-nya berubah, 13 file ikut harus diubah dalam satu commit.
// Yang berubah HANYA isi visualnya.
//
// Perubahan: ikon Lucide → Phosphor duotone · heading → font-ui ·
// border-neutral-200 → ink-900/10 · rounded-lg → rounded-xl ·
// text-neutral-900 → ink-700 (warna heading portal publik).
//
// Tombol notifikasi: sebelumnya <button> tanpa onClick — kontrol mati
// yang terlihat hidup. Sekarang ditandai disabled + title yang jujur
// sampai sistem notifikasi benar-benar ada (lihat TODO-HARDCODE).

import Link from 'next/link'
import { BellIcon, CaretRightIcon } from '@phosphor-icons/react/ssr'

interface AdminHeaderProps {
  title: string
  breadcrumb?: string
}

export function AdminHeader({ title, breadcrumb }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-ink-900/10 bg-white/95 px-6 backdrop-blur-sm">
      <div className="min-w-0">
        <h1 className="font-ui truncate text-lg font-semibold leading-tight text-ink-700">
          {title}
        </h1>
        {breadcrumb && (
          <nav aria-label="Breadcrumb" className="mt-0.5">
            <ol className="font-ui flex items-center gap-1.5 text-xs text-neutral-400" role="list">
              <li>
                <Link
                  href="/admin/dashboard"
                  className="transition-colors hover:text-brand-teal-600"
                >
                  Admin
                </Link>
              </li>
              <li aria-hidden="true" className="flex items-center">
                <CaretRightIcon size={11} weight="bold" />
              </li>
              <li className="truncate font-medium text-neutral-600">{breadcrumb}</li>
            </ol>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* TODO-HARDCODE: tombol notifikasi belum terhubung ke sistem apa pun
            — needs: keputusan Jazil apakah notifikasi in-app dibangun
            (butuh tabel notifications + realtime channel) atau tombol ini
            dihapus. Sengaja `disabled` agar tidak berpura-pura berfungsi. */}
        <button
          type="button"
          disabled
          title="Notifikasi belum tersedia"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-neutral-300 transition-colors duration-100 disabled:cursor-not-allowed"
          aria-label="Notifikasi (belum tersedia)"
        >
          <BellIcon size={19} weight="duotone" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
