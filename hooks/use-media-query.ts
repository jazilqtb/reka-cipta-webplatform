// hooks/use-media-query.ts — CP1 ronde 4
//
// ═══ KENAPA INI MENGGANTIKAN PENGUKURAN window.innerWidth ═══
//
// `useIsMobile(1024)` memutuskan "layar sempit atau tidak" dengan
// `window.innerWidth < 1024`, sementara yang menyembunyikan panel detail
// adalah kelas CSS `lg:block`. Dua pengukur yang berbeda untuk satu
// keputusan yang sama — dan keduanya BISA BERSELISIH. Saat berselisih,
// akibatnya persis gejala yang dilaporkan: lead diklik, tidak terjadi
// apa-apa. Klik menyimpan `selectedId` untuk panel yang CSS-nya sedang
// menyembunyikan panel itu, dan tidak ada satu pun yang muncul.
//
// Dua sumber perselisihannya, keduanya nyata:
//
// 1. SCROLLBAR. `window.innerWidth` MEMUAT lebar scrollbar; media query
//    CSS di Chrome/Firefox tidak. Dengan scrollbar klasik ~15px, ada pita
//    selebar 15px tepat di sekitar 1024 tempat JS berkata "lebar" dan CSS
//    berkata "sempit".
//
// 2. BREAKPOINT BERSATUAN REM — ini yang jauh lebih besar. Tailwind v4
//    menulis `lg` sebagai **64rem**, bukan 1024px. Kalau ukuran font
//    bawaan peramban dinaikkan (20px, hal yang lazim di layar besar atau
//    demi keterbacaan), `lg` menjadi **1280 px CSS**, sementara angka 1024
//    di JS tidak ikut bergerak sama sekali. Pitanya melebar dari 15px
//    menjadi ~256px — dan di seluruh pita itu, detail lead TIDAK BISA
//    DIBUKA sama sekali dengan cara apa pun.
//
// Perbaikannya bukan menyetel ulang angkanya, melainkan berhenti memakai
// dua pengukur: `matchMedia` menanyakan langsung kepada mesin CSS yang
// SAMA dengan yang menyembunyikan panelnya. Keduanya tidak bisa lagi
// berselisih, apa pun ukuran font dan apa pun scrollbarnya.
//
// `useSyncExternalStore` dipakai supaya render pertama di klien sudah
// membaca nilai yang benar — bukan `false` dulu lalu berubah. Snapshot
// server tetap `false` supaya HTML yang dikirim server dan hidrasi
// pertama tetap cocok.

'use client'

import { useCallback, useSyncExternalStore } from 'react'

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query]
  )

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])

  // Di server tidak ada viewport. `false` berarti "anggap belum cocok",
  // dan pemanggil di bawah ini memilih arah defaultnya sendiri.
  const getServerSnapshot = useCallback(() => false, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Cocok dengan `lg:` Tailwind v4 — 64rem, bukan 1024px.
 *
 *  Ditulis dalam `rem` DENGAN SENGAJA: begitu ia ditulis dalam px, ia
 *  langsung berselisih lagi dengan kelas `lg:` pada peramban yang ukuran
 *  font bawaannya bukan 16px, dan bug yang sama lahir kembali. */
export function useIsLgUp(): boolean {
  return useMediaQuery('(min-width: 64rem)')
}
