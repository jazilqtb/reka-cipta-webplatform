// components/layout/Navbar.tsx
// Epic 1 (E1-ENG-20) — Navbar desktop + mobile drawer.
//
// RONDE Tahap 3 (2026-08) — poin UMUM "Mobile Hamburger Menu": drawer
// mobile lama (panel putih 280px di sisi kanan, list sederhana) dinilai
// klien "terputus dari branding baru" — beranda sekarang bermodal
// gelap (ink-900/teal-gradient) di banyak section (HowItWorks, Footer,
// StagedCTASection) dgn tipografi ekspresif (aksen italic teal) dan
// micro-interaction (stagger reveal). Drawer putih datar tanpa animasi
// terasa seperti komponen dari desain lama yg ketinggalan.
//
// Rombak: full-screen overlay gelap (gradient ink-950→ink-900, +
// .bg-salt-texture yg SAMA dipakai Footer/HowItWorks/StagedCTA —
// bukan motif baru, demi kohesi), nav link tipografi besar dgn aksen
// italic teal saat aktif (filosofi sama dgn H2 section lain), stagger
// entrance via Framer Motion (bukan CSS transition polos), ikon
// hamburger↔close morph animasi (bukan swap instan). Desktop nav TIDAK
// disentuh — hanya cakupan <lg (poin ini murni "mobile hamburger
// menu").
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ListIcon, XIcon, ChatCircleIcon, EnvelopeSimpleIcon, ArrowRightIcon, PlantIcon } from '@phosphor-icons/react/ssr'
import { NAV_ITEMS, SUPPLIER_LINK, CTA_LINK } from '@/constants/navigation'
import { Logo } from '@/components/brand/Logo'
import { generateWALink } from '@/lib/wa-link'

interface NavbarProps {
  whatsapp1: string
  email: string
  logoSrc?: string
}

function isNavActive(href: string, pathname: string, exact: boolean): boolean {
  if (exact) return pathname === href
  return pathname.startsWith(href)
}

const EASE = [0.25, 0.46, 0.45, 0.94] as const
const drawerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.12 } },
}
const drawerItem = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
}

