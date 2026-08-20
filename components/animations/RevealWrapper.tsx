// components/animations/RevealWrapper.tsx
// Epic 2 Slice 1 (E2-S1-ANIM-02)
//
// Client wrapper untuk scroll reveal berbasis CSS. Section components
// tetap Server Components — cukup dibungkus wrapper ini.
//
// Pemakaian:
//   <RevealWrapper variant="reveal-up" delay={150}>
//     <SectionContent />
//   </RevealWrapper>
//
// Variant tersedia (CSS di globals.css): reveal-up | reveal-scale |
// reveal-left | reveal-right
'use client'

import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { cn } from '@/lib/utils'

type RevealVariant = 'reveal-up' | 'reveal-scale' | 'reveal-left' | 'reveal-right'

/** Batas atas stagger, ditegakkan di sini alih-alih dititipkan ke disiplin
 *  21 pemanggil. Sebelumnya ada pemanggil dengan `delay={index * 150}`:
 *  pada daftar 5 item, kartu terakhir baru muncul 750ms + 250ms transisi
 *  setelah section masuk viewport. Itu masuk kategori "animasi yang menunda
 *  akses informasi" (DESIGN-SYSTEM §7 — DILARANG). Stagger tetap berguna
 *  untuk menandai arah baca, jadi tidak dihapus — hanya diberi langit-langit
 *  yang tidak bisa ditembus siapa pun. */
const MAX_DELAY_MS = 120

interface RevealWrapperProps {
  children: React.ReactNode
  variant?: RevealVariant
  className?: string
  /** Delay transisi dalam ms — untuk stagger manual antar sibling.
   *  Dibatasi MAX_DELAY di bawah, apa pun yang dikirim pemanggil. */
  delay?: number
  threshold?: number
  rootMargin?: string
}

export function RevealWrapper({
  children,
  variant = 'reveal-up',
  className,
  delay,
  threshold,
  rootMargin,
}: RevealWrapperProps) {
  const ref = useScrollReveal<HTMLDivElement>({ threshold, rootMargin, once: true })

  return (
    <div
      ref={ref}
      className={cn(variant, className)}
      style={delay ? { transitionDelay: `${Math.min(delay, MAX_DELAY_MS)}ms` } : undefined}
    >
      {children}
    </div>
  )
}
