// components/sections/ContactInfo.tsx
// Epic 2 Slice 3 (E2-S3-FE-02) — Info alamat, email, jam operasional.
// Server Component — data via props dari page.tsx.
//
// RONDE Tahap 10 (2026-08) — "samakan DNA desain /kontak": ikon Lucide
// → Phosphor duotone, tipografi H2 → font-ui.

import { MapPinIcon, EnvelopeSimpleIcon, ClockIcon } from '@phosphor-icons/react/ssr'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

interface ContactInfoProps {
  address: string
  email: string
}

export function ContactInfo({ address, email }: ContactInfoProps) {
  return (
    <RevealWrapper variant="reveal-left">
      <div>
        <h2 className="font-ui text-2xl font-semibold text-ink-700">Informasi Kontak</h2>

        <ul className="mt-6 space-y-5">
          <li className="flex items-start gap-3">
            <MapPinIcon size={20} weight="duotone" className="mt-0.5 shrink-0 text-brand-teal-600" aria-hidden="true" />
            <span className="text-pretty text-neutral-700">{address}</span>
          </li>
          <li className="flex items-start gap-3">
            <EnvelopeSimpleIcon size={20} weight="duotone" className="mt-0.5 shrink-0 text-brand-teal-600" aria-hidden="true" />
            <a href={`mailto:${email}`} className="link-animated text-neutral-700">
              {email}
            </a>
          </li>
          <li className="flex items-start gap-3">
            <ClockIcon size={20} weight="duotone" className="mt-0.5 shrink-0 text-brand-teal-600" aria-hidden="true" />
            <span className="text-neutral-700">Senin — Sabtu · 08:00 — 17:00 WIB</span>
          </li>
        </ul>
      </div>
    </RevealWrapper>
  )
}
