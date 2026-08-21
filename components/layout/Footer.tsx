// components/layout/Footer.tsx
// RONDE 4 (2026-08) — revisi 11 poin klien atas Ronde 3, dua area:
//
// (9) "Footer kurang informatif" — sebelumnya cuma Navigasi + Kontak.
//     Ditambah 2 kolom nyata: "Produk Kami" (link ke 5 produk, bukan cuma
//     link umum /produk) dan "Legalitas" (4 dokumen dari LEGAL_DOCUMENTS
//     — data nyata yang SUDAH ada di constants/company-profile.ts untuk
//     halaman Tentang Kami, dipakai ulang di sini, bukan dikarang).
//
// (1)(2)(3)(5)(6)(8)(10)(11) — sama seperti section lain: ikon Lucide →
//     Phosphor duotone, .notch/.facet-frame/.ledger-pill → rounded-xl/
//     .icon-hex/.tag-pill (aturan bentuk tunggal), heading → font-ui,
//     spacing dirapikan.
import Link from 'next/link'
import {
  MapPinIcon, ChatCircleIcon, EnvelopeSimpleIcon,
  ArrowUpIcon, ArrowRightIcon,
} from '@phosphor-icons/react/ssr'
import { NAV_ITEMS, SUPPLIER_LINK, CTA_LINK, COMPANY_INFO } from '@/constants/navigation'
import { Logo } from '@/components/brand/Logo'
import { generateWALink } from '@/lib/wa-link'

interface FooterProps {
  address: string
  whatsapp1: string
  whatsapp2?: string
  email: string
}

// Produk Kami — mirror 5 slug/nama di ProductsPreview.tsx (FALLBACK_PRODUCTS).
// Statis & bertautan langsung, bukan lagi cuma satu link umum "/produk".
const PRODUCT_LINKS = [
  { slug: 'garam-halus-yodium', name: 'Garam Halus PRO YD' },
  { slug: 'garam-halus-non-yodium', name: 'Garam Halus PRO L' },
  { slug: 'garam-kasar-industri', name: 'Garam Kasar SPO/M' },
  { slug: 'garam-kasar-petani', name: 'Garam Kasar Petani' }, // "Premium" dihapus — Fondasi Brand v1.0 §5.3 (kata dihindari)
  { slug: 'garam-ghpt', name: 'Garam Halus Pakan Ternak' },
]

