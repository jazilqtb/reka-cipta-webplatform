// components/sections/VisiMisi.tsx
// RONDE Tahap 7 (2026-08) — "samakan DNA desain /tentang-kami": heading
// eyebrow + aksen italic, ikon Lucide (CheckCircle) → Phosphor duotone,
// section bg-neutral-50 generik → bg-salt-50 (palet mineral yg sama
// dipakai seluruh situs, bukan neutral-50 default Tailwind).
import { RevealWrapper } from '@/components/animations/RevealWrapper'
import { Accordion } from '@/components/brand/Accordion'
import type { MissionEntry } from '@/lib/data/about'

interface VisiMisiProps {
  vision: string
  mission: MissionEntry[]
}

export function VisiMisi({ vision, mission }: VisiMisiProps) {
  return (
    <section className="bg-salt-50 px-4 py-14 md:py-20">
      <div className="mx-auto max-w-5xl">
        <RevealWrapper variant="reveal-up">
          <div className="mb-12 text-center">
            <p className="rule-index font-ui justify-center text-brand-teal-600">Identitas</p>
            <h2 className="mt-3 font-ui text-2xl font-semibold text-ink-700 md:text-3xl">
              Visi &amp; <span className="font-medium text-brand-teal-600">Misi</span>
            </h2>
          </div>
        </RevealWrapper>

        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-12">
          {/* Visi */}
          <RevealWrapper variant="reveal-left">
            <div className="h-full rounded-2xl bg-brand-teal-50 p-8">
              <p className="rule-index font-ui text-brand-teal-600">Visi</p>
              <span className="mt-4 block font-display text-5xl leading-none text-brand-teal-600" aria-hidden="true">❝</span>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-ink-700 md:text-xl">{vision}</p>
            </div>
          </RevealWrapper>

          {/* Misi */}
          <RevealWrapper variant="reveal-right">
            <div className="h-full rounded-2xl border border-ink-900/10 bg-white p-8">
              <p className="rule-index font-ui text-brand-teal-600">Misi Kami</p>
              {/* ACCORDION (CP4). Dulu kelima poin misi tampil terbuka
                  sekaligus — lima judul plus lima paragraf, dan yang
                  terjadi bukan "dibaca semua" melainkan "tidak dibaca satu
                  pun". Judulnya sendiri sudah menyampaikan isi misi; uraian
                  adalah bacaan lanjutan bagi yang benar-benar ingin tahu.
                  Poin pertama dibiarkan terbuka supaya bagian ini tidak
                  terbaca sebagai daftar judul kosong. */}
              <Accordion
                className="mt-4"
                items={mission.map((m) => ({ id: m.id, title: m.title, body: m.description }))}
              />
            </div>
          </RevealWrapper>
        </div>
      </div>
    </section>
  )
}
