// components/rfq/FormSection.tsx
// Epic 4 Customer-Facing (E4-CF-FE-04) — Wrapper section berjudul untuk RFQForm.

interface FormSectionProps {
  title: string
  children: React.ReactNode
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 md:p-8">
      <legend className="px-1 text-lg font-semibold text-ink-700">{title}</legend>
      <div className="space-y-5">{children}</div>
    </fieldset>
  )
}
