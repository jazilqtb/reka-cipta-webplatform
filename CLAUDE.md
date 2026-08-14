# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CV Reka Cipta Indonesia — a monorepo containing a Next.js 14 frontend (deployed to Vercel) and a FastAPI backend (deployed to Railway), backed by Supabase (PostgreSQL + Auth + Storage). The site is a salt company's public website with a CRM admin panel for managing leads, articles, and suppliers.

**Node:** LTS 20.x (`.nvmrc` at root) | **Python:** 3.11+

---

## Commands

### Frontend (Next.js)

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
```

### Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000   # Dev server
```

### Database (Supabase CLI)

```bash
npx supabase migration new <name>   # Create new migration
npx supabase db push                # Apply migrations to Supabase cloud
npx supabase db diff                # Diff local vs cloud schema
```

**Hard rule:** All schema changes go through migration files committed to Git. Never edit schema directly via Supabase dashboard.

---

## Architecture

### Monorepo Layout

- `/` — Next.js 14 App Router root (frontend)
- `/backend/` — FastAPI project (deployed separately to Railway)
- `/supabase/migrations/` — All DB migrations via Supabase CLI

### Frontend: Route Groups

| Route Group | Folder | Layout |
|---|---|---|
| `(public)` | `app/(public)/` | `<Navbar>` + `<main>` + `<Footer>` |
| `(auth)` | `app/(auth)/admin/login/` | Isolated — no Navbar/Footer |
| admin | `app/admin/` | `<AdminSidebar>` + `<main>` |

**Critical:** `app/(auth)/admin/login/` and `app/admin/` are separate route groups. The login page must stay in `(auth)` to avoid being wrapped by `app/admin/layout.tsx` (which redirects unauthenticated users → infinite redirect loop).

### Server vs Client Components

Default to **Server Components**. Only add `'use client'` when the component needs: `useState`/`useEffect`, browser APIs, event handlers in JSX, `usePathname`/`useRouter`/`useSearchParams`, or interactive animations.

Pattern: Server Component fetches data → passes as props to `'use client'` leaf component.

### Data Fetching: Direct Supabase vs FastAPI

- **Direct Supabase:** public reads (products, articles, settings) — SSG-compatible, no FastAPI overhead
- **FastAPI:** admin reads with business logic, RFQ form submission (triggers Anthropic AI + Resend email), supplier registration notifications, WA template generation
- **Supabase Storage direct:** admin file uploads

### Auth (Supabase + `@supabase/ssr`)

**Never use `@supabase/auth-helpers`** — it's deprecated.

Four Supabase client contexts:
- Server Components / Route Handlers: `lib/supabase/server.ts` → `createServerClient()`
- Client Components: `lib/supabase/client.ts` → `createBrowserClient()`
- Middleware: inline in `middleware.ts` with cookie getAll/setAll
- FastAPI: `core/supabase.py` using service role key

Four redirect rules (never break these):
1. `GET /admin/*` (not login) + no user → `redirect('/admin/login')` in `middleware.ts`
2. `GET /admin/login` + valid user → `redirect('/admin/dashboard')` in `middleware.ts`
3. Successful login → `router.push('/admin/dashboard')` in login page
4. Logout click → `router.push('/admin/login')` in `AdminSidebar.tsx`

### Rendering Strategy

- Public pages (produk, artikel, tentang-kami): SSG with `revalidate` or `revalidateTag`
- `/artikel` list: ISR with `revalidate: 300`
- `/kalkulator`, `/minta-penawaran`, `/jadi-supplier`: SSG (client-side logic only)
- `/admin/*`: Dynamic with `cache: 'no-store'`

Cache invalidation via webhook: `POST /api/revalidate` with `{ tag, secret }` — triggers `revalidateTag('products' | 'articles' | 'settings')`.

### FastAPI → Next.js API Contract

All calls from Next.js go through `lib/api.ts` (`apiFetch<T>()`). The `auth: true` option attaches the Supabase JWT as `Authorization: Bearer`. Default timeout: 10s; AI endpoints: 35s.

