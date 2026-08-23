import Link from 'next/link'
import { ArrowRightIcon } from '@phosphor-icons/react/ssr'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

export function CompanyIdentitySection() {
  return (
    <section className="bg-white px-4 py-10 md:py-14" aria-labelledby="company-identity-heading">
      <RevealWrapper>
        <div className="mx-auto max-w-2xl text-center">
          <p className="rule-index font-ui justify-center text-brand-teal-600">Profil Perusahaan</p>
          <h2
            id="company-identity-heading"
            className="mt-3 text-balance font-ui text-2xl font-semibold leading-tight text-ink-700 md:text-3xl"
          >
            Mengenal <span className="font-medium text-brand-teal-600">CV Reka Cipta Indonesia</span>
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-neutral-700">
            Resmi berbadan hukum sejak 17 November 2020, kami berkantor di Surabaya, Jawa Timur —
            melanjutkan usaha yang telah berjalan sejak 2019 sebagai UD Kreasi Anak Bangsa.
          </p>
          <Link
            href="/tentang-kami"
            className="link-animated font-ui mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-teal-700 hover:text-brand-teal-600"
          >
            Selengkapnya tentang kami
            <ArrowRightIcon size={14} weight="bold" aria-hidden="true" />
          </Link>
        </div>
      </RevealWrapper>
    </section>
  )
}
