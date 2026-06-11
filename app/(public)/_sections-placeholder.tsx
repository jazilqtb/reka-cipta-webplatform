// app/(public)/_sections-placeholder.tsx
// ════════════════════════════════════════════════════════════
// FILE SEMENTARA — Fase 5 (E2-S1-FE-01)
// Placeholder visual untuk 7 section Beranda. Setiap placeholder
// diganti komponen asli di Fase 6–7, file ini DIHAPUS di Fase 8
// (E2-S1-FE-09) setelah semua section asli terpasang.
//
// Tujuan: memverifikasi data pipeline (DB → Server Component →
// props) end-to-end SEKARANG, sebelum komponen visual dibangun.
// ════════════════════════════════════════════════════════════
import type { CompanySettingsMap } from '@/types/api'

function PlaceholderShell({
  name,
  phase,
  children,
}: {
  name: string
  phase: string
  children?: React.ReactNode
}) {
  return (
    <section className="border-y border-dashed border-neutral-300 bg-neutral-50 px-4 py-16">
      <div className="mx-auto max-w-5xl text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
          [placeholder — diganti di {phase}]
        </p>
        <h2 className="mt-2 text-2xl font-bold text-ink-700">{name}</h2>
        {children}
      </div>
    </section>
  )
}

export function HeroPlaceholder() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center bg-brand-teal-50 px-4 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
        [placeholder — diganti di Fase 6 · FE-02]
      </p>
      <h1 className="mt-3 max-w-3xl text-4xl font-bold text-ink-900">
        Mitra Distribusi Garam SNI Anda: Transparan, Cepat, dan Terverifikasi
      </h1>
    </section>
  )
}

export function StatsBarPlaceholder({ settings }: { settings: CompanySettingsMap }) {
  // PENTING: placeholder ini sudah membaca props `settings` asli —
  // memverifikasi data pipeline DB → page → komponen berjalan.
  const stats = [
    { label: 'Jenis Garam', value: '5' },
    { label: 'Mitra Aktif', value: settings.partner_count ?? '?' },
    { label: 'Kota Dilayani', value: settings.cities_served ?? '?' },
    { label: 'Distribusi (TON)', value: settings.total_distribution_tons ?? '?' },
  ]
  return (
    <PlaceholderShell name="Stats Bar" phase="Fase 6 · FE-03">
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-4">
            <p className="text-4xl font-extrabold text-brand-teal-600">{s.value}</p>
            <p className="mt-1 text-sm text-neutral-500">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 font-mono text-xs text-neutral-400">
        ↑ nilai di atas dari company_settings (DB) — bukti pipeline hidup
      </p>
    </PlaceholderShell>
  )
}

export function ProductsPreviewPlaceholder() {
  return <PlaceholderShell name="Products Preview (5 kartu)" phase="Fase 7 · FE-04" />
}

export function HowItWorksPlaceholder() {
  return <PlaceholderShell name="Cara Kami Bekerja (scroll-driven)" phase="Fase 7 · FE-05" />
}

export function IndustriesGridPlaceholder() {
  return <PlaceholderShell name="Industri yang Kami Layani (6 sektor)" phase="Fase 7 · FE-06" />
}

export function CredibilityPlaceholder({ settings }: { settings: CompanySettingsMap }) {
  return (
    <PlaceholderShell name="Credibility Marquee" phase="Fase 7 · FE-07">
      <p className="mt-3 text-sm text-neutral-500">
        client_list dari DB: {settings.client_list ?? '(kosong)'}
      </p>
    </PlaceholderShell>
  )
}

export function CTAPlaceholder() {
  return <PlaceholderShell name="CTA Penutup" phase="Fase 7 · FE-08" />
}
