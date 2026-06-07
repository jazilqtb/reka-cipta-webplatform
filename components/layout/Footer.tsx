import Link from 'next/link'
import { MapPin, MessageCircle, Mail, BadgeCheck, Shield } from 'lucide-react'
import { NAV_ITEMS, SUPPLIER_LINK, CTA_LINK, COMPANY_INFO } from '@/constants/navigation'

export function Footer() {
  return (
    <footer className="bg-ink-900 text-ink-200" role="contentinfo">
      <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12">

          {/* ── Kolom 1: Brand ── */}
          <div className="space-y-4">
            {/* Logo placeholder */}
            <Link href="/" className="flex items-center gap-2.5 w-fit focus-visible:outline-none rounded-md">
              <div className="h-9 w-9 rounded-lg bg-brand-teal-600 flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold">RC</span>
              </div>
              <span className="text-base font-bold text-white">Reka Cipta</span>
            </Link>

            <p className="text-sm leading-relaxed text-ink-300 max-w-[280px]">
              {COMPANY_INFO.description}
            </p>

            <p className="text-xs font-semibold uppercase tracking-wider text-brand-teal-400">
              {COMPANY_INFO.tagline}
            </p>
          </div>

          {/* ── Kolom 2: Navigasi ── */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">
              Navigasi
            </h3>
            <ul className="space-y-2.5" role="list">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-ink-200 hover:text-brand-teal-400 transition-colors duration-150 focus-visible:outline-none rounded"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={CTA_LINK.href}
                  className="text-sm text-brand-teal-400 font-medium hover:text-brand-teal-300 transition-colors duration-150 focus-visible:outline-none rounded"
                >
                  {CTA_LINK.label}
                </Link>
              </li>
              <li>
                <Link
                  href={SUPPLIER_LINK.href}
                  className="text-sm text-sand-400 hover:text-sand-300 transition-colors duration-150 focus-visible:outline-none rounded"
                >
                  {SUPPLIER_LINK.label}
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Kolom 3: Kontak ── */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">
              Hubungi Kami
            </h3>
            <ul className="space-y-3" role="list">
              {/* Alamat */}
              <li className="flex items-start gap-2.5">
                <MapPin size={16} aria-hidden="true" className="text-ink-400 mt-0.5 shrink-0" />
                <span className="text-sm text-ink-200 leading-relaxed">
                  {COMPANY_INFO.address.street},<br />
                  {COMPANY_INFO.address.district},<br />
                  {COMPANY_INFO.address.city}
                </span>
              </li>

              {/* WhatsApp 1 */}
              <li>
                <a
                  href={COMPANY_INFO.contacts.wa1.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-ink-200 hover:text-brand-teal-400 transition-colors duration-150"
                >
                  <MessageCircle size={16} aria-hidden="true" className="text-ink-400 shrink-0" />
                  {COMPANY_INFO.contacts.wa1.display}
                  <span className="text-[10px] text-ink-400 bg-white/5 rounded-full px-2 py-0.5">
                    {COMPANY_INFO.contacts.wa1.label}
                  </span>
                </a>
              </li>

              {/* WhatsApp 2 */}
              <li>
                <a
                  href={COMPANY_INFO.contacts.wa2.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-ink-200 hover:text-brand-teal-400 transition-colors duration-150"
                >
                  <MessageCircle size={16} aria-hidden="true" className="text-ink-400 shrink-0" />
                  {COMPANY_INFO.contacts.wa2.display}
                  <span className="text-[10px] text-ink-400 bg-white/5 rounded-full px-2 py-0.5">
                    {COMPANY_INFO.contacts.wa2.label}
                  </span>
                </a>
              </li>

              {/* Email */}
              <li>
                <a
                  href={`mailto:${COMPANY_INFO.contacts.email}`}
                  className="flex items-center gap-2.5 text-sm text-ink-200 hover:text-brand-teal-400 transition-colors duration-150"
                >
                  <Mail size={16} aria-hidden="true" className="text-ink-400 shrink-0" />
                  {COMPANY_INFO.contacts.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Badges */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-semibold text-ink-200">
              <BadgeCheck size={14} aria-hidden="true" className="text-brand-teal-400" />
              Tersertifikasi SNI
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-semibold text-ink-200">
              <Shield size={14} aria-hidden="true" className="text-brand-teal-400" />
              NIB {COMPANY_INFO.legal.nib}
            </span>
          </div>

          {/* Copyright */}
          <p className="text-xs text-ink-400 text-center md:text-right">
            © {COMPANY_INFO.legal.year} {COMPANY_INFO.name}. Hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  )
}
