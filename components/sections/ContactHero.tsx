// components/sections/ContactHero.tsx
// RONDE Tahap 10 (2026-08) — "samakan DNA desain /kontak dengan Beranda,
// /produk, /tentang-kami". Komponen baru, BUKAN memperluas <InnerPageHero>
// (dipakai 4 halaman lain: jadi-supplier, artikel, kalkulator,
// minta-penawaran) — pola scope yg sama dgn ProductCatalogHero.tsx,
// ProductHero.tsx, AboutHero.tsx.
//
// DNA identik: gradient VERTIKAL murni (bg-gradient-to-b, bukan diagonal
// — pelajaran seam Tahap 5/8), mesh gradient diklaster di atas,
// italic, garis kredensial mono-tech, SectionDivider curve menutup ke
// section putih di bawahnya.
import Link from 'next/link'
import { CaretRightIcon, ChatCircleIcon, ClockIcon } from '@phosphor-icons/react/ssr'
import { SectionDivider } from '@/components/decorative/SectionDivider'

export function ContactHero() {
  return (
    <>
    <section className="relative overflow-hidden surface-depth edge-marine-bottom px-4 pb-14 pt-14 md:pb-20 md:pt-20">

      <div className="relative mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 font-ui text-sm text-brand-teal-300/70">
          <Link href="/" className="link-animated transition-colors hover:text-brand-teal-200">Beranda</Link>
          <CaretRightIcon size={16} weight="bold" aria-hidden="true" />
          <span aria-current="page" className="text-white/90">Kontak</span>
        </nav>

        <p className="rule-index font-ui text-brand-teal-300">Kontak</p>

        <h1 className="mt-3 max-w-2xl text-balance font-ui text-3xl md:text-4xl font-semibold leading-[1.1] tracking-tight text-white">
          Kami Siap Membantu, <span className="font-medium text-brand-teal-300">Kapan Pun</span> Anda Butuhkan
        </h1>

        <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-white/70 md:text-lg">
          Sampaikan kebutuhan distribusi garam industri Anda via WhatsApp, email, atau
          formulir di bawah — tim kami merespons setiap pesan secara langsung.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-5">
          <div className="flex items-center gap-1.5">
            <ChatCircleIcon size={16} weight="duotone" className="text-brand-teal-300" aria-hidden="true" />
            <span className="font-ui text-xs font-medium text-white/50">WhatsApp & Email Langsung</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ClockIcon size={16} weight="duotone" className="text-brand-teal-300" aria-hidden="true" />
            <span className="font-ui text-xs font-medium text-white/50">Respons Kurang dari 1×24 Jam</span>
          </div>
        </div>
      </div>
    </section>
    <SectionDivider variant="curve" fromClassName="fill-ink-900" toClassName="bg-white" flip />
    </>
  )
}
