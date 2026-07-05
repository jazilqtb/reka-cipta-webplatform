'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, X, MessageCircle, Mail, ArrowRight, Sprout } from 'lucide-react'
import { NAV_ITEMS, SUPPLIER_LINK, CTA_LINK } from '@/constants/navigation'
import { Logo } from '@/components/brand/Logo'
import { generateWALink } from '@/lib/wa-link'

interface NavbarProps {
  whatsapp1: string
  email: string
}

function isNavActive(href: string, pathname: string, exact: boolean): boolean {
  if (exact) return pathname === href
  return pathname.startsWith(href)
}

export function Navbar({ whatsapp1, email }: NavbarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Scroll detection untuk shadow
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Tutup drawer saat navigasi
  useEffect(() => { setIsOpen(false) }, [pathname])

  // Tutup drawer saat resize ke desktop
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setIsOpen(false) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Escape key tutup drawer
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  // Lock body scroll saat drawer open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Skip link untuk aksesibilitas */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-brand-teal-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:text-sm focus:font-medium"
      >
        Langsung ke konten
      </a>

      <header
        className={[
          'sticky top-0 z-[1000] h-16',
          'bg-white/95 backdrop-blur-sm',
          'border-b transition-all duration-200',
          isScrolled
            ? 'border-neutral-200 shadow-sm'
            : 'border-neutral-100',
        ].join(' ')}
      >
        <nav
          className="mx-auto max-w-[1280px] h-full flex items-center justify-between px-4 md:px-6 lg:px-8"
          role="navigation"
          aria-label="Navigasi utama"
        >
          {/* Logo */}
          <Logo variant="light" height={36} />

          {/* Nav links — desktop */}
          <ul className="hidden lg:flex items-center gap-1" role="list">
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(item.href, pathname, item.matchExact)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      'nav-underline px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:shadow-focus',
                      active
                        ? 'text-brand-teal-600 font-semibold'
                        : 'text-neutral-600 hover:text-brand-teal-700',
                    ].join(' ')}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
            <li>
              <Link
                href={SUPPLIER_LINK.href}
                className="px-3 py-2 rounded-md text-sm font-medium text-sand-700 hover:text-sand-600 transition-colors duration-150 focus-visible:outline-none focus-visible:shadow-focus flex items-center gap-1.5"
              >
                <Sprout size={14} aria-hidden="true" />
                {SUPPLIER_LINK.label}
              </Link>
            </li>
          </ul>

          {/* CTA + Hamburger */}
          <div className="flex items-center gap-2">
            {/* CTA button — desktop */}
            <Link
              href={CTA_LINK.href}
              className="hidden lg:inline-flex items-center gap-2 h-9 px-4 bg-brand-teal-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-brand-teal-500 hover:-translate-y-0.5 hover:shadow-md active:bg-brand-teal-700 active:scale-[0.97] active:shadow-none focus-visible:outline-none focus-visible:shadow-focus transition-all duration-100"
            >
              {CTA_LINK.label}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>

            {/* Hamburger — mobile */}
            <button
              className="lg:hidden flex items-center justify-center h-10 w-10 rounded-md text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 focus-visible:outline-none focus-visible:shadow-focus transition-colors duration-100"
              onClick={() => setIsOpen((v) => !v)}
              aria-label={isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={isOpen}
              aria-controls="mobile-nav-drawer"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile Drawer ──────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={[
          'fixed inset-0 z-[999] bg-black/50 backdrop-blur-[2px] lg:hidden',
          'transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer panel */}
      <div
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
        className={[
          'fixed top-16 right-0 bottom-0 z-[1001] w-[280px] max-w-[80vw]',
          'bg-white border-l border-neutral-200 shadow-xl',
          'overflow-y-auto lg:hidden',
          'transition-transform duration-300 ease-[cubic-bezier(0,0,0.2,1)]',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <div className="py-4 px-4">
          {/* Nav items */}
          <ul className="space-y-1" role="list">
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(item.href, pathname, item.matchExact)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      'flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors duration-100',
                      'focus-visible:outline-none focus-visible:shadow-focus',
                      active
                        ? 'bg-brand-teal-50 text-brand-teal-700 font-semibold'
                        : 'text-neutral-700 hover:bg-neutral-50',
                    ].join(' ')}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.icon && <item.icon size={20} aria-hidden="true" className="text-neutral-400" />}
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <hr className="my-3 border-neutral-200" />

          {/* Supplier link */}
          <Link
            href={SUPPLIER_LINK.href}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-sand-700 hover:bg-sand-50 transition-colors duration-100 focus-visible:outline-none focus-visible:shadow-focus"
          >
            <Sprout size={20} aria-hidden="true" className="text-sand-500" />
            {SUPPLIER_LINK.label}
          </Link>

          <hr className="my-3 border-neutral-200" />

          {/* CTA button — mobile */}
          <Link
            href={CTA_LINK.href}
            className="flex items-center justify-center gap-2 w-full h-11 px-4 bg-brand-teal-600 text-white text-base font-semibold rounded-lg shadow-sm hover:bg-brand-teal-500 active:bg-brand-teal-700 active:scale-[0.97] transition-all duration-100 focus-visible:outline-none focus-visible:shadow-focus"
          >
            {CTA_LINK.label}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>

          {/* Kontak mini */}
          <div className="mt-6 pt-4 border-t border-neutral-100 space-y-2">
            <a
              href={generateWALink(whatsapp1)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-teal-600 transition-colors duration-150"
            >
              <MessageCircle size={16} aria-hidden="true" />
              {whatsapp1}
            </a>
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-teal-600 transition-colors duration-150"
            >
              <Mail size={16} aria-hidden="true" />
              {email}
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
