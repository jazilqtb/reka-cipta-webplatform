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

interface RevealWrapperProps {
  children: React.ReactNode
  variant?: RevealVariant
  className?: string
  /** Delay transisi dalam ms — untuk stagger manual antar sibling */
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
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
