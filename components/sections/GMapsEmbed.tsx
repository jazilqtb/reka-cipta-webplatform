// components/sections/GMapsEmbed.tsx
// Epic 2 Slice 3 (E2-S3-FE-05) — Iframe Google Maps atau fallback.
// Server Component.
//
// Security: validasi embedUrl HARUS dimulai dari
// 'https://www.google.com/maps/embed' sebelum di-render sebagai iframe
// src — mencegah admin (tidak sengaja atau sengaja) paste URL lain yang
// bisa jadi vector XSS/clickjacking.
//
// RONDE Tahap 10 (2026-08) — "samakan DNA desain /kontak": heading
// eyebrow + font-ui, ikon Lucide → Phosphor, bg-salt-50 (section
// terakhir sebelum Footer, dibedakan dari section form di atasnya yg
// bg-white) + SectionDivider penutup ke Footer (ink-900) — halaman ini
// TIDAK diberi panel CTA baru (halaman /kontak itu sendiri SUDAH jadi
// CTA — menambah CTA "hubungi kami" lagi di penutup halaman kontak
// sirkular/tidak perlu), tapi transisi terang→gelap ke Footer tetap
// perlu dihaluskan biar konsisten dgn ritme section lain di situs.
import Link from 'next/link'
import { MapPinIcon } from '@phosphor-icons/react/ssr'
import { RevealWrapper } from '@/components/animations/RevealWrapper'
import { SectionDivider } from '@/components/decorative/SectionDivider'

interface GMapsEmbedProps {
  embedUrl: string
  address: string
}

export function GMapsEmbed({ embedUrl, address }: GMapsEmbedProps) {
  const isValid = embedUrl?.startsWith('https://www.google.com/maps/embed')

  return (
    <>
    <section className="bg-salt-50 px-4 py-14 md:py-20">
      <div className="mx-auto max-w-6xl">
        <RevealWrapper>
          <p className="rule-index font-ui text-brand-teal-600">Kunjungi Kami</p>
          <h2 className="mt-3 font-ui text-2xl font-semibold text-ink-700 md:text-3xl">
            Lokasi Kantor <span className="italic font-medium text-brand-teal-600">Kami</span>
          </h2>
          <p className="mt-2 text-neutral-600">Kunjungi kami di kantor pusat Surabaya.</p>
        </RevealWrapper>

        <RevealWrapper variant="reveal-up" delay={80}>
          <div className="mt-6 aspect-video overflow-hidden rounded-2xl border border-ink-900/10 shadow-sm md:aspect-[16/7]">
            {isValid ? (
              <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                title="Peta lokasi kantor CV Reka Cipta Indonesia"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-white px-4 text-center">
                <MapPinIcon size={48} weight="duotone" className="text-brand-teal-600" aria-hidden="true" />
                <p className="max-w-md text-pretty text-neutral-700">{address}</p>
                <Link
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-ui rounded-xl inline-flex items-center gap-2 bg-brand-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal-500"
                >
                  Buka di Google Maps
                </Link>
              </div>
            )}
          </div>
        </RevealWrapper>
      </div>
    </section>
    <SectionDivider variant="wave" fromClassName="fill-salt-50" toClassName="bg-ink-900" />
    </>
  )
}