export function Footer({ address, whatsapp1, whatsapp2, email }: FooterProps) {
  return (
    // RONDE 7: .bg-salt-texture (motif garis silang) dihapus — dinilai
    // tidak profesional. Watermark kristal SVG di bawah (sudah sangat
    // samar, opacity 3.5%) sudah cukup jadi tekstur bermerek tanpa garis.
    <footer className="relative overflow-hidden bg-ink-900 text-white/90" role="contentinfo">
      {/* Watermark faceted crystal — signature visual raksasa & samar,
          murni dekoratif, tidak pernah mengganggu kontras teks. */}
      <svg
        className="pointer-events-none absolute -bottom-24 -right-24 h-[420px] w-[420px] text-white/[0.035] md:h-[520px] md:w-[520px]"
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
      >
        <polygon points="30,2 70,2 98,30 98,70 70,98 30,98 2,70 2,30" stroke="currentColor" strokeWidth="1.2" />
        <polygon points="38,16 62,16 84,38 84,62 62,84 38,84 16,62 16,38" stroke="currentColor" strokeWidth="1.2" />
      </svg>

      <div className="relative mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">

          {/* ── Blok Brand ── */}
          <div className="space-y-5 lg:col-span-4">
            <Logo variant="dark" height={44} asLink={false} />

            {/* font-display TERBATAS di sini + Navbar — bukan heading,
                melainkan tagline mikro yang menyertai logo (bagian dari
                brand lockup), bukan pengecualian tersembunyi. */}
            <p className="font-display text-lg leading-snug text-brand-teal-300">
              Garam Lokal, Standar Industri
            </p>

            <p className="max-w-[320px] text-sm leading-relaxed text-white/60">
              {COMPANY_INFO.description}
            </p>

            <a
              href={generateWALink(whatsapp1, 'Halo, saya ingin bertanya tentang produk garam Reka Cipta Indonesia.')}
              target="_blank"
              rel="noopener noreferrer"
              className="link-arrow font-ui rounded-xl inline-flex items-center gap-2 bg-brand-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal-400 focus-visible:outline-none focus-visible:shadow-focus-dark"
            >
              <ChatCircleIcon size={16} weight="duotone" aria-hidden="true" />
              Chat Cepat via WhatsApp
              <ArrowRightIcon size={16} weight="bold" className="arrow-icon" aria-hidden="true" />
            </a>
          </div>

          {/* ── Klaster 3 kolom: Navigasi · Produk · Kontak ── */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8 lg:gap-6">
            {/* Navigasi */}
            <div>
              <h3 className="font-ui text-xs font-bold uppercase tracking-wider text-brand-teal-300/90 mb-4">
                Navigasi
              </h3>
              <ul className="space-y-2.5" role="list">
                {NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/70 hover:text-white transition-colors duration-150 focus-visible:outline-none rounded"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href={CTA_LINK.href}
                    className="text-sm font-semibold text-brand-teal-300 hover:text-brand-teal-200 transition-colors duration-150 focus-visible:outline-none rounded"
                  >
                    {CTA_LINK.label}
                  </Link>
                </li>
                <li>
                  <Link
                    href={SUPPLIER_LINK.href}
                    className="text-sm font-semibold text-sand-300 hover:text-sand-200 transition-colors duration-150 focus-visible:outline-none rounded"
                  >
                    {SUPPLIER_LINK.label}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Produk Kami — 5 link langsung, bukan satu link umum */}
            <div>
              <h3 className="font-ui text-xs font-bold uppercase tracking-wider text-brand-teal-300/90 mb-4">
                Produk Kami
              </h3>
              <ul className="space-y-2.5" role="list">
                {PRODUCT_LINKS.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/produk/${p.slug}`}
                      className="text-sm text-white/70 hover:text-white transition-colors duration-150 focus-visible:outline-none rounded"
                    >
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* RONDE Tahap 8: kolom "Legalitas" DIHAPUS TOTAL — satu-
                satunya tujuannya adalah funnel ke section Legalitas di
                /tentang-kami, yang sekarang sudah dihapus (klien: dokumen
                resmi tidak perlu tampil di antarmuka publik). Menyisakan
                link yang menjanjikan "Akta Notaris, NIB, NPWP" tapi
                mengarah ke halaman yang tidak lagi menampilkannya adalah
                link menyesatkan — dihapus, bukan cuma disembunyikan.
                Klaster jadi 3 kolom (dari 4). */}

            {/* Kontak */}
            <div className="col-span-2 sm:col-span-1">
              <h3 className="font-ui text-xs font-bold uppercase tracking-wider text-brand-teal-300/90 mb-4">
                Hubungi Kami
              </h3>
              <ul className="space-y-3" role="list">
                <li className="flex items-start gap-2.5">
                  <MapPinIcon size={16} weight="duotone" aria-hidden="true" className="mt-0.5 shrink-0 text-brand-teal-300" />
                  <span className="text-sm leading-relaxed text-white/70">{address}</span>
                </li>

                <li>
                  <a
                    href={generateWALink(whatsapp1)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm text-white/70 hover:text-white transition-colors duration-150"
                  >
                    <ChatCircleIcon size={16} weight="duotone" aria-hidden="true" className="shrink-0 text-brand-teal-300" />
                    {whatsapp1}
                    <span className="text-xs text-white/50 bg-white/10 rounded-sm px-2 py-0.5">
                      WA 1
                    </span>
                  </a>
                </li>

                {whatsapp2 && (
                  <li>
                    <a
                      href={generateWALink(whatsapp2)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-white/70 hover:text-white transition-colors duration-150"
                    >
                      <ChatCircleIcon size={16} weight="duotone" aria-hidden="true" className="shrink-0 text-brand-teal-300" />
                      {whatsapp2}
                      <span className="text-xs text-white/50 bg-white/10 rounded-sm px-2 py-0.5">
                        WA 2
                      </span>
                    </a>
                  </li>
                )}

                <li>
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-2.5 text-sm text-white/70 hover:text-white transition-colors duration-150"
                  >
                    <EnvelopeSimpleIcon size={16} weight="duotone" aria-hidden="true" className="shrink-0 text-brand-teal-300" />
                    {email}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* POIN 10 (2026-08-21) — motif geometri dihapus.
            Dulu: dua garis mengapit heksagon berisi titik teal. Heksagon
            adalah bentuk hias yang tidak membawa makna apa pun di footer,
            dan pada latar gelap ia menarik mata ke pembatas — bagian paling
            tidak penting di halaman. Diganti satu garis rambut lurus: tugas
            memisahkan tetap dikerjakan, tanpa meminta perhatian. */}
        <div className="mt-12 h-px w-full bg-white/10 md:mt-16" aria-hidden="true" />
      </div>

      {/* Bottom bar — RONDE 6: badge SNI/NIB dihapus dari sini (keluhan
          klien: footer kelebihan info). Bukan kehilangan informasi unik —
          klaim SNI sudah ada di eyebrow Hero + tiap kartu produk, dan NIB
          kini terwakili lewat link "Legalitas & Dokumen Perusahaan" di
          atas. Bottom-bar cukup copyright saja, tidak perlu duplikasi. */}
      <div className="relative border-t border-white/10">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8 py-5 flex items-center justify-center">
          <p className="text-xs text-white/50 text-center">
            © {COMPANY_INFO.legal.year} {COMPANY_INFO.name}. Hak cipta dilindungi.
          </p>
        </div>

        {/* Kembali ke atas — anchor native ke target skip-link Navbar,
            tanpa JS (Footer tetap Server Component). rounded-xl (bukan
            notch — aturan bentuk tunggal Ronde 4). */}
        <a
          href="#main-content"
          className="rounded-xl absolute -top-5 right-4 flex h-10 w-10 items-center justify-center border border-white/15 bg-ink-800 text-white/70 shadow-lg transition-colors hover:bg-brand-teal-500 hover:text-white focus-visible:outline-none focus-visible:shadow-focus-dark md:right-8"
          aria-label="Kembali ke atas halaman"
        >
          <ArrowUpIcon size={20} weight="bold" aria-hidden="true" />
        </a>
      </div>
    </footer>
  )
}
