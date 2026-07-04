// components/sections/ContactInfo.tsx
// Epic 2 Slice 3 (E2-S3-FE-02) — Info alamat, email, jam operasional.
// Server Component — data via props dari page.tsx.

import { MapPin, Mail, Clock } from 'lucide-react'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

interface ContactInfoProps {
  address: string
  email: string
}

export function ContactInfo({ address, email }: ContactInfoProps) {
  return (
    <RevealWrapper variant="reveal-left">
      <div>
        <h2 className="text-3xl font-bold text-ink-700">Informasi Kontak</h2>

        <ul className="mt-6 space-y-5">
          <li className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-brand-teal-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-neutral-700">{address}</span>
          </li>
          <li className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-brand-teal-600 shrink-0 mt-0.5" aria-hidden="true" />
            <a href={`mailto:${email}`} className="text-neutral-700 link-animated">
              {email}
            </a>
          </li>
          <li className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-brand-teal-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-neutral-700">Senin — Sabtu · 08:00 — 17:00 WIB</span>
          </li>
        </ul>
      </div>
    </RevealWrapper>
  )
}
