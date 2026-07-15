// components/article/ArticleViewTracker.tsx
// Epic 6 Slice 1 (E6-S1-FE-07, AR-03) — increment view_count via RPC,
// guard sessionStorage supaya refresh dalam sesi sama tidak dobel-count.
// Tidak render apa pun — murni side-effect.

'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const SESSION_KEY_PREFIX = 'article-viewed:'

export function ArticleViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const sessionKey = `${SESSION_KEY_PREFIX}${slug}`
    if (sessionStorage.getItem(sessionKey)) return

    sessionStorage.setItem(sessionKey, '1')

    const supabase = createClient()
    supabase
      .rpc('increment_article_view', { p_slug: slug })
      .then(({ error }) => {
        if (error) console.error('[ArticleViewTracker] Gagal increment view:', error.message)
      })
  }, [slug])

  return null
}
