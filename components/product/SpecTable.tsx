// components/product/SpecTable.tsx
// RONDE Tahap 6 (2026-08) — "samakan DNA desain /produk/[slug]": tabel
// rounded-lg border-neutral-200 generik diganti panel-card rounded-2xl,
// heading pakai pola eyebrow + aksen italic yg SAMA dgn tiap H2 di
// Beranda/katalog, kolom "Nilai" pakai mono-tech (angka lab — konsisten
// dgn cara nomor uji lab ditampilkan di seluruh situs).
import { RevealWrapper } from '@/components/animations/RevealWrapper'
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
    <section className="bg-white px-4 py-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <RevealWrapper>
          <p className="rule-index font-ui text-brand-teal-600">Data Teknis</p>
          <h2 className="mt-3 font-ui text-2xl font-semibold text-ink-700 md:text-3xl">
            Spesifikasi <span className="font-medium text-brand-teal-600">Teknis</span>
          </h2>
        </RevealWrapper>

        <RevealWrapper variant="reveal-up" delay={80}>
          {/* Bukan .panel-card — class itu bawa hover-lift/shadow yg
              didesain utk kartu KLIK (produk/mitra), keliru dipakai di
              tabel statis (menyiratkan interaktif padahal bukan). Cukup
              framing visualnya saja (border + rounded-2xl + shadow tipis). */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-ink-900/10 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-teal-50/60 text-ink-700">
                  <tr>
                    <th className="font-ui px-4 py-3 font-semibold sm:px-6">Parameter</th>
                    <th className="font-ui px-4 py-3 font-semibold sm:px-6">Nilai</th>
                    <th className="font-ui px-4 py-3 font-semibold sm:px-6">Satuan</th>
                    <th className="font-ui hidden px-4 py-3 font-semibold sm:table-cell sm:px-6">Metode / Standar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-900/[0.06]">
                  {entries.map(([key, value]) => {
                    const meta = getSpecLabel(key)
                    return (
                      <tr key={key} className="transition-colors hover:bg-brand-teal-50/30">
                        <td className="font-ui px-4 py-3.5 font-semibold text-ink-700 sm:px-6">{meta.label}</td>
                        <td className="mono-tech px-4 py-3.5 font-bold text-brand-teal-700 sm:px-6">{String(value)}</td>
                        <td className="mono-tech px-4 py-3.5 text-neutral-600 sm:px-6">{meta.unit}</td>
                        <td className="mono-tech hidden px-4 py-3.5 text-neutral-500 sm:table-cell sm:px-6">{meta.method ?? '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </RevealWrapper>
      </div>
    </section>
  )
}
