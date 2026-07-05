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
import type { ProductListResponse, ProductDetailResponse } from '@/types/api'

const BASE_URL = publicEnv.apiUrl // NEXT_PUBLIC_API_URL — type-safe via lib/env.ts

interface FetchOptions extends RequestInit {
  /** true → inject Authorization: Bearer {supabase-session-jwt} */
  auth?: boolean
  /** Timeout ms. Default 10_000. AI endpoints (Epic 4): 35_000. */
  timeout?: number
}

// Epic 2 Slice 3 — Error dengan status code eksplisit. Pesan `detail`
// dari FastAPI tidak selalu memuat angka status (mis. slowapi pakai
// key "error", bukan "detail") — caller yang perlu membedakan
// 401/422/429 HARUS cek `err.status`, bukan string-match pesannya.
export class ApiFetchError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiFetchError'
    this.status = status
  }
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
    if (!session) throw new ApiFetchError('UNAUTHORIZED', 401)
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
      throw new ApiFetchError(err.detail ?? `HTTP ${res.status}`, res.status)
    }

    return res.json() as Promise<T>
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiFetchError('Permintaan timeout. Silakan coba lagi.', 408)
    }
    throw err
  }
}

// === Epic 3 Slice 1: Products (E3-S1-CT-01) ===
// Public, tanpa auth. Server Component /produk & /produk/[slug] fetch
// langsung dari Supabase (lihat lib/product-mapper.ts) — fetcher ini
// untuk konsumen lain (mis. Client Component di Epic 3B admin panel).

export async function getProducts(): Promise<ProductListResponse> {
  return apiFetch<ProductListResponse>('/products', { auth: false })
}

export async function getProductBySlug(slug: string): Promise<ProductDetailResponse> {
  return apiFetch<ProductDetailResponse>(`/products/${slug}`, { auth: false })
}
