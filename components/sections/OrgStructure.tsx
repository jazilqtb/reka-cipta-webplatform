// components/sections/OrgStructure.tsx
// RONDE Tahap 7 (2026-08) — "samakan DNA desain /tentang-kami": heading
// eyebrow + aksen italic, sisanya (grid foto tim) lihat perubahan di
// TeamMember.tsx.
import { TEAM_MEMBERS } from '@/constants/company-profile'
import { TeamMember } from '@/components/blocks/TeamMember'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

export function OrgStructure() {
  return (
    <section className="bg-white px-4 py-14 md:py-20">
      <div className="mx-auto max-w-5xl">
        <RevealWrapper variant="reveal-up">
          <div className="mb-12 text-center">
            <p className="rule-index font-ui justify-center text-brand-teal-600">Orang-Orang di Baliknya</p>
            <h2 className="mt-3 font-ui text-2xl font-semibold text-ink-700 md:text-3xl">
              Tim <span className="italic font-medium text-brand-teal-600">Kami</span>
            </h2>
          </div>
        </RevealWrapper>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {TEAM_MEMBERS.map((member, index) => (
            <RevealWrapper key={member.name} variant="reveal-scale" delay={index * 100}>
              <TeamMember member={member} />
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
