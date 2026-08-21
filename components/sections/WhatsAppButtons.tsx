// components/sections/WhatsAppButtons.tsx
// Epic 2 Slice 3 (E2-S3-FE-03) — Tombol WA yang link ke wa.me/...
// Server Component.
//
// RONDE Tahap 10 (2026-08) — "samakan DNA desain /kontak": tombol
// bg-green-500 (warna brand WhatsApp literal) diganti brand-teal-600 —
// konsisten dgn SEMUA tombol WA lain di situs (Navbar, Footer,
// StagedCTASection tidak satu pun pakai hijau WhatsApp, semua teal).
// Ikon Lucide → Phosphor duotone, radius → rounded-xl (satu-satunya
// radius tombol di situs, aturan bentuk Ronde 4).
import Link from 'next/link'
import { ChatCircleIcon } from '@phosphor-icons/react/ssr'
import { cn, formatPhoneDisplay } from '@/lib/utils'
import { generateWALink } from '@/lib/wa-link'

interface WhatsAppButtonsProps {
  whatsapp1: string
  whatsapp2?: string
  defaultMessage: string
}

const BUTTON_CLASS = cn(
  'font-ui group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-teal-600 px-4',
  'text-sm font-semibold text-white transition-colors hover:bg-brand-teal-500',
  'focus-visible:outline-none focus-visible:shadow-focus'
)

export function WhatsAppButtons({ whatsapp1, whatsapp2, defaultMessage }: WhatsAppButtonsProps) {
  return (
    <div className="mt-8">
      <p className="font-ui text-xs font-bold uppercase tracking-wide text-neutral-500">
        Chat Langsung via WhatsApp
      </p>

      {/* POIN 13 (2026-08-21) — nomor tidak boleh pecah baris.
          Penyebab sebenarnya BUKAN ukuran font atau word-break, melainkan
          `md:flex-row`: kedua tombol disandingkan di dalam kolom samping
          yang lebarnya hanya ~275px pada 768px, jadi masing-masing dapat
          132px sementara "WA +62 853-3651-3164" butuh sekitar 155px.
          Terukur pada 414/768/1024/1440 sebelum diubah.
          Perbaikannya menghapus penyandingan itu — dua tombol lebar penuh
          di kolom sempit juga memberi area sentuh yang lebih besar —
          ditambah `whitespace-nowrap` sebagai jaring pengaman supaya nomor
          tidak pernah terpecah berapa pun lebar wadahnya nanti. */}
      <div className="mt-3 flex flex-col gap-3">
        <Link href={generateWALink(whatsapp1, defaultMessage)} target="_blank" rel="noopener noreferrer" className={BUTTON_CLASS}>
          <ChatCircleIcon size={20} weight="duotone" className="transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
          <span className="whitespace-nowrap">WA {formatPhoneDisplay(whatsapp1)}</span>
        </Link>

        {whatsapp2 && (
          <Link href={generateWALink(whatsapp2, defaultMessage)} target="_blank" rel="noopener noreferrer" className={BUTTON_CLASS}>
            <ChatCircleIcon size={20} weight="duotone" className="transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
            <span className="whitespace-nowrap">WA {formatPhoneDisplay(whatsapp2)}</span>
          </Link>
        )}
      </div>
    </div>
  )
}
