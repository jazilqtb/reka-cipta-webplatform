// components/sections/CompanyTimeline.tsx
// RONDE Tahap 7 (2026-08) — "samakan DNA desain /tentang-kami": heading
// pakai pola eyebrow + aksen italic yg sama dgn seluruh situs, node
// tahun pakai mono-tech (angka), hover-scale pada node (konsisten dgn
// micro-interaction ikon di section lain). Struktur timeline (garis
// putus-putus + horizontal desktop/vertikal mobile) TIDAK diubah — sudah
// berfungsi baik, bukan bagian dari keluhan manapun.
import type { TimelineEntry } from '@/lib/data/about'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

export function CompanyTimeline({ timeline }: { timeline: TimelineEntry[] }) {
  return (
    <section className="bg-white px-4 py-14 md:py-20">
      <div className="mx-auto max-w-5xl">
        <RevealWrapper variant="reveal-up">
          <div className="mb-12 text-center md:mb-16">
            <p className="rule-index font-ui justify-center text-brand-teal-600">Sejarah</p>
            <h2 className="mt-3 font-ui text-2xl font-semibold text-ink-700 md:text-3xl">
              Perjalanan <span className="font-medium text-brand-teal-600">Kami</span>
            </h2>
          </div>
        </RevealWrapper>

        {/* DESKTOP — geser horizontal, bukan grid tetap.
            Dulu `grid-cols-3`: jumlah kolomnya dipatok ke jumlah entri yang
            KEBETULAN ada tiga. Begitu admin menambah entri keempat (dan CP4
            justru membuat itu mungkin), kolomnya menyempit terus sampai
            tidak terbaca. Deret geser tumbuh tanpa batas dan memakai pola
            yang sama dengan seluruh situs (DESIGN-SYSTEM §4.1).

            TANPA auto-advance. Instruksi menyebut "geser horizontal
            otomatis", tapi auto-play tak berhingga dilarang motion policy
            §7 dan pengecualian yang disahkan hanya untuk logo mitra (§7.1).
            Timeline BERISI teks yang harus dibaca — persis kategori yang
            tidak boleh bergerak sendiri. Jadi: geser manual + snap. */}
        <div className="relative hidden md:block">
          <div className="carousel-row gap-8 pt-2" role="list">
            {timeline.map((milestone) => (
              <div key={milestone.id} role="listitem" className="w-[280px] shrink-0">
                <div className="group flex flex-col items-center text-center">
                  <div className="mono-tech relative z-10 mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-teal-600 text-sm font-semibold text-white">
                    {milestone.year}
                  </div>
                  <h3 className="font-ui mb-2 font-semibold text-ink-700">{milestone.title}</h3>
                  <p className="text-sm leading-relaxed text-neutral-600">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PONSEL — vertikal.
            Dulu wadahnya `pl-8` dengan lencana tahun di `-left-11`, jadi
            tepi kiri lencana jatuh di 16 + 32 - 44 = 4px dari tepi layar —
            praktis menempel, dan tidak sejajar dengan apa pun di halaman.
            Sekarang lencana ditaruh di `left-0` dan teksnya yang diberi
            `pl-14`, sehingga lencana sejajar tepat dengan gutter 16px yang
            dipakai judul section. */}
        <div className="relative md:hidden">
          <div className="absolute bottom-0 left-5 top-0 w-px bg-ink-900/10" aria-hidden="true" />

          <div className="space-y-10">
            {timeline.map((milestone, index) => (
              <RevealWrapper key={milestone.id} variant="reveal-up" delay={index * 60}>
                <div className="relative pl-14">
                  <div className="mono-tech absolute left-0 top-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-teal-600 text-xs font-semibold text-white">
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
