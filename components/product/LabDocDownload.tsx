import { FileText, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

interface LabDocDownloadProps {
  url: string | null
  productName: string
}

export function LabDocDownload({ url, productName }: LabDocDownloadProps) {
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-brand-teal-600" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-ink-700">Dokumen Hasil Uji Laboratorium</h3>
              <p className="text-sm text-neutral-600">
                Data teknis lengkap {productName} dalam format PDF
              </p>
            </div>
          </div>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'default' }))}
            >
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              Unduh PDF
            </a>
          ) : (
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Dokumen sedang diperbarui"
              className={cn(buttonVariants({ variant: 'outline' }), 'cursor-not-allowed opacity-60')}
            >
              Segera tersedia
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
