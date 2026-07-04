import { TEAM_MEMBERS } from '@/constants/company-profile'
import { TeamMember } from '@/components/blocks/TeamMember'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

export function OrgStructure() {
  return (
    <section className="py-16 md:py-24 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <RevealWrapper variant="reveal-up">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-brand-teal-600 uppercase mb-2">Orang-Orang di Baliknya</p>
            <h2 className="text-3xl font-bold text-ink-700">Tim Kami</h2>
          </div>
        </RevealWrapper>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
