// components/product/LabDocDownload.tsx
// RONDE Tahap 6 (2026-08) — "samakan DNA desain /produk/[slug]": callout
// rounded-lg border-neutral-200 generik diganti panel rounded-2xl
// beraksen teal, ikon Lucide → Phosphor duotone, tombol download pakai
// bahasa tombol yg sama dgn seluruh situs (rounded-xl, bg-brand-teal-600).
import { DownloadSimpleIcon, FileTextIcon } from '@phosphor-icons/react/ssr'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

interface LabDocDownloadProps {
  url: string | null
  productName: string
}

export function LabDocDownload({ url, productName }: LabDocDownloadProps) {
  return (
    <section className="bg-white px-4 pb-10 md:pb-14">
      <div className="mx-auto max-w-6xl">
        <RevealWrapper>
          <div className="flex flex-col items-start gap-5 rounded-2xl border border-brand-teal-600/15 bg-brand-teal-50/50 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-center gap-4">
              <FileTextIcon size={32} weight="duotone" className="shrink-0 text-brand-teal-600" aria-hidden="true" />
              <div>
                <h3 className="font-ui font-semibold text-ink-700">Dokumen Hasil Uji Laboratorium</h3>
                <p className="mt-0.5 text-sm text-neutral-600">
                  Data teknis lengkap {productName} dalam format PDF
                </p>
              </div>
            </div>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-ui group inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal-500 focus-visible:outline-none focus-visible:shadow-focus"
              >
                <DownloadSimpleIcon
                  size={16}
                  weight="bold"
                  className="transition-transform duration-300 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
                Unduh PDF
              </a>
            ) : (
              <button
                type="button"
                disabled
                aria-disabled="true"
                title="Dokumen sedang diperbarui"
                className="font-ui inline-flex shrink-0 cursor-not-allowed items-center gap-2 rounded-xl border border-ink-900/10 px-4 py-2.5 text-sm font-semibold text-neutral-400"
              >
                Segera Tersedia
              </button>
            )}
          </div>
        </RevealWrapper>
      </div>
    </section>
  )
}
