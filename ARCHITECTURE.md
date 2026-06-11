# ARCHITECTURE.md
## CV Reka Cipta Indonesia — Web Platform & CRM System

> **Output dari:** E1-SPIKE-01 · Dokumen ini adalah **living reference** — update wajib setiap ada keputusan arsitektural baru, sebelum implementasi.
>
> **Sumber:** PRD v1.0 · Epic Doc 1–2 · E1-UX-07 · E1-UX-08 · Design System v2.0 · Epic1 Task Breakdown v1.1  
> **Versi:** 1.0 · Juni 2026  
> **Status:** Approved — berlaku sejak E1-SPIKE-01

---

## Daftar Isi

1. [Tech Stack](#1-tech-stack)
2. [Struktur Folder — Frontend](#2-struktur-folder--frontend)
3. [Struktur Folder — Backend](#3-struktur-folder--backend)
4. [Route Groups & App Router Conventions](#4-route-groups--app-router-conventions)
5. [Server vs Client Component — Aturan & Decision Tree](#5-server-vs-client-component--aturan--decision-tree)
6. [Data Fetching Patterns](#6-data-fetching-patterns)
7. [Auth & Middleware Contract](#7-auth--middleware-contract)
8. [Supabase Client Usage per Context](#8-supabase-client-usage-per-context)
9. [Konvensi Penamaan](#9-konvensi-penamaan)
10. [Environment Variables](#10-environment-variables)
11. [Design System Integration](#11-design-system-integration)
12. [Integration Points](#12-integration-points)
13. [Database Schema & RLS Patterns](#13-database-schema--rls-patterns)
14. [Deployment & Branch Strategy](#14-deployment--branch-strategy)
15. [Observability](#15-observability)
16. [API Contract — TypeScript ↔ Pydantic Alignment](#16-api-contract--typescript--pydantic-alignment)
17. [Epic 1 Validation Checklist](#17-epic-1-validation-checklist)

---

## 1. Tech Stack

| Layer | Teknologi | Hosting | Catatan |
|-------|-----------|---------|---------|
| **Frontend** | Next.js 14 (App Router) + TypeScript | Vercel | Strict mode, path alias `@/*` |
| **Styling** | Tailwind CSS + shadcn/ui | — | Config **frozen** — lihat §11 |
| **Backend** | Python FastAPI + Uvicorn | Railway | `/backend` folder di monorepo |
| **Database** | PostgreSQL via Supabase | Supabase (Singapore) | RLS aktif di semua tabel |
| **Auth** | Supabase Auth (`@supabase/ssr`) | Supabase | JWT expiry 3600s, auto-refresh |
| **Storage** | Supabase Storage | Supabase | 4 buckets, lihat §13 |
| **AI** | Anthropic Claude API | Anthropic Cloud | Dipanggil hanya dari FastAPI |
| **Email** | Resend | Resend | Notifikasi RFQ + kontak |
| **Error Tracking** | Sentry | Sentry Cloud | Frontend + Backend |
| **Schema Migration** | Supabase CLI (`supabase db push`) | — | Semua schema via migration file |

**Node version:** LTS 20.x (`.nvmrc` di root)  
**Python version:** 3.11+

---

## 2. Struktur Folder — Frontend

```
/                                     ← Monorepo root
├── ARCHITECTURE.md                   ← File ini
├── README.md
├── .nvmrc                            ← Node 20.x
├── .gitignore                        ← node_modules, .env.local, .venv, .next, __pycache__
├── .env.local                        ← TIDAK di-commit (lihat §10)
├── .env.local.example                ← Template — wajib di-commit
├── next.config.js                    ← Security headers (E1-ENG-38), image domains
├── tailwind.config.ts                ← FROZEN — output E1-UX-01, jangan override token
├── tsconfig.json                     ← strict: true, paths: { "@/*": ["./*"] }
├── middleware.ts                     ← Auth route protection (lihat §7)
├── package.json
│
├── app/                              ← Next.js App Router root
│   ├── layout.tsx                    ← Root layout: <html>, <body>, font, default metadata
│   ├── not-found.tsx                 ← Halaman 404 global (HTTP 404, menggunakan root layout)
│   ├── error.tsx                     ← Global runtime error boundary
│   ├── sitemap.ts                    ← Auto-generate sitemap.xml
│   ├── robots.ts                     ← robots.txt config
│   │
│   ├── (public)/                     ← Route group: semua halaman publik
│   │   ├── layout.tsx                ← Wrapper: <Navbar /> + <main> + <Footer />
│   │   ├── loading.tsx               ← Page-level skeleton (CardSkeleton × n)
│   │   ├── page.tsx                  ← / — Homepage (SSG, revalidate: 3600)
│   │   ├── produk/
│   │   │   ├── page.tsx              ← /produk — Katalog 5 produk (SSG)
│   │   │   └── [slug]/
│   │   │       └── page.tsx          ← /produk/[slug] — Detail produk (SSG + generateStaticParams)
│   │   ├── tentang-kami/
│   │   │   └── page.tsx              ← /tentang-kami (SSG, revalidate: 86400)
│   │   ├── kontak/
│   │   │   └── page.tsx              ← /kontak (SSG, form = client-side)
│   │   ├── artikel/
│   │   │   ├── page.tsx              ← /artikel — Daftar + pagination (ISR, revalidate: 300)
│   │   │   └── [slug]/
│   │   │       └── page.tsx          ← /artikel/[slug] — Detail artikel (ISR + revalidateTag)
│   │   ├── kalkulator/
│   │   │   └── page.tsx              ← /kalkulator (SSG, logika 100% client-side)
│   │   ├── minta-penawaran/
│   │   │   ├── page.tsx              ← /minta-penawaran — Form RFQ (SSG, form = client-side)
│   │   │   └── terima-kasih/
│   │   │       └── page.tsx          ← /minta-penawaran/terima-kasih — Konfirmasi
│   │   └── jadi-supplier/
│   │       ├── page.tsx              ← /jadi-supplier — Form supplier (SSG)
│   │       └── terima-kasih/
│   │           └── page.tsx          ← /jadi-supplier/terima-kasih — Konfirmasi
│   │
│   ├── (auth)/                       ← Route group: auth pages (layout terisolasi)
│   │   └── admin/
│   │       └── login/
│   │           ├── layout.tsx        ← Layout TERSENDIRI — tanpa Navbar/Footer publik
│   │           └── page.tsx          ← /admin/login ('use client', react-hook-form + zod)
│   │
│   ├── admin/                        ← Admin panel — semua route protected via middleware
│   │   ├── layout.tsx                ← Server Component: session check + AdminSidebar + AdminHeader
│   │   ├── loading.tsx               ← TableRowSkeleton × 8
│   │   ├── error.tsx                 ← Admin error boundary ("Sistem sedang maintenance")
│   │   ├── dashboard/
│   │   │   └── page.tsx              ← /admin/dashboard (Server Component)
│   │   ├── leads/
│   │   │   ├── page.tsx              ← /admin/leads — Kanban pipeline ('use client')
│   │   │   └── [id]/
│   │   │       └── page.tsx          ← /admin/leads/[id] — Detail lead ('use client')
│   │   ├── suppliers/
│   │   │   ├── page.tsx              ← /admin/suppliers
│   │   │   └── [id]/
│   │   │       └── page.tsx          ← /admin/suppliers/[id]
│   │   ├── articles/
│   │   │   ├── page.tsx              ← /admin/articles — List + publish toggle
│   │   │   ├── new/
│   │   │   │   └── page.tsx          ← /admin/articles/new — Rich text editor
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx      ← /admin/articles/[id]/edit
│   │   ├── products/
│   │   │   ├── page.tsx              ← /admin/products
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx      ← /admin/products/[id]/edit
│   │   └── settings/
│   │       └── page.tsx              ← /admin/settings
│   │
│   └── api/                          ← Next.js Route Handlers (proxy tipis ke FastAPI jika perlu)
│       └── revalidate/
│           └── route.ts              ← Webhook untuk revalidateTag (dipanggil saat admin update konten)
│
├── components/
│   ├── ui/                           ← shadcn/ui base components (JANGAN edit langsung)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── form.tsx
│   │   ├── card.tsx
│   │   ├── skeleton.tsx
│   │   ├── badge.tsx
│   │   ├── separator.tsx
│   │   ├── dropdown-menu.tsx
│   │   └── skeletons/                ← Custom skeleton library (E1-UX-08)
│   │       ├── index.ts              ← Barrel export
│   │       ├── TextLineSkeleton.tsx
│   │       ├── ImageSkeleton.tsx
│   │       ├── CardSkeleton.tsx
│   │       └── TableRowSkeleton.tsx
│   │
│   ├── brand/                        ← Komponen yang menggunakan brand tokens secara spesifik
│   │   ├── Button.tsx                ← Brand-styled button (extends shadcn Button)
│   │   ├── Badge.tsx                 ← SNI badge, status badge
│   │   └── SaltParticles.tsx         ← Animasi partikel garam (dekoratif)
│   │
│   ├── layout/                       ← Layout global
│   │   ├── Navbar.tsx                ← 'use client' — mobile state, scroll detection
│   │   ├── Footer.tsx                ← Server Component — no interactivity needed
│   │   ├── AdminSidebar.tsx          ← 'use client' — usePathname, logout handler
│   │   └── AdminHeader.tsx           ← Server Component — props: title, breadcrumb
│   │
│   ├── sections/                     ← Section-level komponen halaman publik
│   │   ├── HeroSection.tsx
│   │   ├── StatsBar.tsx
│   │   ├── ProductsPreview.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── IndustriesGrid.tsx
│   │   ├── CredibilitySection.tsx
│   │   └── CTASection.tsx
│   │
│   ├── blocks/                       ← Reusable content blocks
│   │   ├── ProductCard.tsx
│   │   ├── ArticleCard.tsx
│   │   ├── StatCard.tsx
│   │   └── LeadCard.tsx
│   │
│   ├── forms/                        ← Form kompleks ('use client')
│   │   ├── RFQForm.tsx               ← react-hook-form + zod + prefill dari query params
│   │   ├── SupplierForm.tsx
│   │   ├── ContactForm.tsx
│   │   └── ArticleEditor.tsx         ← Tiptap rich text editor
│   │
│   ├── animations/                   ← Komponen animasi
│   │   ├── RevealWrapper.tsx         ← IntersectionObserver wrapper untuk .reveal-up
│   │   └── AnimatedCounter.tsx
│   │
│   └── admin/                        ← Admin panel components
│       ├── LeadKanban.tsx
│       ├── LeadStatusBadge.tsx
│       ├── WATemplateModal.tsx
│       └── ProposalPreview.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts                 ← createServerClient() — untuk Server Components & Route Handlers
│   │   ├── client.ts                 ← createBrowserClient() — untuk Client Components
│   │   └── middleware.ts             ← updateSession() — dipanggil di middleware.ts
│   ├── env.ts                        ← Type-safe env access dengan runtime validation
│   ├── api.ts                        ← Typed fetch wrapper ke FastAPI (auth header, timeout, error)
│   ├── wa-link.ts                    ← generateWALink(nomor, pesan) → URL wa.me
│   └── utils.ts                      ← cn(), formatDate(), formatVolume(), dll.
│
├── hooks/
│   ├── use-scroll-y.ts               ← Scroll position untuk navbar shadow
│   ├── use-media-query.ts            ← Responsive helper
│   └── use-local-storage.ts          ← Persist kalkulator state (opsional)
│
├── constants/
│   ├── navigation.ts                 ← NAV_ITEMS array untuk Navbar & Footer
│   ├── admin-navigation.ts           ← ADMIN_NAV untuk AdminSidebar
│   ├── products.ts                   ← PRODUCT_SLUGS[], VALID_SLUGS[]
│   ├── industries.ts                 ← INDUSTRIES[] untuk dropdown RFQ & kalkulator
│   └── salt-types.ts                 ← SALT_TYPES[] untuk multi-select RFQ
│
├── types/
│   ├── index.ts                      ← Barrel export semua types
│   ├── api.ts                        ← TypeScript interfaces yang match Pydantic schemas (§16)
│   ├── database.ts                   ← Types yang di-generate dari Supabase schema
│   └── components.ts                 ← Shared prop types
│
└── supabase/                         ← Supabase CLI — SEMUA perubahan DB melalui ini
    ├── config.toml
    └── migrations/
        ├── 20260601000000_base_rls_setup.sql
        ├── 20260601000001_company_settings.sql      ← Epic 2
        ├── 20260601000002_products.sql               ← Epic 3
        ├── 20260601000003_rfq_leads.sql              ← Epic 4
        ├── 20260601000004_lead_status_history.sql    ← Epic 4
        ├── 20260601000005_supplier_registrations.sql ← Epic 5
        └── 20260601000006_articles.sql               ← Epic 6
```

---

## 3. Struktur Folder — Backend

```
/backend/                             ← FastAPI project (di-deploy terpisah ke Railway)
├── main.py                           ← Entry point: app init, middleware, router registration
├── requirements.txt                  ← pip freeze output
├── Procfile                          ← web: uvicorn main:app --host 0.0.0.0 --port $PORT
├── .env.example                      ← Template env vars backend (di-commit)
├── .env                              ← Actual values (TIDAK di-commit)
│
├── core/
│   ├── config.py                     ← pydantic-settings: semua env vars divalidasi saat startup
│   └── supabase.py                   ← Supabase client singleton untuk FastAPI
│
├── routers/
│   ├── __init__.py
│   ├── auth.py                       ← POST /auth/login, POST /auth/logout, GET /auth/me
│   ├── rfq.py                        ← POST /rfq/generate, GET /rfq/leads, PATCH /rfq/leads/{id}
│   ├── supplier.py                   ← POST /supplier/register, GET /supplier, PATCH /supplier/{id}
│   ├── articles.py                   ← CRUD /articles, PATCH /articles/{id}/publish
│   ├── products.py                   ← GET /products, PUT /products/{id}
│   ├── settings.py                   ← GET /settings, PATCH /settings
│   └── contact.py                    ← POST /contact/send
│
├── schemas/
│   ├── __init__.py
│   ├── auth.py                       ← LoginRequest, AuthResponse, UserProfile
│   ├── rfq.py                        ← RFQCreate, RFQLeadResponse, LeadStatusUpdate
│   ├── supplier.py                   ← SupplierCreate, SupplierResponse
│   ├── article.py                    ← ArticleCreate, ArticleUpdate, ArticleResponse
│   ├── product.py                    ← ProductUpdate, ProductResponse
│   └── common.py                     ← ApiError { detail: str, code: str }, PaginatedResponse
│
├── dependencies/
│   ├── __init__.py
│   └── auth.py                       ← get_current_user() — FastAPI Dependency untuk [AUTH] endpoints
│
└── services/
    ├── __init__.py
    ├── proposal_generator.py         ← Logika Anthropic API call + fallback template statis
    ├── email_service.py              ← Wrapper Resend API
    └── wa_template.py                ← Generate WA message per status lead
```

---

## 4. Route Groups & App Router Conventions

### 4.1 Pemetaan Route Group → Layout

| Route Group | Folder | Layout File | Yang Di-render |
|-------------|--------|-------------|----------------|
| `(public)` | `app/(public)/` | `app/(public)/layout.tsx` | `<Navbar>` + `<main>{children}</main>` + `<Footer>` |
| `(auth)` | `app/(auth)/admin/login/` | `app/(auth)/admin/login/layout.tsx` | Isolasi penuh — tidak ada Navbar/Footer |
| `admin` | `app/admin/` | `app/admin/layout.tsx` | `<AdminSidebar>` + `<main>{children}</main>` |
| Root | `app/` | `app/layout.tsx` | `<html>`, `<body>`, font, default metadata — tanpa navigasi |

### 4.2 Layout Hierarchy

```
app/layout.tsx                              ← Root: <html lang="id">, <body>, font vars
├── app/(public)/layout.tsx                 ← Extends root: <Navbar> + <Footer>
│   └── app/(public)/page.tsx
│
├── app/(auth)/admin/login/layout.tsx       ← Extends root: override total, NO navbar/footer
│   └── app/(auth)/admin/login/page.tsx
│
└── app/admin/layout.tsx                    ← Extends root: session check + admin shell
    └── app/admin/dashboard/page.tsx
```

**Kritis:** `app/(auth)/admin/login/` dan `app/admin/` adalah route group terpisah. Login page di `(auth)` group agar tidak di-wrap `app/admin/layout.tsx` yang melakukan session check → mencegah infinite redirect loop.

### 4.3 Rendering Strategy per Route

| Route | Strategy | Revalidation | `generateStaticParams` |
|-------|----------|-------------|------------------------|
| `/` | SSG | `revalidate: 3600` | — |
| `/produk` | SSG | `revalidate: 1800` | — |
| `/produk/[slug]` | SSG | `revalidateTag('products')` | ✅ 5 slug |
| `/tentang-kami` | SSG | `revalidate: 86400` | — |
| `/kontak` | SSG | static | — |
| `/artikel` | ISR | `revalidate: 300` | — |
| `/artikel/[slug]` | ISR | `revalidateTag('articles')` | ✅ semua published slug |
| `/kalkulator` | SSG | static (client-only) | — |
| `/minta-penawaran` | SSG | static (client-only) | — |
| `/jadi-supplier` | SSG | static (client-only) | — |
| `/admin/*` | Dynamic | `cache: 'no-store'` | — |

### 4.4 Special Files

| File | Lokasi | Fungsi |
|------|--------|--------|
| `not-found.tsx` | `app/not-found.tsx` | Global 404 — HTTP 404, root layout tampil |
| `error.tsx` | `app/error.tsx` | Global runtime error — `'use client'` wajib |
| `error.tsx` | `app/admin/error.tsx` | Admin-scoped error boundary |
| `loading.tsx` | `app/(public)/loading.tsx` | Skeleton untuk navigasi publik |
| `loading.tsx` | `app/admin/loading.tsx` | Skeleton untuk halaman admin |
| `sitemap.ts` | `app/sitemap.ts` | Auto-generate sitemap.xml |
| `robots.ts` | `app/robots.ts` | robots.txt — noindex untuk `/admin/*` |

---

## 5. Server vs Client Component — Aturan & Decision Tree

### 5.1 Aturan Dasar

**Default: Server Component.** Tambahkan `'use client'` hanya jika membutuhkan:

| Kebutuhan | API/Hook |
|-----------|---------|
| State reaktif | `useState`, `useReducer` |
| Side effects | `useEffect`, `useLayoutEffect` |
| Browser APIs | `window`, `document`, `localStorage` |
| Event handlers di JSX | `onClick`, `onChange`, `onSubmit` |
| Route-dependent client state | `usePathname()`, `useSearchParams()`, `useRouter()` |
| Animasi interaktif | IntersectionObserver, gesture libraries |

### 5.2 Decision Tree

```
Butuh useState / useEffect / browser event?
├── YA  → 'use client'
└── TIDAK
    Butuh usePathname / useSearchParams / useRouter?
    ├── YA  → 'use client'
    └── TIDAK
        Akses data server-side (Supabase, env server-only)?
        ├── YA  → Server Component — JANGAN tambah 'use client'
        └── TIDAK → Server Component by default
```

### 5.3 Mapping Direktif per File (Epic 1)

| File | Directive | Alasan |
|------|-----------|--------|
| `app/(public)/layout.tsx` | Server | Hanya render Navbar + Footer sebagai children |
| `app/(public)/page.tsx` | Server | Fetch data Supabase, SSG |
| `app/admin/layout.tsx` | Server | `getUser()` server-side, session check + redirect |
| `app/admin/dashboard/page.tsx` | Server | Baca user dari session, render placeholder |
| `app/admin/leads/page.tsx` | **'use client'** | Kanban drag-drop, filter state, real-time fetch |
| `app/(auth)/admin/login/page.tsx` | **'use client'** | react-hook-form, signIn(), router.push() |
| `app/not-found.tsx` | Server | Static content, tidak ada interaksi |
| `app/error.tsx` | **'use client'** | Next.js requirement: error boundaries wajib client |
| `components/layout/Navbar.tsx` | **'use client'** | useState(isOpen), useScrollY, usePathname |
| `components/layout/Footer.tsx` | Server | Static markup, tidak ada state |
| `components/layout/AdminSidebar.tsx` | **'use client'** | usePathname() active detection, signOut() |
| `components/layout/AdminHeader.tsx` | Server | Props-only (title, breadcrumb), no state |
| `components/forms/RFQForm.tsx` | **'use client'** | react-hook-form, useSearchParams untuk prefill |
| `components/forms/ArticleEditor.tsx` | **'use client'** | Tiptap membutuhkan DOM |

### 5.4 Pola Komposisi: Server Wrapper + Client Leaf

Gunakan ketika satu halaman butuh server data + client interactivity:

```tsx
// app/(public)/produk/[slug]/page.tsx — Server Component
// Fetch data di server, pass ke client leaf sebagai props

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: product } = await supabase.from('products').select('*').eq('slug', params.slug).single()
  if (!product) notFound()
  return <ProductDetailView product={product} /> // 'use client' — handle tabs, accordion
}

// components/sections/ProductDetailView.tsx — 'use client'
'use client'
export function ProductDetailView({ product }: { product: Product }) {
  const [activeTab, setActiveTab] = useState<'specs' | 'usage'>('specs')
  // ...
}
```

---

## 6. Data Fetching Patterns

### 6.1 Kapan Direct ke Supabase vs ke FastAPI

| Skenario | Target | Alasan |
|----------|--------|--------|
| Public read produk, artikel, settings | **Supabase** langsung | SSG-compatible, RLS mengizinkan public read, zero FastAPI overhead |
| Admin baca leads & supplier | **FastAPI** | JWT validation + business logic (filter, sort, pagination) |
| Submit form RFQ dari publik | **FastAPI** `/rfq/generate` | Trigger AI (Anthropic) + email (Resend) — tidak bisa dari browser langsung |
| Submit form supplier dari publik | **FastAPI** `/supplier/register` | Trigger notifikasi email ke admin |
| Admin update status lead | **FastAPI** `PATCH /rfq/leads/{id}` | Catat histori status, validasi state machine |
| Admin CRUD artikel | **Supabase** langsung | Simple CRUD tanpa business logic kompleks |
| Admin upload foto/PDF | **Supabase Storage** langsung | File upload → Storage → simpan URL ke DB |
| Generate WA template | **FastAPI** `POST /rfq/wa-template` | Template generation logic di Python |

### 6.2 Server Component Fetch (SSG/ISR)

```typescript
// app/(public)/produk/[slug]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

// SSG + tag-based revalidation
export const dynamic = 'force-static'
export const revalidate = false

export async function generateStaticParams() {
  return [
    { slug: 'garam-halus-yodium' },
    { slug: 'garam-halus-non-yodium' },
    { slug: 'garam-kasar-industri' },
    { slug: 'garam-kasar-petani' },
    { slug: 'garam-ghpt' },
  ]
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('slug', params.slug)
    .single()
  if (!product) notFound()
  return <ProductDetailView product={product} />
}
```

### 6.3 Client Component Fetch (Admin — real-time, no-store)

```typescript
// components/admin/LeadsTable.tsx
'use client'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { TableRowSkeleton } from '@/components/ui/skeletons'
import type { RFQLead } from '@/types/api'

export function LeadsTable() {
  const [leads, setLeads] = useState<RFQLead[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiFetch<RFQLead[]>('/rfq/leads', { auth: true })
      .then(setLeads)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <TableRowSkeleton rows={8} />
  return <>{/* render leads */}</>
}
```

### 6.4 `lib/api.ts` — Typed Fetch Wrapper ke FastAPI

```typescript
// lib/api.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

interface FetchOptions extends RequestInit {
  auth?: boolean    // true = tambahkan Authorization: Bearer <token>
  timeout?: number  // default: 10000ms. AI endpoints: 35000ms
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { auth = false, timeout = 10_000, ...rest } = options
  const headers: HeadersInit = { 'Content-Type': 'application/json' }

  if (auth) {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('UNAUTHORIZED')
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(`${BASE_URL}/api/v1${path}`, {
      headers, signal: controller.signal, ...rest,
    })
    clearTimeout(id)
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail)
    }
    return res.json() as Promise<T>
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}
```

### 6.5 Cache Invalidation via Webhook

```typescript
// app/api/revalidate/route.ts

import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { tag, secret } = await request.json()
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  revalidateTag(tag) // 'products' | 'articles' | 'settings'
  return NextResponse.json({ revalidated: true, tag })
}
```

### 6.6 Caching Strategy Summary

| Data | Fetch Location | Cache Config | Invalidation |
|------|---------------|-------------|-------------|
| Produk (public) | Server Component | `revalidate: 1800` | `revalidateTag('products')` |
| Artikel list (public) | Server Component | `revalidate: 300` | `revalidateTag('articles')` |
| Artikel detail (public) | Server Component | `revalidate: 300` | `revalidateTag('articles')` |
| Company settings | Server Component | `revalidate: 3600` | `revalidatePath('/kontak')` |
| Leads (admin) | Client Component | `cache: 'no-store'` | Manual re-fetch |
| AI proposal | FastAPI side | — | Tidak di-cache |

---

## 7. Auth & Middleware Contract

### 7.1 Package

```
@supabase/ssr   ← WAJIB digunakan
```

> **DILARANG:** `@supabase/auth-helpers` — deprecated, jangan install.

### 7.2 `middleware.ts` — Implementasi

```typescript
// middleware.ts — root project, sejajar dengan /app

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // WAJIB: refresh session di setiap request
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = new URL(request.url)
  const isAdminPath = pathname.startsWith('/admin')
  const isLoginPath = pathname === '/admin/login'

  // RULE 1: /admin/* (bukan login) + !user → redirect login
  if (isAdminPath && !isLoginPath && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // RULE 2: /admin/login + user aktif → redirect dashboard
  if (isLoginPath && user) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

### 7.3 4 Redirect Rules — Absolut & Tidak Boleh Dilanggar

| # | Trigger | Kondisi | Aksi | Lokasi |
|---|---------|---------|------|--------|
| 1 | GET `/admin/*` | Path bukan `/admin/login` **dan** `!user` | `redirect('/admin/login')` | `middleware.ts` |
| 2 | GET `/admin/login` | `user` valid | `redirect('/admin/dashboard')` | `middleware.ts` |
| 3 | POST login sukses | `signInWithPassword()` resolve | `router.push('/admin/dashboard')` | `app/(auth)/admin/login/page.tsx` |
| 4 | Click Logout | `signOut()` selesai | `router.push('/admin/login')` | `AdminSidebar.tsx` |

### 7.4 Double Guard di Admin Layout

```typescript
// app/admin/layout.tsx — Server Component, second line of defense
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Middleware sudah handle ini — ini safety net
  if (!user) redirect('/admin/login')

  return (
    <div className="flex min-h-screen min-h-dvh">
      <AdminSidebar userEmail={user.email!} />
      <div className="flex-1 flex flex-col lg:ml-[240px]">
        <main id="admin-main-content" className="flex-1 bg-neutral-50 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### 7.5 Cookie Configuration

| Property | Value | Alasan |
|----------|-------|--------|
| `httpOnly` | `true` | Tidak bisa dibaca JS di browser |
| `secure` | `true` (production) | HTTPS only |
| `sameSite` | `'lax'` | CSRF protection + link dari external OK |
| `path` | `'/'` | Berlaku di semua route |
| JWT expiry | `3600s` | Set di Supabase Auth settings |
| Refresh token | Auto-rotate via `updateSession()` | Di setiap middleware hit |

### 7.6 Edge Cases Auth

| Case | Handling |
|------|---------|
| Token expired saat sesi aktif | Middleware auto-refresh. Jika gagal → redirect login |
| Multiple tabs buka bersamaan | `@supabase/ssr` sync cookies antar tab |
| Back button setelah logout | Middleware detects `!user` → redirect login |
| Brute force login | FastAPI: `slowapi` rate limit 5 req/IP/min → HTTP 429 + `Retry-After: 60` |

---

## 8. Supabase Client Usage per Context

### 8.1 Empat Konteks

| Konteks | File | Function | Note |
|---------|------|----------|------|
| Server Component / Route Handler | `lib/supabase/server.ts` | `createServerClient(...)` | Baca cookies dari Next.js headers |
| Client Component | `lib/supabase/client.ts` | `createBrowserClient(...)` | Singleton di browser |
| Middleware | inline di `middleware.ts` | `createServerClient(...)` | Dengan cookie getAll/setAll untuk refresh |
| FastAPI | `core/supabase.py` | Python Supabase SDK | Service role key untuk admin ops |

### 8.2 Implementasi

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )
}

// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```python
# core/supabase.py
from supabase import create_client, Client
from core.config import settings

_client: Client | None = None

def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return _client
```

---

## 9. Konvensi Penamaan

### 9.1 File & Folder

| Tipe | Konvensi | Contoh |
|------|----------|--------|
| React component | `PascalCase.tsx` | `Navbar.tsx`, `ProductCard.tsx` |
| Non-component TypeScript | `kebab-case.ts` | `api.ts`, `wa-link.ts`, `use-scroll-y.ts` |
| Next.js special files | snake_case (konvensi Next.js) | `page.tsx`, `layout.tsx`, `not-found.tsx` |
| Constants | `kebab-case.ts` | `navigation.ts`, `admin-navigation.ts` |
| Python modules | `snake_case.py` | `auth.py`, `proposal_generator.py` |
| Migration files | `{timestamp}_{description}.sql` | `20260601000000_base_rls_setup.sql` |

### 9.2 Identifier

| Tipe | Konvensi | Contoh |
|------|----------|--------|
| React component | `PascalCase` | `function Navbar()`, `export function ProductCard()` |
| Hook | `use` prefix + `camelCase` | `useScrollY()`, `useMediaQuery()` |
| Utility function | `camelCase` | `generateWALink()`, `formatVolume()` |
| Constant array/object | `SCREAMING_SNAKE_CASE` | `NAV_ITEMS`, `PRODUCT_SLUGS`, `VALID_STATUSES` |
| TypeScript type/interface | `PascalCase` | `interface RFQLead`, `type LeadStatus` |
| Pydantic model | `PascalCase` | `class LoginRequest(BaseModel)` |

### 9.3 CSS

- **Tailwind utility classes only** — tidak ada CSS Modules atau styled-components
- Custom CSS hanya di `globals.css` (frozen) — jangan re-declare class yang sudah ada
- Custom utility classes tersedia: `.skeleton`, `.skeleton-teal`, `.reveal-up`, `.reveal-scale`, `.nav-underline`, `.link-animated`, `.page-transition`, `.bg-dot-grid`, `.bg-brand-animated`

### 9.4 Git Branch

| Branch | Purpose | Deploy |
|--------|---------|--------|
| `main` | Production | Vercel prod + Railway prod |
| `dev` | Staging | Vercel staging + Railway staging |
| `feature/{task-id}-{slug}` | Feature work | Vercel preview |

Contoh: `feature/E1-ENG-20-navbar-desktop`

---

## 10. Environment Variables

### 10.1 Next.js (Vercel)

| Variable | Scope | Keterangan |
|----------|-------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key |
| `SUPABASE_SERVICE_KEY` | **Server-only** | Service role key — JANGAN prefix `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_API_URL` | Public | Railway FastAPI base URL |
| `NEXT_PUBLIC_SENTRY_DSN` | Public | Sentry DSN frontend |
| `REVALIDATION_SECRET` | **Server-only** | Secret untuk webhook revalidation |

### 10.2 FastAPI (Railway)

| Variable | Keterangan |
|----------|-----------|
| `SUPABASE_URL` | Sama dengan Next.js |
| `SUPABASE_SERVICE_KEY` | Service role untuk admin DB operations |
| `ANTHROPIC_API_KEY` | Claude API key — proposal generation |
| `RESEND_API_KEY` | Resend API key — email notifications |
| `ALLOWED_ORIGINS` | Comma-separated: `https://reka-cipta.vercel.app,http://localhost:3000` |
| `SENTRY_DSN` | Sentry DSN backend |
| `ENVIRONMENT` | `staging` atau `production` |
| `REVALIDATION_SECRET` | Sama dengan Next.js — untuk trigger cache invalidation |

### 10.3 Type-safe Access

```typescript
// lib/env.ts

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required env var: ${key}`)
  return value
}

export const env = {
  supabaseUrl: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  apiUrl: requireEnv('NEXT_PUBLIC_API_URL'),
} as const
// Server-only vars diakses langsung via process.env di server context
```

```python
# core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    ANTHROPIC_API_KEY: str
    RESEND_API_KEY: str
    ALLOWED_ORIGINS: str
    SENTRY_DSN: str
    ENVIRONMENT: str = "staging"
    REVALIDATION_SECRET: str

    class Config:
        env_file = ".env"

settings = Settings()  # Validasi saat startup — crash early jika ada yang missing
```

---

## 11. Design System Integration

### 11.1 File yang Sudah Fixed — Jangan Diubah

```
tailwind.config.ts   ← FROZEN — output E1-UX-01
globals.css          ← FROZEN — output E1-UX-01
```

Setiap penambahan token baru wajib didiskusikan, diputuskan tim, dan didokumentasikan di sini dengan alasan.

### 11.2 Token Referensi Cepat (Design System v2.0)

```
/* Warna */
brand-teal-600  #0B7D6E  ← Primary brand, CTA, button utama
brand-teal-500  #0F9E8B  ← Primary hover
ink-700         #173F3A  ← Heading halaman publik
ink-900         #0A1E1C  ← Admin sidebar, footer background
sand-600        #8A6535  ← Accent supplier/petani section
neutral-50      #F9FAFB  ← Page background
neutral-900     #111827  ← Body text utama

/* Shadow (teal-tinted) */
shadow-sm    0 2px 4px rgba(11,125,110,0.06)...
shadow-focus 0 0 0 2px #FFFFFF, 0 0 0 4px #0B7D6E

/* Skeleton */
.skeleton      ← shimmer neutral (dari globals.css)
.skeleton-teal ← shimmer teal brand
```

### 11.3 shadcn/ui Configuration

```
Style      : Default
Base color : Neutral (keputusan final dicatat setelah E1-SPIKE-06)
Komponen Epic 1 : Button Input Label Form Card Skeleton Badge Separator DropdownMenu
```

### 11.4 Font Loading — `next/font` (direkomendasikan)

```typescript
// app/layout.tsx
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-sans',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
```

> **Keputusan wajib di E1-SPIKE-06:** Pilih `next/font` (diatas) ATAU `@import` di `globals.css` — jangan keduanya. Default rekomendasi: `next/font` untuk performa optimal (self-hosted, no FOUC). Jika memilih `next/font`, hapus baris `@import` di `globals.css`.

### 11.5 Dark Mode

Dark mode (`darkMode: 'class'` di Tailwind) disiapkan tapi **belum diaktifkan di v1**. Semua CSS variables `.dark` sudah tersedia di `globals.css`. Admin panel akan mengaktifkan di v2 dengan menambahkan class `.dark` ke wrapper admin layout.

### 11.6 Animation Library — framer-motion (Epic 2 Slice 1, E2-S1-LIB-01)

| Package | Versi | Dipakai oleh | Catatan |
|---|---|---|---|
| `framer-motion` | ^11.x | HeroSection (stagger), HowItWorks (useScroll), InteractiveDistributionMap (AnimatePresence) | ~50KB gzipped. HowItWorks WAJIB dynamic import (`ssr: false`) agar tidak masuk initial bundle — lihat E2-S1-FE-09. Komponen lain boleh static import karena above-the-fold. |

---

## 12. Integration Points

### 12.1 Supabase Auth Flow

```
Browser               Next.js (Vercel)             Supabase Auth
   │                        │                            │
   │── submit login form ──►│                            │
   │   (react-hook-form)    │── signInWithPassword() ───►│
   │                        │◄── { session, user } ──────│
   │◄── Set-Cookie ─────────│                            │
   │    redirect /admin/dashboard                        │
   │                        │                            │
   │── GET /admin/dashboard►│                            │
   │                        │── middleware: getUser() ──►│
   │                        │◄── user ───────────────────│
   │◄── 200 HTML ───────────│                            │
```

### 12.2 RFQ + AI Proposal Flow

```
Browser         Next.js          FastAPI              Anthropic    Resend
   │               │                │                     │           │
   │── submit ────►│                │                     │           │
   │               │── POST /rfq ──►│                     │           │
   │               │                │── INSERT leads      │           │
   │               │                │── Claude API ──────►│           │
   │               │                │◄── proposal HTML ───│           │
   │               │                │── email mitra ─────────────────►│
   │               │                │── notif admin ─────────────────►│
   │               │◄── success ────│                     │           │
   │◄── redirect /terima-kasih      │                     │           │
```

**AI timeout:** 35 detik (override `timeout` di `apiFetch()`).  
**Fallback:** Anthropic timeout → kirim template statis, `proposal_generated = false`.

### 12.3 Sentry Configuration

```typescript
// sentry.client.config.ts (auto-generated oleh wizard)
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0, // Disable — privacy concern
})
```

```python
# main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    environment=settings.ENVIRONMENT,
    traces_sample_rate=0.2,
    integrations=[FastApiIntegration()],
)
```

### 12.4 Supabase Storage URL Pattern

```
Public URL: https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<filename>

Buckets:
  product-photos     → public read, auth write
  lab-docs           → public read, auth write
  article-thumbnails → public read, auth write
  legal-docs         → private (signed URL), auth write
```

### 12.5 WhatsApp Deep Link

```typescript
// lib/wa-link.ts
export function generateWALink(nomor: string, pesan: string): string {
  const normalized = nomor.replace(/^0/, '62').replace(/\D/g, '')
  return `https://wa.me/${normalized}?text=${encodeURIComponent(pesan)}`
}

// Nomor perusahaan dari PRD §14.2:
// WA 1: 082136096528 → wa.me/6282136096528
// WA 2: 087839031378 → wa.me/6287839031378
```

---

## 13. Database Schema & RLS Patterns

### 13.1 Tabel per Epic

| Tabel | Dibuat di | RLS Pattern |
|-------|-----------|-------------|
| `auth.users` | Epic 1 | Supabase built-in |
| `company_settings` | Epic 2 | Public READ, Auth WRITE |
| `products` | Epic 3 | Public READ, Auth WRITE |
| `rfq_leads` | Epic 4 | Public INSERT, Auth READ+WRITE |
| `lead_status_history` | Epic 4 | Auth READ+WRITE |
| `supplier_registrations` | Epic 5 | Public INSERT, Auth READ+WRITE |
| `articles` | Epic 6 | Public READ (published only), Auth full |

### 13.2 RLS Policy Templates

**Pattern A — Public READ, Auth WRITE** (`company_settings`, `products`):
```sql
CREATE POLICY "public_read" ON products FOR SELECT USING (true);
CREATE POLICY "auth_write" ON products FOR ALL
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
```

**Pattern B — Public INSERT, Auth READ+WRITE** (`rfq_leads`, `supplier_registrations`):
```sql
CREATE POLICY "public_insert" ON rfq_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_select" ON rfq_leads FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update" ON rfq_leads FOR UPDATE USING (auth.uid() IS NOT NULL);
```

**Pattern C — Conditional READ** (`articles`):
```sql
-- Publik bisa SELECT hanya yang published; admin bisa semua
CREATE POLICY "public_read_published" ON articles FOR SELECT
  USING (is_published = true OR auth.uid() IS NOT NULL);
CREATE POLICY "auth_all" ON articles FOR ALL USING (auth.uid() IS NOT NULL);
```

### 13.3 Supabase Storage Buckets

| Bucket | Public | Write |
|--------|--------|-------|
| `product-photos` | ✅ | Authenticated |
| `lab-docs` | ✅ | Authenticated |
| `article-thumbnails` | ✅ | Authenticated |
| `legal-docs` | ❌ (signed URL) | Authenticated |

### 13.4 Migration Workflow

```bash
# Buat migration baru
npx supabase migration new nama_migration

# Apply ke Supabase cloud
npx supabase db push

# Diff schema dari perubahan lokal
npx supabase db diff

# Pull schema dari cloud (hindari — gunakan hanya untuk sync awal)
npx supabase db pull
```

**Aturan keras:** Semua perubahan schema via migration file yang di-commit ke Git. Dilarang edit schema langsung via Supabase dashboard.

---

## 14. Deployment & Branch Strategy

### 14.1 Branch → Environment

| Branch | Environment | Auto-deploy |
|--------|-------------|-------------|
| `main` | Production | Vercel prod + Railway prod |
| `dev` | Staging | Vercel staging + Railway staging |
| `feature/*` | Preview | Vercel preview only |

### 14.2 Railway — FastAPI

```
# /backend/Procfile
web: uvicorn main:app --host 0.0.0.0 --port $PORT

# Railway detect Python via requirements.txt
# Root directory: /backend (set di Railway dashboard)
```

### 14.3 HTTP Security Headers

```javascript
// next.config.js
const securityHeaders = [
  { key: 'X-Frame-Options',            value: 'DENY' },
  { key: 'X-Content-Type-Options',     value: 'nosniff' },
  { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection',           value: '1; mode=block' },
  { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security',  value: 'max-age=63072000; includeSubDomains; preload' },
]

module.exports = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}
```

Target **securityheaders.com**: minimum grade **B**.

---

## 15. Observability

### 15.1 Sentry

| Platform | Config | Sample Rate |
|----------|--------|-------------|
| Next.js Client | `sentry.client.config.ts` | Traces 10% |
| Next.js Server | `sentry.server.config.ts` | Traces 10% |
| Next.js Edge | `sentry.edge.config.ts` | Traces 10% |
| FastAPI | `main.py` | Traces 20% |

Source maps wajib di-upload ke Sentry saat build (stacktrace terbaca, bukan minified).  
Alert rule: notifikasi email ke developer saat ada error baru atau error spike.

### 15.2 Structured Logging FastAPI

```python
# main.py — JSON structured logging ke stdout (Railway logs)
import logging
from pythonjsonlogger import jsonlogger

logger = logging.getLogger()
handler = logging.StreamHandler()
handler.setFormatter(jsonlogger.JsonFormatter('%(asctime)s %(levelname)s %(name)s %(message)s'))
logger.addHandler(handler)
logger.setLevel(logging.WARNING)  # Production: WARNING+. Development: DEBUG
```

### 15.3 FastAPI CORS

```python
# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(','),  # dari env var, bukan hardcode
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allow_headers=['Authorization', 'Content-Type'],
)
```

---

## 16. API Contract — TypeScript ↔ Pydantic Alignment

**Aturan:** Setiap perubahan Pydantic schema di FastAPI **wajib** diikuti update `types/api.ts`. Tidak ada schema drift yang tidak didokumentasikan.

### 16.1 Types — Epic 1

| Pydantic (FastAPI) | TypeScript (Next.js) |
|-------------------|---------------------|
| `class LoginRequest` | `interface LoginRequest` |
| `class UserProfile` | `interface UserProfile` |
| `class AuthResponse` | `interface AuthResponse` |
| `class ApiError` | `interface ApiError` |
| `class CompanySettingItem`        | `interface CompanySettingItem`        |
| `class CompanySettingsResponse`   | `interface CompanySettingsResponse`   |
| `class CompanySettingUpdate`      | `interface CompanySettingUpdate`      |
| `class CompanySettingsBulkUpdate` | `interface CompanySettingsBulkUpdate` |

```typescript
// types/api.ts — Epic 1 types

export interface LoginRequest {
  email: string
  password: string
}

export interface UserProfile {
  id: string
  email: string
  created_at: string  // ISO 8601
}

export interface AuthResponse {
  access_token: string
  user: UserProfile
}

export interface ApiError {
  detail: string
  code: string
}

// Akan ditambahkan per epic:
// Epic 4: RFQLead, LeadStatus, WaTemplate
// Epic 5: SupplierRegistration
// Epic 6: Article, ArticleCreate
```

### 16.2 Keputusan: Tanpa openapi-typescript di v1

Manual sync dengan tabel di §16.1 sudah cukup untuk skala project saat ini. Evaluasi ulang jika endpoint > 20 atau team developer bertambah.

---

## 17. Epic 1 Validation Checklist

Validasi bahwa struktur arsitektur ini menampung semua task Epic 1 v1.1 **tanpa refactor besar**.

### Layer 1 — UX Tasks

| Task | Tersedia | File/Lokasi |
|------|----------|-------------|
| E1-UX-01 Design tokens | ✅ | `tailwind.config.ts` + `globals.css` (frozen, §11) |
| E1-UX-02 Navbar | ✅ | `components/layout/Navbar.tsx` `'use client'` |
| E1-UX-03 Footer | ✅ | `components/layout/Footer.tsx` Server Component |
| E1-UX-04 404 page | ✅ | `app/not-found.tsx` + root layout |
| E1-UX-05 Admin login | ✅ | `app/(auth)/admin/login/` isolated layout |
| E1-UX-06 Admin layout | ✅ | `app/admin/layout.tsx` + AdminSidebar + AdminHeader |
| E1-UX-07 Routing | ✅ | `middleware.ts` + 4 redirect rules §7.3 |
| E1-UX-08 Skeleton | ✅ | `components/ui/skeletons/` |

### Layer 2 — Spikes

| Task | Tersedia | Lokasi Keputusan |
|------|----------|-----------------|
| E1-SPIKE-01 App Router conventions | ✅ | Dokumen ini |
| E1-SPIKE-02 Supabase Auth + middleware | ✅ | §7–8 |
| E1-SPIKE-03 FastAPI structure | ✅ | §3 |
| E1-SPIKE-04 Vercel + Railway pipeline | ✅ | §14 |
| E1-SPIKE-05 RLS patterns | ✅ | §13.2 |
| E1-SPIKE-06 Tailwind + shadcn | ✅ | §11 — keputusan font di §11.4 |
| E1-SPIKE-07 Supabase CLI migration | ✅ | §13.4 + `supabase/migrations/` |
| E1-SPIKE-08 Sentry | ✅ | §15 |
| E1-SPIKE-09 API contract | ✅ | §16 |

### Layer 4 — Engineering Sub-tasks

| Sub-group | Tasks | Coverage |
|-----------|-------|----------|
| 4.1 Project Init | E1-ENG-01–07 | ✅ Folder §2, env §10, tsconfig §9 |
| 4.2 Supabase Setup | E1-ENG-08–13 | ✅ Client files §8, migration §13.4, buckets §13.3 |
| 4.3 Auth Middleware | E1-ENG-14–15 | ✅ `middleware.ts` §7.2 |
| 4.4 FastAPI Auth | E1-ENG-16–19 | ✅ `/backend/routers/auth.py` §3 |
| 4.5 Public Layout | E1-ENG-20–27 | ✅ Navbar, Footer, 404, Skeleton §2, font §11.4 |
| 4.6 Admin Panel | E1-ENG-28–32 | ✅ Login, Sidebar, Header, Layout, Dashboard §2 |
| 4.7 Deployment | E1-ENG-33–35 | ✅ §14 |
| 4.8 Observability | E1-ENG-36–37 | ✅ §15 |
| 4.9 Security | E1-ENG-38–39 | ✅ Headers §14.3, rate limiting §7.6 |
| 4.10 API Contract | E1-ENG-40 | ✅ §16 |

### Refactor Risks — Status Mitigasi

| Risk | Status | Mitigasi |
|------|--------|---------|
| Login page ter-wrap admin layout → infinite redirect | ✅ Dimitigasi | `(auth)/admin/login/` adalah route group terpisah dari `admin/` |
| `'use client'` berlebihan → performa buruk | ✅ Dimitigasi | Decision tree §5.2, default Server Component |
| Font import duplikat (CSS + next/font) | ⚠️ Perlu keputusan | Keputusan di E1-SPIKE-06, dokumentasikan di §11.4 |
| API URL hardcoded di komponen | ✅ Dimitigasi | Semua via `lib/api.ts` |
| TypeScript ↔ Pydantic schema drift | ✅ Dimitigasi | Tabel §16.1 + aturan wajib update bersamaan |
| Schema berubah via Supabase dashboard | ✅ Dimitigasi | Aturan keras §13.4: semua via `supabase db push` |
| Supabase service key ter-expose ke browser | ✅ Dimitigasi | Tidak pernah ada `NEXT_PUBLIC_` prefix di service key |

---

> **Update Protocol:** Setiap keputusan arsitektural baru — perubahan folder, routing, auth flow, data fetching pattern, atau stack — **wajib** didokumentasikan di sini sebelum implementasi, dengan format:
>
> ```markdown
## Changelog
| Tanggal | Versi | Perubahan | Alasan | Author |
|---------|-------|-----------|--------|--------|
| 2026-06-xx | 1.0 | Initial — output E1-SPIKE-01 | — | Jazi |
| 2026-06-xx | 1.1 | E1-SPIKE-02 validated: @supabase/ssr bekerja benar di Server Component (getUser() returns null, not error for unauth). RLS blocks anon correctly. | Spike hasil test | Jazi |
> ```

---

*ARCHITECTURE.md v1.0 · CV Reka Cipta Indonesia · Juni 2026*  
*Output: E1-SPIKE-01 — Next.js 14 App Router conventions & folder structure*
