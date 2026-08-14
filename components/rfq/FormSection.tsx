// components/rfq/FormSection.tsx
// Epic 4 Customer-Facing (E4-CF-FE-04) — Wrapper section berjudul untuk RFQForm.
// Dipakai bersama oleh RFQForm dan SupplierRegistrationForm.
//
// RONDE Tahap 11 (2026-08) — Design System Rollout (T4/T7): border
// neutral-200 → ink-900/10 + shadow-sm (bahasa panel situs), judul
// pindah ke font-ui. <legend> diganti <p> di dalam fieldset supaya
// judul bisa diberi jarak & tipografi yang konsisten — <legend> punya
// perilaku posisi bawaan browser yang sulit distandarkan lintas-mesin.

interface FormSectionProps {
  title: string
  children: React.ReactNode
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <fieldset className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm md:p-8">
      <legend className="sr-only">{title}</legend>
      <p aria-hidden="true" className="font-ui text-lg font-semibold text-ink-700">
        {title}
      </p>
      <div className="mt-5 space-y-5">{children}</div>
    </fieldset>
  )
}
