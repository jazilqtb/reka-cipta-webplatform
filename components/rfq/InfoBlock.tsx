// components/rfq/InfoBlock.tsx
// Epic 4 Customer-Facing (E4-CF-FE-04) — Info panel di atas submit button RFQForm.
// Dipakai bersama oleh RFQForm dan SupplierRegistrationForm.
//
// RONDE Tahap 11 (2026-08) — Design System Rollout: ikon Lucide →
// Phosphor duotone, panel diberi border tipis beraksen teal (pola sama
// dgn callout LabDocDownload di /produk/[slug]).

import { InfoIcon } from '@phosphor-icons/react/ssr'

interface InfoBlockProps {
  children: React.ReactNode
}

export function InfoBlock({ children }: InfoBlockProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-brand-teal-600/15 bg-brand-teal-50 p-4 text-sm text-ink-700">
      <InfoIcon size={20} weight="duotone" className="mt-0.5 shrink-0 text-brand-teal-600" aria-hidden="true" />
      <p className="text-pretty leading-relaxed">{children}</p>
    </div>
  )
}
