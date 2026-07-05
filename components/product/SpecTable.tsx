import { getSpecLabel } from '@/lib/product-spec-labels'
import type { ProductSpecs } from '@/types/api'

interface SpecTableProps {
  specs: ProductSpecs
}

export function SpecTable({ specs }: SpecTableProps) {
  const entries = Object.entries(specs).filter(
    ([, value]) => value !== null && value !== undefined && value !== ''
  )

  if (entries.length === 0) return null

  return (
    <section className="container mx-auto px-4 py-8">
      <h2 className="mb-6 text-2xl font-semibold text-ink-700">Spesifikasi Teknis</h2>
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Parameter</th>
              <th className="px-4 py-3 font-semibold">Nilai</th>
              <th className="px-4 py-3 font-semibold">Satuan</th>
              <th className="px-4 py-3 font-semibold">Metode / Standar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {entries.map(([key, value]) => {
              const meta = getSpecLabel(key)
              return (
                <tr key={key}>
                  <td className="px-4 py-3 font-medium text-ink-700">{meta.label}</td>
                  <td className="px-4 py-3 text-neutral-700">{String(value)}</td>
                  <td className="px-4 py-3 text-neutral-700">{meta.unit}</td>
                  <td className="px-4 py-3 text-neutral-500">{meta.method ?? '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
