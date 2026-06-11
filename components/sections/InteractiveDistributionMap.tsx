// components/sections/InteractiveDistributionMap.tsx
// Epic 2 Slice 1 (E2-S1-FE-10) — Stats Bar Slide 2
//
// SVG peta stylized Jawa Timur/Tengah (Fase 0: Opsi A placeholder
// rect) + dot markers interaktif dengan tooltip Framer Motion.
//
// Keputusan implementasi:
// - Tooltip = HTML overlay (posisi % dari koordinat SVG), BUKAN
//   <foreignObject> — menghindari bug rendering Safari.
// - Keyboard accessible: dot fokusable (tabIndex), Escape menutup
//   tooltip (wireframe: "tooltip navigable via keyboard").
// - Pulse ring: motion-safe:animate-ping — patuh reduced motion.
//
// TODO: ganti <rect> placeholder dengan SVG path pulau Jawa resmi
//       jika tersedia dari klien (update constants + path di sini).
'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DISTRIBUTION_CITIES,
  type DistributionCity,
} from '@/constants/distribution-map'

const VIEWBOX_W = 500
const VIEWBOX_H = 300

export function InteractiveDistributionMap() {
  const [activeCity, setActiveCity] = useState<DistributionCity | null>(null)

  const show = useCallback((city: DistributionCity) => setActiveCity(city), [])
  const hide = useCallback(() => setActiveCity(null), [])

  return (
    <div className="w-full">
      {/* Label wilayah */}
      <div className="mb-2 flex justify-between px-[10%] text-xs font-medium uppercase tracking-widest text-neutral-400">
        <span>Jawa Tengah</span>
        <span>Jawa Timur</span>
      </div>

      {/* Container relative: SVG + tooltip overlay sebagai sibling */}
      <div className="relative mx-auto w-full max-w-2xl" onKeyDown={(e) => e.key === 'Escape' && hide()}>
        <svg
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          className="h-auto w-full"
          role="group"
          aria-label="Peta titik distribusi CV Reka Cipta Indonesia di Jawa Timur dan Jawa Tengah"
        >
          {/* Placeholder wilayah — Fase 0 Opsi A */}
          <rect
            x="40" y="50" width="420" height="200" rx="16"
            className="fill-neutral-200/70 stroke-neutral-300"
            strokeWidth="1"
          />
          {/* Batas provinsi (approximate) */}
          <line
            x1="290" y1="50" x2="290" y2="250"
            className="stroke-neutral-300"
            strokeWidth="1" strokeDasharray="4 4"
          />

          {/* Dot markers */}
          {DISTRIBUTION_CITIES.map((city) => {
            const isActive = activeCity?.id === city.id
            return (
              <g key={city.id}>
                {/* Pulse ring — hanya beranimasi jika motion-safe */}
                <circle
                  cx={city.cx} cy={city.cy} r="11"
                  className="motion-safe:animate-ping fill-brand-teal-600/20"
                  style={{ animationDuration: '2.5s', transformOrigin: `${city.cx}px ${city.cy}px` }}
                  aria-hidden="true"
                />
                {/* Dot utama — fokusable + hoverable */}
                <circle
                  cx={city.cx} cy={city.cy}
                  r={isActive ? 9 : 7}
                  className="cursor-pointer fill-brand-teal-600 stroke-white outline-none transition-[r] duration-150 focus-visible:stroke-brand-teal-300"
                  strokeWidth={isActive ? 3 : 2}
                  tabIndex={0}
                  role="button"
                  aria-label={`${city.name}: ${city.tons} ton distribusi`}
                  onMouseEnter={() => show(city)}
                  onMouseLeave={hide}
                  onFocus={() => show(city)}
                  onBlur={hide}
                />
              </g>
            )
          })}
        </svg>

        {/* Tooltip — HTML overlay, posisi % dari koordinat SVG */}
        <AnimatePresence>
          {activeCity && (
            <motion.div
              key={activeCity.id}
              initial={{ opacity: 0, scale: 0.85, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
              style={{
                left: `${(activeCity.cx / VIEWBOX_W) * 100}%`,
                top: `${(activeCity.cy / VIEWBOX_H) * 100}%`,
                marginTop: '-14px', // jarak di atas dot
              }}
              role="status"
            >
              <div className="whitespace-nowrap rounded-lg bg-ink-900 px-3 py-2 text-xs text-white shadow-lg">
                <p className="font-semibold">{activeCity.name}</p>
                <p className="text-neutral-300">{activeCity.tons} ton</p>
              </div>
              {/* Panah kecil ke bawah */}
              <div className="mx-auto h-0 w-0 border-x-[6px] border-t-[6px] border-x-transparent border-t-ink-900" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-3 text-center text-xs text-neutral-500">
        Arahkan kursor atau fokus ke titik untuk melihat detail distribusi
      </p>
    </div>
  )
}
