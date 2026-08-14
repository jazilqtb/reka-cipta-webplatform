// components/decorative/ParallaxBlob.tsx
// RONDE Tahap 3 (2026-08) — poin UMUM: "Parallax & Scroll Tracking" +
// "Background Kreatif (SVG blobs/mesh gradient)". Satu komponen kecil
// yang menggabungkan keduanya: blob gradient lembut yang bergerak
// vertikal dengan kecepatan BERBEDA dari scroll (parallax klasik),
// dipakai sbg dekorasi latar di beberapa section agar tidak monoton.
//
// Sengaja bukan section-wide parallax (foto/section ikut miring saat
// scroll) — itu berisiko merusak keterbacaan teks yang di atasnya
// (constraint eksplisit klien: "jangan sampai mengganggu keterbacaan").
// Blob ini SELALU aria-hidden, absolutely-positioned di BELAKANG
// konten (z-index diatur oleh pemanggil), murni dekoratif.
//
// Client Component kecil & mandiri — section pemanggilnya (mis.
// CredibilitySection, StagedCTASection) TETAP Server Component, tidak
// perlu ikut jadi 'use client' hanya demi satu elemen dekoratif ini.
'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ParallaxBlobProps {
  className?: string
  /** Jarak tempuh vertikal (px) dari scroll paling atas ke paling bawah viewport */
  range?: number
}

export function ParallaxBlob({ className, range = 50 }: ParallaxBlobProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [-range, range])

  return (
    <motion.div
      ref={ref}
      aria-hidden="true"
      style={prefersReduced ? undefined : { y }}
      className={cn('pointer-events-none absolute rounded-full blur-3xl', className)}
    />
  )
}
