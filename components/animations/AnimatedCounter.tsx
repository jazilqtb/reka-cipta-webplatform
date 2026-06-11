// components/animations/AnimatedCounter.tsx
// Epic 2 Slice 1 (E2-S1-ANIM-03) — Spec: Design System §15.3
//
// Counter count-up dari 0 → target saat pertama masuk viewport.
// - rAF + easeOutCubic, durasi default 1500ms
// - once: animasi hanya sekali (tidak reset saat scroll balik)
// - staggerDelay: delay mulai dalam ms (stats bar: 0/150/300/450)
// - Format id-ID: 1.234 (titik sebagai pemisah ribuan)
// - A11y: angka beranimasi aria-hidden; nilai final dibaca via
//   <span className="sr-only"> agar screen reader dapat 1x nilai bersih
// - prefers-reduced-motion: langsung tampilkan nilai final tanpa animasi
'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedCounterProps {
  target: number
  suffix?: string
  /** Durasi animasi (ms). Default 1500 — sesuai US-02. */
  duration?: number
  /** Delay sebelum mulai (ms) — untuk stagger antar stat. */
  staggerDelay?: number
  className?: string
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

export function AnimatedCounter({
  target,
  suffix = '',
  duration = 1500,
  staggerDelay = 0,
  className,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const startAnimation = () => {
      if (hasAnimated.current) return
      hasAnimated.current = true

      if (prefersReduced) {
        setDisplay(target) // langsung final, tanpa animasi
        return
      }

      let rafId: number
      const begin = () => {
        const startTime = performance.now()
        const tick = (now: number) => {
          const progress = Math.min((now - startTime) / duration, 1)
          setDisplay(Math.round(easeOutCubic(progress) * target))
          if (progress < 1) rafId = requestAnimationFrame(tick)
        }
        rafId = requestAnimationFrame(tick)
      }

      const timeoutId = setTimeout(begin, staggerDelay)
      return () => {
        clearTimeout(timeoutId)
        if (rafId) cancelAnimationFrame(rafId)
      }
    }

    if (typeof IntersectionObserver === 'undefined') {
      setDisplay(target)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startAnimation()
          observer.unobserve(el) // once: true
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration, staggerDelay])

  return (
    <span ref={ref} className={className}>
      {/* Angka beranimasi — disembunyikan dari screen reader */}
      <span aria-hidden="true">
        {display.toLocaleString('id-ID')}
        {suffix}
      </span>
      {/* Nilai final untuk screen reader — dibaca sekali, bersih */}
      <span className="sr-only">
        {target.toLocaleString('id-ID')}
        {suffix}
      </span>
    </span>
  )
}
