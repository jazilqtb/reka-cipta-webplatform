// hooks/use-scroll-reveal.ts
// Epic 2 Slice 1 (E2-S1-ANIM-01) — Spec: Design System §15.1
//
// IntersectionObserver hook: menambahkan class `.is-visible` saat
// elemen masuk viewport. Berpasangan dengan CSS `.reveal-*` di
// globals.css (reveal-up, reveal-scale, reveal-left, reveal-right).
//
// default once=true: animasi hanya berjalan SEKALI — tidak berulang
// saat user scroll kembali ke atas (acceptance criteria E2-S1-US-04).
'use client'

import { useEffect, useRef } from 'react'

interface RevealOptions {
  threshold?: number
  rootMargin?: string
  once?: boolean
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: RevealOptions = {}
) {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -60px 0px',
    once = true,
  } = options

  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Fallback: browser tanpa IntersectionObserver → langsung tampil
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible')
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          if (once) observer.unobserve(el)
        } else if (!once) {
          el.classList.remove('is-visible')
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  return ref
}
