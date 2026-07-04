'use client'

import { LEGAL_DOCUMENTS } from '@/constants/company-profile'
import { LegalDocCard } from '@/components/blocks/LegalDocCard'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

export function LegalDocsGrid() {
  return (
    <section className="py-16 md:py-24 px-4 bg-neutral-50">
      <div className="max-w-5xl mx-auto">
        <RevealWrapper>
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-brand-teal-600 uppercase mb-2">Legalitas</p>
            <h2 className="text-3xl font-bold text-ink-700">Dokumen Resmi Perusahaan</h2>
            <p className="mt-3 text-neutral-600 max-w-xl mx-auto">
              Seluruh dokumen legalitas tersedia untuk keperluan verifikasi vendor Anda.
            </p>
          </div>
        </RevealWrapper>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {LEGAL_DOCUMENTS.map((doc, index) => (
            <RevealWrapper key={doc.id} variant="reveal-scale" delay={index * 100}>
              <LegalDocCard doc={doc} />
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
