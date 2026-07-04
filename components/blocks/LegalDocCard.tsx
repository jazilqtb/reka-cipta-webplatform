'use client'

import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LegalDocModal } from '@/components/blocks/LegalDocModal'
import type { LegalDocument } from '@/constants/company-profile'

interface LegalDocCardProps {
  doc: LegalDocument
}

export function LegalDocCard({ doc }: LegalDocCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLihat = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/legal-docs/${doc.filename}`)
      if (!res.ok) throw new Error('Gagal mengambil dokumen')
      const data = await res.json()
      setSignedUrl(data.url)
      setIsModalOpen(true)
    } catch {
      setError('Dokumen tidak dapat dimuat. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col items-center gap-3 p-4 border border-neutral-200 rounded-xl bg-white hover:border-brand-teal-200 transition-colors">
        {/* Thumbnail placeholder — ikon FileText */}
        <div className="w-full aspect-[3/4] bg-neutral-100 rounded-lg flex items-center justify-center">
          <FileText className="w-12 h-12 text-neutral-400" aria-hidden="true" />
        </div>

        {/* Info */}
        <div className="text-center">
          <p className="font-semibold text-sm text-ink-700">{doc.title}</p>
          {doc.subtitle && (
            <p className="text-xs text-neutral-500 mt-0.5 mono-tech">{doc.subtitle}</p>
          )}
        </div>

        {/* Error */}
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        {/* CTA */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLihat}
          disabled={isLoading}
          className="w-full"
          aria-label={`Lihat dokumen ${doc.title}`}
        >
          {isLoading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" aria-hidden="true" />Memuat...</>
          ) : (
            'Lihat'
          )}
        </Button>
      </div>

      {signedUrl && (
        <LegalDocModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={doc.title}
          signedUrl={signedUrl}
          filename={doc.filename}
        />
      )}
    </>
  )
}
