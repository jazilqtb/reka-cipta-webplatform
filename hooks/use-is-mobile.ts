// hooks/use-is-mobile.ts
// Epic 4B Slice 1 (R-26) — deteksi viewport mobile untuk disable
// drag-drop Kanban (touch drag UX buruk, dropdown fallback dipakai
// di mobile). Initial state false + useEffect (bukan langsung
// window.innerWidth di render) supaya tidak SSR mismatch.
'use client'

import { useEffect, useState } from 'react'

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])

  return isMobile
}
