import { getIndustryIcon } from '@/lib/product-industry-icons'

interface IndustryListProps {
  industries: string[]
}

export function IndustryList({ industries }: IndustryListProps) {
  if (industries.length === 0) return null

  return (
    <section className="container mx-auto px-4 py-8">
      <h2 className="mb-6 text-2xl font-semibold text-ink-700">Kegunaan per Industri</h2>
      <ul className="flex flex-wrap gap-3">
        {industries.map((industry) => {
          const Icon = getIndustryIcon(industry)
          return (
            <li
              key={industry}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-ink-700"
            >
              <Icon className="h-4 w-4 text-brand-teal-600" aria-hidden="true" />
              {industry}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
