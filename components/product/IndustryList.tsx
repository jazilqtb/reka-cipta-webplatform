// components/product/IndustryList.tsx
// RONDE Tahap 6 (2026-08) — "samakan DNA desain /produk/[slug]": pill
// rounded-full border-neutral-200 generik dipertahankan bentuknya (pil
// memang bahasa badge resmi situs — lihat .tag-pill di globals.css)
// tapi diberi hover-lift + ikon Phosphor (lib/product-industry-icons.ts
// sudah dimigrasi ke Phosphor di ronde ini juga), heading pakai pola
// eyebrow + aksen italic yg sama dgn section lain.
import { RevealWrapper } from '@/components/animations/RevealWrapper'
import { getIndustryIcon } from '@/lib/product-industry-icons'

interface IndustryListProps {
  industries: string[]
}

export function IndustryList({ industries }: IndustryListProps) {
  if (industries.length === 0) return null

  return (
    <section className="bg-white px-4 pb-10 md:pb-14">
      <div className="mx-auto max-w-6xl">
        <RevealWrapper>
          <p className="rule-index font-ui text-brand-teal-600">Aplikasi Produk</p>
          <h2 className="mt-3 font-ui text-2xl font-semibold text-ink-700 md:text-3xl">
            Kegunaan per <span className="italic font-medium text-brand-teal-600">Industri</span>
          </h2>
        </RevealWrapper>

        {/* role="list"/"listitem" (bukan <ul>/<li> murni) — RevealWrapper
            selalu render <div> pembungkus, taruh <li> langsung di dalam
            <ul> lewat itu bikin nesting HTML tidak valid (div bukan
            children sah <ul>). ARIA role menjaga semantik list tetap
            terbaca screen reader tanpa nesting bermasalah. */}
        <div role="list" className="mt-6 flex flex-wrap gap-3">
          {industries.map((industry, index) => {
            const Icon = getIndustryIcon(industry)
            return (
              <RevealWrapper key={industry} variant="reveal-up" delay={index * 50} className="inline-block">
                <div role="listitem" className="group inline-flex items-center gap-2 rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm text-ink-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <Icon
                    size={16}
                    weight="duotone"
                    className="text-brand-teal-600 transition-transform duration-300 group-hover:scale-110"
                    aria-hidden="true"
                  />
                  {industry}
                </div>
              </RevealWrapper>
            )
          })}
        </div>
      </div>
    </section>
  )
}
