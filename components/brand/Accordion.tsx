'use client'

// components/brand/Accordion.tsx — CP4 (2026-08-21)
// Pola resmi accordion. Kontraknya ditulis di DESIGN-SYSTEM §4.4.
//
// KENAPA <details>/<summary>, BUKAN div + useState.
// Elemen native sudah membawa peran, keadaan expanded, fokus keyboard,
// Enter/Space, dan — yang paling sering terlupa — pencarian dalam halaman:
// Ctrl+F di Chrome membuka <details> yang tertutup untuk menampilkan hasil.
// Menirunya dengan div menuntut menulis ulang semuanya, dan bagian terakhir
// itu praktis tidak pernah ditulis ulang.
//
// SATU-TERBUKA vs BANYAK: banyak. Poin misi bukan pilihan yang saling
// meniadakan — pembaca yang ingin membandingkan dua poin tidak boleh
// dipaksa menutup salah satunya. `name` HTML native (accordion eksklusif)
// sengaja TIDAK dipakai.

import { CaretDownIcon } from '@phosphor-icons/react'

export interface AccordionItem {
  id: string
  title: string
  body: string
}

interface AccordionProps {
  items: AccordionItem[]
  /** Indeks yang terbuka saat halaman dimuat. Default: item pertama —
   *  supaya bagian ini tidak terbaca sebagai daftar judul kosong. */
  defaultOpenIndex?: number
  className?: string
}

export function Accordion({ items, defaultOpenIndex = 0, className }: AccordionProps) {
  return (
    <div className={['divide-y divide-ink-900/[0.08]', className].filter(Boolean).join(' ')}>
      {items.map((item, i) => (
        <details
          key={item.id}
          open={i === defaultOpenIndex}
          className="group py-1"
        >
          <summary
            className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md px-1 py-3.5 text-left transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none [&::-webkit-details-marker]:hidden"
          >
            <span className="font-ui text-base font-semibold text-ink-700">{item.title}</span>
            {/* Ikon berputar 180° saat terbuka — 150ms, transisi keadaan,
                bukan animasi masuk (DESIGN-SYSTEM §7 DIIZINKAN). */}
            <CaretDownIcon
              size={20}
              className="shrink-0 text-neutral-400 transition-transform duration-150 ease-out group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="px-1 pb-4 pr-10">
            <p className="text-pretty text-sm leading-relaxed text-neutral-600 md:text-base">
              {item.body}
            </p>
          </div>
        </details>
      ))}
    </div>
  )
}
