// components/rfq/InfoBlock.tsx
// Epic 4 Customer-Facing (E4-CF-FE-04) — Info panel di atas submit button RFQForm.

import { Info } from 'lucide-react'

interface InfoBlockProps {
  children: React.ReactNode
}

export function InfoBlock({ children }: InfoBlockProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-brand-teal-50 p-4 text-sm text-ink-700">
      <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-teal-600" aria-hidden="true" />
      <p>{children}</p>
    </div>
  )
}
