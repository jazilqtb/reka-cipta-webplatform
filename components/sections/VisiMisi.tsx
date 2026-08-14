// components/sections/VisiMisi.tsx
// RONDE Tahap 7 (2026-08) — "samakan DNA desain /tentang-kami": heading
// eyebrow + aksen italic, ikon Lucide (CheckCircle) → Phosphor duotone,
// section bg-neutral-50 generik → bg-salt-50 (palet mineral yg sama
// dipakai seluruh situs, bukan neutral-50 default Tailwind).
import { CheckCircleIcon } from '@phosphor-icons/react/ssr'
import { COMPANY_VISION, COMPANY_MISSION } from '@/constants/company-profile'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

export function VisiMisi() {
  return (
    <section className="bg-salt-50 px-4 py-14 md:py-20">
      <div className="mx-auto max-w-5xl">
        <RevealWrapper variant="reveal-up">
          <div className="mb-12 text-center">
            <p className="rule-index font-ui justify-center text-brand-teal-600">Identitas</p>
            <h2 className="mt-3 font-ui text-2xl font-semibold text-ink-700 md:text-3xl">
              Visi &amp; <span className="italic font-medium text-brand-teal-600">Misi</span>
            </h2>
          </div>
        </RevealWrapper>

        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-12">
          {/* Visi */}
          <RevealWrapper variant="reveal-left">
            <div className="h-full rounded-2xl bg-brand-teal-50 p-8">
              <p className="rule-index font-ui text-brand-teal-600">Visi</p>
              <span className="mt-4 block font-display text-5xl leading-none text-brand-teal-600" aria-hidden="true">❝</span>
              <p className="mt-4 text-pretty text-xl italic leading-relaxed text-ink-700">{COMPANY_VISION}</p>
            </div>
          </RevealWrapper>

          {/* Misi */}
          <RevealWrapper variant="reveal-right">
            <div className="h-full rounded-2xl border border-ink-900/10 bg-white p-8">
              <p className="rule-index font-ui text-brand-teal-600">Misi Kami</p>
              <ul className="mt-6 space-y-5">
                {COMPANY_MISSION.map((point, index) => (
                  <li key={index} className="group flex gap-3">
                    <CheckCircleIcon
                      size={20}
                      weight="duotone"
                      className="mt-0.5 shrink-0 text-brand-teal-600 transition-transform duration-300 group-hover:scale-110"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-ui text-sm font-semibold text-ink-700">{point.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-neutral-600">{point.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </RevealWrapper>
        </div>
      </div>
    </section>
  )
}