**Rule:** Every Pydantic schema change in FastAPI must be immediately mirrored in `types/api.ts`.

### FastAPI API Prefix

All FastAPI routes are prefixed `/api/v1`. CORS origins come from `ALLOWED_ORIGINS` env var (comma-separated), never hardcoded.

---

## Design System — FROZEN FILES

```
tailwind.config.ts   ← DO NOT EDIT
globals.css          ← DO NOT EDIT
```

These are the output of E1-UX-01 and are the single source of truth for all design tokens. Any new token requires team discussion first.

### Key Brand Tokens

- Primary CTA: `brand-teal-600` (`#0B7D6E`) / hover: `brand-teal-500` (`#0F9E8B`)
- Headings (public): `ink-700` (`#173F3A`)
- Sidebar/footer background: `ink-900` (`#0A1E1C`)
- Accent (supplier sections): `sand-600` (`#8A6535`)
- Page background: `neutral-50` (`#F9FAFB`)

### Available Custom CSS Classes (from `globals.css`)

`.skeleton`, `.skeleton-teal` — shimmer loaders
`.reveal-up`, `.reveal-scale`, `.reveal-left`, `.reveal-right` — scroll reveal (add `.is-visible` via IntersectionObserver)
`.nav-underline`, `.link-animated` — navigation effects
`.page-transition` — page enter animation
`.bg-brand-animated`, `.bg-brand-gradient`, `.bg-dot-grid` — decorative backgrounds
`.mono-tech` — monospace for lab values/certificate numbers
`.prose-brand` — Tailwind Typography override for articles

### Fonts

Plus Jakarta Sans (sans) + JetBrains Mono (mono). Currently loaded via `@import` in `globals.css`. Pending decision (E1-SPIKE-06): switch to `next/font` for performance — if switching, remove the `@import` from `globals.css` (don't use both).

### shadcn/ui

Components live in `components/ui/` — **do not edit them directly**. Extend via `components/brand/` wrappers. Installed for Epic 1: Button, Input, Label, Form, Card, Skeleton, Badge, Separator, DropdownMenu.

### Dark Mode

`darkMode: 'class'` is configured and all `.dark` CSS variables exist in `globals.css`, but dark mode is **not active in v1**. Admin panel will enable it in v2.

---

## Naming Conventions

| Type | Convention |
|---|---|
| React components | `PascalCase.tsx` |
| Non-component TS | `kebab-case.ts` |
| Hooks | `use-kebab-case.ts` |
| Constants | `kebab-case.ts`, exported as `SCREAMING_SNAKE_CASE` |
| Python modules | `snake_case.py` |
| Pydantic models | `PascalCase` |
| DB migrations | `{timestamp}_{description}.sql` |

CSS: Tailwind utility classes only. No CSS Modules or styled-components. Custom CSS only in `globals.css` (frozen).

---

## Environment Variables

**Frontend** (never prefix `SUPABASE_SERVICE_KEY` with `NEXT_PUBLIC_`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SENTRY_DSN`
- `SUPABASE_SERVICE_KEY`, `REVALIDATION_SECRET` (server-only)

**Backend:**
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `ALLOWED_ORIGINS`, `SENTRY_DSN`, `ENVIRONMENT`, `REVALIDATION_SECRET`

Type-safe access: frontend via `lib/env.ts` (throws at startup if missing); backend via `pydantic-settings` in `core/config.py` (validates at startup).

---

## Git Branch Strategy

- `main` → Production (Vercel prod + Railway prod)
- `dev` → Staging
- `feature/{task-id}-{slug}` → Preview (e.g. `feature/E1-ENG-20-navbar-desktop`)

## Architecture Document

`ARCHITECTURE.md` is the authoritative living reference. Update it before implementing any architectural decision (new folder structure, routing change, auth flow change, data fetching pattern, stack change).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
