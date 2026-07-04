// components/sections/GMapsEmbed.tsx
// Epic 2 Slice 3 (E2-S3-FE-05) — Iframe Google Maps atau fallback.
// Server Component.
//
// Security: validasi embedUrl HARUS dimulai dari
// 'https://www.google.com/maps/embed' sebelum di-render sebagai iframe
// src — mencegah admin (tidak sengaja atau sengaja) paste URL lain yang
// bisa jadi vector XSS/clickjacking.

import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GMapsEmbedProps {
  embedUrl: string
  address: string
}

export function GMapsEmbed({ embedUrl, address }: GMapsEmbedProps) {
  const isValid = embedUrl?.startsWith('https://www.google.com/maps/embed')

  return (
    <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
      <h2 className="text-3xl font-bold text-ink-700">Lokasi Kantor Kami</h2>
      <p className="mt-2 text-neutral-500">Kunjungi kami di kantor pusat Surabaya.</p>

      <div className="mt-6 aspect-video md:aspect-[16/7] rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
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
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-neutral-50 text-center px-4">
            <MapPin className="w-12 h-12 text-brand-teal-600" aria-hidden="true" />
            <p className="text-neutral-700 max-w-md">{address}</p>
            <Link
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: 'lg' }))}
            >
              Buka di Google Maps
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
