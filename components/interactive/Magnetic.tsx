// components/interactive/Magnetic.tsx
// RONDE Tahap 3 (2026-08) — poin UMUM: "Mouse Tracking/Hover: objek
// bereaksi mengikuti arah/pergerakan kursor pengguna". Pola "magnetic
// button" — elemen bergeser sedikit ke arah kursor saat kursor
// mendekat, kembali ke posisi semula saat kursor menjauh. Dipakai
// membungkus CTA utama Hero (elemen paling sering disorot pengunjung).
//
// Radius tarikan dibatasi (`strength`) supaya efeknya terasa halus,
// bukan liar/mengganggu klik. Nonaktif total di touch device (tidak
// ada konsep "mouse position" di layar sentuh) & reduced-motion.
'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'

interface MagneticProps {
  children: ReactNode
  /** Seberapa jauh elemen boleh bergeser mengikuti kursor (px) */
  strength?: number
  className?: string
}

export function Magnetic({ children, strength = 14, className }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 250, damping: 18, mass: 0.4 })
  const springY = useSpring(y, { stiffness: 250, damping: 18, mass: 0.4 })

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (prefersReduced || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const relX = e.clientX - (rect.left + rect.width / 2)
    const relY = e.clientY - (rect.top + rect.height / 2)
    x.set((relX / (rect.width / 2)) * strength)
    y.set((relY / (rect.height / 2)) * strength)
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={prefersReduced ? undefined : { x: springX, y: springY }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
