// components/brand/BrandDialogContent.tsx
//
// BUGFIX (2026-08-19) — permukaan dialog yang benar-benar buram.
//
// MASALAH: components/ui/dialog.tsx memberi DialogContent kelas
// `bg-popover text-popover-foreground ring-foreground/10`. Ketiganya
// TIDAK PERNAH LAHIR di CSS. Diverifikasi dengan meng-grep bundle CSS
// hasil build: `.bg-popover`, `.bg-card`, `.bg-background`, dan
// `.text-popover-foreground` nihil.
//
// Sebabnya: app/globals.css mendefinisikan `--popover` di dalam `:root`,
// tapi Tailwind v4 hanya menghasilkan utility dari entri `--color-*` di
// dalam blok `@theme`. Pemetaan `--color-popover: var(--popover)` tidak
// pernah dibuat, jadi kelasnya tidak ada dan panel dialog TIDAK punya
// latar sama sekali — tembus pandang ke halaman di belakangnya.
//
// Kelas bug yang sama dengan `.prose-brand` dulu: dirujuk kode, tidak
// pernah ada di CSS, dan tidak menimbulkan error apa pun.
//
// KENAPA DIPERBAIKI DI SINI, BUKAN DI SUMBERNYA:
// - app/globals.css FROZEN (CLAUDE.md) — menambah token butuh diskusi tim
// - components/ui/* tidak boleh diedit langsung; CLAUDE.md menyuruh
//   memperluasnya lewat wrapper components/brand/
// Wrapper ini memakai token merek yang SUDAH ADA, jadi tidak menambah
// token baru dan tidak menyentuh file beku.
//
// ⚠️ CAKUPAN: wrapper ini hanya memperbaiki dialog yang MEMAKAINYA.
// Empat pemakai Dialog lain masih transparan — lihat laporan.

import { DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type Props = React.ComponentProps<typeof DialogContent>

export function BrandDialogContent({ className, ...props }: Props) {
  return (
    <DialogContent
      className={cn(
        // Latar buram + pemisah visual. Overlay bawaan hanya `bg-black/10`,
        // jadi bayangan tebal di sini yang mengerjakan sebagian besar tugas
        // memisahkan dialog dari halaman. Overlay-nya sendiri tidak bisa
        // diperkuat dari luar: DialogContent merender <DialogOverlay/> tanpa
        // meneruskan className, dan CSS tidak punya selektor "saudara
        // sebelumnya" untuk menjangkaunya.
        'bg-white text-ink-700 shadow-2xl shadow-ink-950/25 ring-1 ring-ink-900/10',
        className
      )}
      {...props}
    />
  )
}
