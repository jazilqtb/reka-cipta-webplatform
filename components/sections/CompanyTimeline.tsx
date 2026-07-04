import { COMPANY_TIMELINE } from '@/constants/company-profile'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

export function CompanyTimeline() {
  return (
    <section className="py-16 md:py-24 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <RevealWrapper variant="reveal-up">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-xs font-semibold tracking-widest text-brand-teal-600 uppercase mb-2">Sejarah</p>
            <h2 className="text-3xl font-bold text-ink-700">Perjalanan Kami</h2>
          </div>
        </RevealWrapper>

        {/* Desktop: horizontal timeline */}
        <div className="hidden md:block relative">
          {/* Garis penghubung */}
          <div className="absolute top-6 left-0 right-0 h-0.5 border-t-2 border-dashed border-brand-teal-200" aria-hidden="true" />

          <div className="grid grid-cols-3 gap-8">
            {COMPANY_TIMELINE.map((milestone, index) => (
              <RevealWrapper key={milestone.year} variant="reveal-left" delay={index * 200}>
                <div className="flex flex-col items-center text-center pt-0">
                  {/* Node */}
                  <div className="w-12 h-12 rounded-full bg-brand-teal-600 text-white font-bold text-sm flex items-center justify-center shrink-0 relative z-10 mb-4">
                    {milestone.year}
                  </div>
                  <h3 className="font-semibold text-ink-700 mb-2">{milestone.title}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{milestone.description}</p>
                </div>
              </RevealWrapper>
            ))}
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="md:hidden relative pl-8">
          {/* Garis vertikal */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-brand-teal-200" aria-hidden="true" />

          <div className="space-y-10">
            {COMPANY_TIMELINE.map((milestone, index) => (
              <RevealWrapper key={milestone.year} variant="reveal-left" delay={index * 200}>
                <div className="relative">
                  {/* Node */}
                  <div className="absolute -left-11 top-0 w-10 h-10 rounded-full bg-brand-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {milestone.year}
                  </div>
                  <h3 className="font-semibold text-ink-700 mb-1">{milestone.title}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{milestone.description}</p>
                </div>
              </RevealWrapper>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