export function Navbar({ whatsapp1, email, logoSrc }: NavbarProps) {
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

      {/* Strip aksen tipis — penanda "dokumen resmi", bukan navbar generik
          flat. Garis, bukan shadow, sebagai unit pemisah utama. */}
      <div className="sticky top-0 z-[1001] h-[3px] bg-marine-600" aria-hidden="true" />

      <header
        className={[
          'sticky top-[3px] z-[1000] h-[60px] md:h-[68px]',
          'bg-white/97 backdrop-blur-sm',
          'border-b transition-[border-color,box-shadow] duration-200',
          isScrolled
            ? 'border-ink-900/12 shadow-[0_1px_0_rgba(10,30,28,0.05)]'
            : 'border-ink-900/[0.06]',
        ].join(' ')}
      >
        <nav
          className="mx-auto max-w-[1280px] h-full flex items-center justify-between px-4 md:px-6 lg:px-8"
          role="navigation"
          aria-label="Navigasi utama"
        >
          <div className="flex items-center gap-2.5">
            <Logo variant="light" height={34} src={logoSrc} />
            <div className="hidden h-6 w-px bg-ink-900/10 sm:block lg:hidden xl:block" aria-hidden="true" />
            <span className="hidden whitespace-nowrap font-ui text-sm font-semibold text-ink-700 sm:block md:text-base lg:hidden xl:block">
              Reka Cipta Indonesia
            </span>
          </div>

          {/* Nav links — desktop. font-ui (Space Grotesk): suara struktural
              navigasi, bukan lagi Plus Jakarta Sans yg sama dgn body text. */}
          <ul className="hidden lg:flex items-center gap-0.5 font-ui" role="list">
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(item.href, pathname, item.matchExact)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      'nav-underline px-3 py-2 text-sm font-medium transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:shadow-focus',
                      active
                        ? 'text-brand-teal-600 font-semibold'
                        : 'text-ink-700/70 hover:text-brand-teal-700',
                    ].join(' ')}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
            <li className="ml-1 flex items-center">
              <span className="h-4 w-px bg-ink-900/10" aria-hidden="true" />
            </li>
            <li>
              <Link
                href={SUPPLIER_LINK.href}
                className="px-3 py-2 text-sm font-medium text-sand-700 hover:text-sand-600 transition-colors duration-150 focus-visible:outline-none focus-visible:shadow-focus flex items-center gap-1.5"
              >
                <PlantIcon size={16} weight="duotone" aria-hidden="true" />
                {SUPPLIER_LINK.label}
              </Link>
            </li>
          </ul>

          {/* CTA + Hamburger */}
          <div className="flex items-center gap-2.5">
            {/* WhatsApp quick-chat — kanal paling familiar bagi mitra B2B
                Indonesia (Fondasi Brand §7.3). Icon-only, desktop saja.
                rounded-xl — satu-satunya radius tombol di beranda (lihat
                aturan bentuk Ronde 4 di globals.css). */}
            <a
              href={generateWALink(whatsapp1, 'Halo, saya ingin bertanya tentang produk garam Reka Cipta Indonesia.')}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat via WhatsApp"
              className="hidden rounded-xl lg:inline-flex items-center justify-center h-9 w-9 border border-ink-900/10 text-ink-700/60 hover:border-brand-teal-300 hover:bg-brand-teal-50 hover:text-brand-teal-600 focus-visible:outline-none focus-visible:shadow-focus transition-colors duration-150"
            >
              <ChatCircleIcon size={16} weight="duotone" aria-hidden="true" />
            </a>

            {/* CTA button — desktop. rounded-xl, arrow-slide on hover. */}
            <Link
              href={CTA_LINK.href}
              className="link-arrow font-ui rounded-md hidden lg:inline-flex items-center gap-2 h-9 px-4 bg-brand-teal-600 text-white text-sm font-semibold hover:bg-brand-teal-500 active:bg-brand-teal-700 focus-visible:outline-none focus-visible:shadow-focus transition-colors duration-150"
            >
              {CTA_LINK.label}
              <ArrowRightIcon size={16} weight="bold" className="arrow-icon" aria-hidden="true" />
            </Link>

            {/* Hamburger — mobile. Ikon morph animasi (bukan swap instan). */}
            <button
              className="lg:hidden relative flex items-center justify-center h-10 w-10 rounded-xl text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 focus-visible:outline-none focus-visible:shadow-focus transition-colors duration-100"
              onClick={() => setIsOpen((v) => !v)}
              aria-label={isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={isOpen}
              aria-controls="mobile-nav-drawer"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isOpen ? 'close' : 'open'}
                  initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="flex items-center justify-center"
                >
                  {isOpen ? <XIcon size={24} weight="bold" /> : <ListIcon size={24} weight="bold" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile Drawer — full-screen, gelap, menyatu dgn estetika
          section StagedCTA/HowItWorks/Footer ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="fixed inset-0 z-[1001] overflow-y-auto surface-dark lg:hidden"
          >
            {/* Catatan sejarah: di sini pernah ada .bg-salt-texture (memicu
                bug cascade-layer), lalu diganti mesh gradient radial. Mesh
                itu DICABUT di CP0 ronde 3 — rgba-nya hijau lama yang
                ditulis literal, dan gradien sebagai latar melanggar §9.
                Panelnya kini permukaan solid. */}
            <motion.div
              initial={{ y: -16 }}
              animate={{ y: 0 }}
              exit={{ y: -16 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="flex min-h-full flex-col px-6 pb-8 pt-[76px] font-ui"
            >
              {/* Close — tap target besar, pojok kanan atas (ikon utama
                  sudah morph di header, ini duplikat aksesibel di dalam
                  overlay itu sendiri) */}
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Tutup menu navigasi"
                className="absolute right-4 top-[15px] flex h-10 w-10 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:shadow-focus-dark"
              >
                <XIcon size={24} weight="bold" aria-hidden="true" />
              </button>

              {/* Nav items — tipografi besar & ekspresif, aksen italic
                  teal saat aktif (filosofi sama dgn H2 "Katalog Produk"
                  dkk), stagger reveal saat drawer terbuka. */}
              <motion.ul variants={drawerContainer} initial="hidden" animate="visible" className="mt-4 space-y-1" role="list">
                {NAV_ITEMS.map((item) => {
                  const active = isNavActive(item.href, pathname, item.matchExact)
                  return (
                    <motion.li key={item.href} variants={drawerItem}>
                      <Link
                        href={item.href}
                        className={[
                          'flex items-center gap-3 rounded-xl py-2.5 text-2xl font-semibold leading-tight transition-colors duration-150',
                          'focus-visible:outline-none focus-visible:shadow-focus-dark',
                          active ? 'text-white' : 'text-white/55 hover:text-white/85',
                        ].join(' ')}
                        aria-current={active ? 'page' : undefined}
                      >
                        {active && <span className="font-medium text-brand-teal-300">/</span>}
                        {item.label}
                      </Link>
                    </motion.li>
                  )
                })}
              </motion.ul>

              <motion.div variants={drawerItem} initial="hidden" animate="visible" className="mt-2">
                <Link
                  href={SUPPLIER_LINK.href}
                  className="flex items-center gap-2.5 rounded-xl py-2.5 text-base font-medium text-sand-300 hover:text-sand-200 transition-colors duration-150 focus-visible:outline-none focus-visible:shadow-focus-dark"
                >
                  <PlantIcon size={20} weight="duotone" aria-hidden="true" />
                  {SUPPLIER_LINK.label}
                </Link>
              </motion.div>

              {/* Spacer dorong CTA + kontak ke bawah layar */}
              <div className="flex-1" />

              <motion.div variants={drawerItem} initial="hidden" animate="visible">
                <Link
                  href={CTA_LINK.href}
                  className="link-arrow font-ui rounded-xl flex items-center justify-center gap-2 w-full h-12 px-4 bg-brand-teal-600 text-white text-base font-semibold hover:bg-brand-teal-500 active:bg-brand-teal-700 transition-colors duration-150 focus-visible:outline-none focus-visible:shadow-focus-dark"
                >
                  {CTA_LINK.label}
                  <ArrowRightIcon size={20} weight="bold" className="arrow-icon" aria-hidden="true" />
                </Link>
              </motion.div>

              <motion.div
                variants={drawerItem}
                initial="hidden"
                animate="visible"
                className="mt-6 flex flex-col gap-2.5 border-t border-white/10 pt-5 font-sans"
              >
                <a
                  href={generateWALink(whatsapp1)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white/50 hover:text-brand-teal-300 transition-colors duration-150"
                >
                  <ChatCircleIcon size={16} weight="duotone" aria-hidden="true" />
                  {whatsapp1}
                </a>
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-2 text-sm text-white/50 hover:text-brand-teal-300 transition-colors duration-150"
                >
                  <EnvelopeSimpleIcon size={16} weight="duotone" aria-hidden="true" />
                  {email}
                </a>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
