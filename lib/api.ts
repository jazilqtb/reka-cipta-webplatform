// lib/api.ts
// Epic 2 Slice 1 (E2-S1-UTIL-01) — Spec: ARCHITECTURE.md §6.4
//
// Typed fetch wrapper: Client Components → FastAPI (Railway).
// HANYA untuk Client Components ('use client') — Server Components
// fetch Supabase langsung via lib/supabase/server.ts (§6.1/§6.2).
//
// Pemakai (per epic):
//   Slice 3 : ContactForm (POST /contact/send, tanpa auth)
//             SettingsForm (PATCH /settings, auth: true)
//   Epic 4  : RFQ endpoints (timeout: 35_000 untuk AI generation)
//
// Error contract (ARCHITECTURE.md §3): FastAPI mengembalikan
// { detail: string, code: string } — kita lempar Error(detail).

import { createClient } from '@/lib/supabase/client'
import { publicEnv } from '@/lib/env'

const BASE_URL = publicEnv.apiUrl // NEXT_PUBLIC_API_URL — type-safe via lib/env.ts

interface FetchOptions extends RequestInit {
  /** true → inject Authorization: Bearer {supabase-session-jwt} */
  auth?: boolean
  /** Timeout ms. Default 10_000. AI endpoints (Epic 4): 35_000. */
  timeout?: number
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { auth = false, timeout = 10_000, ...rest } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((rest.headers as Record<string, string>) ?? {}),
  }

  if (auth) {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw new Error('UNAUTHORIZED')
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(`${BASE_URL}/api/v1${path}`, {
      ...rest,
      headers,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      // Defensive: response error bisa non-JSON (mis. 502 dari proxy)
      const err = await res
        .json()
        .catch(() => ({ detail: `HTTP ${res.status}`, code: 'UNKNOWN' }))
      throw new Error(err.detail ?? `HTTP ${res.status}`)
    }

    return res.json() as Promise<T>
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Permintaan timeout. Silakan coba lagi.')
    }
    throw err
  }
}
