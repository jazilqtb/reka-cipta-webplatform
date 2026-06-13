// components/sections/CredibilitySection.tsx
// Epic 2 Slice 1 (E2-S1-FE-07) — Wireframe v1.0 §6.
//
// Server Component. Marquee infinite scroll via CSS keyframes
// (lihat globals.css .marquee-track). Tidak butuh Framer Motion
// — animasi CSS lebih efisien utk loop kontinyu.
//
// A11y: marquee dianggap dekoratif (role region + aria-label).
// Untuk screen reader: <ul className="sr-only"> berisi daftar
// statis yg sama (progressive enhancement — SR baca daftar
// tenang, sighted user lihat marquee).
//
// Reduced motion: globals.css menonaktifkan animasi & ubah
// flex jadi wrap (5 item tampil sbg grid statis).

import { ACTIVE_CLIENTS } from '@/constants/clients'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

// Duplicate array → seamless loop (CSS translateX(-50%) bekerja
// karena konten = 2× isi aslinya, transisi balik tidak terlihat)
const MARQUEE_ITEMS = [...ACTIVE_CLIENTS, ...ACTIVE_CLIENTS]

export function CredibilitySection() {
  return (
    <section
      className="overflow-hidden bg-white py-16 md:py-20"
      aria-labelledby="credibility-heading"
    >
      <div className="mx-auto max-w-7xl px-4">
        {/* Heading */}
        <RevealWrapper>
          <div className="mb-10 text-center md:mb-14">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-teal-600">
              Dipercaya Oleh
            </p>
            <h2 id="credibility-heading" className="text-3xl font-bold text-ink-700 md:text-4xl">
              Mitra Distribusi Aktif Kami
            </h2>
          </div>
        </RevealWrapper>

        {/* Daftar accessible utk screen reader — disembunyikan visual */}
        <ul className="sr-only">
          <li>Perusahaan-perusahaan yang menjadi mitra distribusi aktif:</li>
          {ACTIVE_CLIENTS.map((c) => (
            <li key={c.name}>
              {c.name} — {c.industry}
            </li>
          ))}
        </ul>

        {/* Marquee container — sighted user */}
        <div
          className="relative"
          role="region"
          aria-label="Daftar mitra distribusi aktif (animasi bergerak)"
          aria-hidden="true"
        >
          {/* Gradient fade kiri */}
          <div
            className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-white to-transparent md:w-24"
            aria-hidden="true"
          />
          {/* Gradient fade kanan */}
          <div
            className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-white to-transparent md:w-24"
            aria-hidden="true"
          />

          {/* Marquee track */}
          <div className="marquee-track">
            {MARQUEE_ITEMS.map((client, i) => (
              <div
                key={`${client.name}-${i}`}
                className="flex shrink-0 flex-col gap-1 rounded-xl border border-neutral-100 bg-white px-6 py-4 shadow-sm"
                style={{ minWidth: '240px' }}
              >
                <p className="font-semibold text-ink-700">{client.name}</p>
                <p className="text-sm text-neutral-700">{client.industry}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Kalimat penutup */}
        <p className="mt-10 text-center text-sm text-neutral-700 md:mt-14">
          Bergabunglah dengan {ACTIVE_CLIENTS.length}+ mitra industri yang
          mempercayakan kebutuhan garam mereka kepada kami.
        </p>
      </div>
    </section>
  )
}
