// components/sections/CompanyTimeline.tsx
// RONDE Tahap 7 (2026-08) — "samakan DNA desain /tentang-kami": heading
// pakai pola eyebrow + aksen italic yg sama dgn seluruh situs, node
// tahun pakai mono-tech (angka), hover-scale pada node (konsisten dgn
// micro-interaction ikon di section lain). Struktur timeline (garis
// putus-putus + horizontal desktop/vertikal mobile) TIDAK diubah — sudah
// berfungsi baik, bukan bagian dari keluhan manapun.
import { COMPANY_TIMELINE } from '@/constants/company-profile'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

export function CompanyTimeline() {
  return (
    <section className="bg-white px-4 py-14 md:py-20">
      <div className="mx-auto max-w-5xl">
        <RevealWrapper variant="reveal-up">
          <div className="mb-12 text-center md:mb-16">
            <p className="rule-index font-ui justify-center text-brand-teal-600">Sejarah</p>
            <h2 className="mt-3 font-ui text-2xl font-semibold text-ink-700 md:text-3xl">
              Perjalanan <span className="italic font-medium text-brand-teal-600">Kami</span>
            </h2>
          </div>
        </RevealWrapper>

        {/* Desktop: horizontal timeline */}
        <div className="relative hidden md:block">
          <div className="absolute left-0 right-0 top-6 h-0.5 border-t-2 border-dashed border-brand-teal-200" aria-hidden="true" />

          <div className="grid grid-cols-3 gap-8">
            {COMPANY_TIMELINE.map((milestone, index) => (
              <RevealWrapper key={milestone.year} variant="reveal-left" delay={index * 150}>
                <div className="group flex flex-col items-center pt-0 text-center">
                  <div className="mono-tech relative z-10 mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-teal-600 text-sm font-bold text-white transition-transform duration-300 group-hover:scale-110">
                    {milestone.year}
                  </div>
                  <h3 className="font-ui mb-2 font-semibold text-ink-700">{milestone.title}</h3>
                  <p className="text-sm leading-relaxed text-neutral-600">{milestone.description}</p>
                </div>
              </RevealWrapper>
            ))}
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="relative pl-8 md:hidden">
          <div className="absolute bottom-0 left-3 top-0 w-0.5 border-l-2 border-dashed border-brand-teal-200" aria-hidden="true" />

          <div className="space-y-10">
            {COMPANY_TIMELINE.map((milestone, index) => (
              <RevealWrapper key={milestone.year} variant="reveal-left" delay={index * 150}>
                <div className="relative">
                  <div className="mono-tech absolute -left-11 top-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-teal-600 text-xs font-bold text-white">
                    {milestone.year}
                  </div>
                  <h3 className="font-ui mb-1 font-semibold text-ink-700">{milestone.title}</h3>
                  <p className="text-sm leading-relaxed text-neutral-600">{milestone.description}</p>
                </div>
              </RevealWrapper>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
