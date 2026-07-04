import { CheckCircle } from 'lucide-react'
import { COMPANY_VISION, COMPANY_MISSION } from '@/constants/company-profile'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

export function VisiMisi() {
  return (
    <section className="py-16 md:py-24 px-4 bg-neutral-50">
      <div className="max-w-5xl mx-auto">
        <RevealWrapper variant="reveal-up">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-brand-teal-600 uppercase mb-2">Identitas</p>
            <h2 className="text-3xl font-bold text-ink-700">Visi &amp; Misi</h2>
          </div>
        </RevealWrapper>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* Visi */}
          <RevealWrapper variant="reveal-left">
            <div className="bg-brand-teal-50 rounded-2xl p-8 h-full">
              <p className="text-xs font-semibold tracking-widest text-brand-teal-600 uppercase mb-4">Visi</p>
              <span className="block text-5xl font-serif text-brand-teal-600 leading-none mb-4" aria-hidden="true">❝</span>
              <p className="text-xl italic text-ink-700 leading-relaxed">{COMPANY_VISION}</p>
            </div>
          </RevealWrapper>

          {/* Misi */}
          <RevealWrapper variant="reveal-right">
            <div className="bg-white rounded-2xl p-8 border border-neutral-200 h-full">
              <p className="text-xs font-semibold tracking-widest text-brand-teal-600 uppercase mb-6">Misi Kami</p>
              <ul className="space-y-5">
                {COMPANY_MISSION.map((point, index) => (
                  <li key={index} className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-brand-teal-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-ink-700 text-sm">{point.title}</p>
                      <p className="text-sm text-neutral-600 mt-0.5 leading-relaxed">{point.description}</p>
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
