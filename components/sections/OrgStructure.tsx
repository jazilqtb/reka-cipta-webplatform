// components/sections/OrgStructure.tsx
// RONDE Tahap 7 (2026-08) — "samakan DNA desain /tentang-kami": heading
// eyebrow + aksen italic, sisanya (grid foto tim) lihat perubahan di
// TeamMember.tsx.
import type { TeamEntry } from '@/lib/data/about'
import { TeamMember } from '@/components/blocks/TeamMember'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

export function OrgStructure({ team }: { team: TeamEntry[] }) {
  return (
    <section className="bg-white px-4 py-14 md:py-20">
      <div className="mx-auto max-w-5xl">
        <RevealWrapper variant="reveal-up">
          <div className="mb-12 text-center">
            <p className="rule-index font-ui justify-center text-brand-teal-600">Orang-Orang di Baliknya</p>
            <h2 className="mt-3 font-ui text-2xl font-semibold text-ink-700 md:text-3xl">
              Tim <span className="font-medium text-brand-teal-600">Kami</span>
            </h2>
          </div>
        </RevealWrapper>

        {/* grid-cols-4 di desktop tetap, tapi kini tumbuh ke baris kedua
            saat anggota bertambah — sebelumnya jumlah kolomnya kebetulan
            sama dengan jumlah anggota. */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {team.map((member, index) => (
            <RevealWrapper key={member.id} variant="reveal-up" delay={index * 60}>
              <TeamMember member={member} />
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
