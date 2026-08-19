// components/admin/ui/InfoHint.tsx
//
// CP3.1 (2026-08-19) — penjelasan per-field di panel metadata.
//
// KENAPA BUKAN TOOLTIP HOVER MURNI:
// Field metadata paling sering diisi justru saat sedang tidak yakin, dan
// tooltip yang hanya muncul saat hover tidak bisa disentuh di layar sentuh
// dan tidak bisa dijangkau keyboard. Komponen ini muncul pada hover, fokus
// keyboard, DAN klik — klik mengunci agar isinya bisa dibaca tenang, bahkan
// disalin, tanpa takut hilang begitu kursor bergeser.
//
// KENAPA BUKAN <abbr title=""> ATAU title ATTRIBUTE:
// title bawaan browser tampil setelah jeda ~1 detik, tidak bisa diberi
// baris baru atau penekanan, dan tidak muncul sama sekali di perangkat
// sentuh. Untuk teks penjelas 2-3 kalimat, itu tidak memadai.

'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { InfoIcon } from '@phosphor-icons/react/ssr'

interface InfoHintProps {
  /** Judul singkat — apa field ini sebenarnya. */
  title: string
  /** Penjelasan: maksud, kegunaan, dan cara mengisi. */
  children: React.ReactNode
}

export function InfoHint({ title, children }: InfoHintProps) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const id = useId()
  const wrapRef = useRef<HTMLSpanElement>(null)

  // Klik di luar melepas kuncian. Tanpa ini, panel yang terkunci akan
  // menghalangi field di bawahnya sampai tombolnya diklik lagi.
  useEffect(() => {
    if (!pinned) return
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setPinned(false)
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setPinned(false); setOpen(false) }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [pinned])

  const visible = open || pinned

  return (
    <span ref={wrapRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={`Penjelasan: ${title}`}
        aria-expanded={visible}
        aria-describedby={visible ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => { if (!pinned) setOpen(false) }}
        onFocus={() => setOpen(true)}
        onBlur={() => { if (!pinned) setOpen(false) }}
        onClick={() => setPinned((p) => !p)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-neutral-300 transition-colors duration-100 hover:text-brand-teal-600 focus-visible:shadow-focus focus-visible:outline-none"
      >
        <InfoIcon size={14} weight={visible ? 'fill' : 'regular'} aria-hidden="true" />
      </button>

      {visible && (
        <span
          id={id}
          role="tooltip"
          // Dibuka ke KIRI karena komponen ini hidup di panel kanan;
          // membuka ke kanan akan keluar dari tepi layar.
          className="absolute right-0 top-6 z-30 w-64 rounded-xl border border-ink-900/10 bg-white p-3 text-left shadow-xl shadow-ink-950/15"
        >
          <span className="font-ui mb-1 block text-[11px] font-bold text-ink-700">{title}</span>
          <span className="block text-[11px] leading-relaxed text-neutral-600">{children}</span>
        </span>
      )}
    </span>
  )
}
