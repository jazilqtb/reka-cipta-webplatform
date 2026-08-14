# Admin Surface Audit — CV Reka Cipta Indonesia

> **Read-only analysis. No code, migration, or DB change was written or executed.**
> Date: 2026-08-15 · Graph commit: `0f223724` · Mode: `audit`

## Step 0 — Graph provenance

| Check | Result |
| --- | --- |
| Graph exists | Yes — `graphify-out/GRAPH_REPORT.md`, 1965 nodes · 3649 edges · 158 communities |
| Stale vs git? | **No.** `find app components lib -newer graphify-out/graph.json` → 0 files. Graph rebuilt at end of previous session. **Refresh skipped — not needed.** |
| Extraction quality | 98% EXTRACTED · 2% INFERRED (71 edges, avg conf 0.73) · 0% AMBIGUOUS |
| Corpus | 333 files · ~1.62M words |

**Provenance tags used below**: `[EXTRACTED]` = verified via graphify query/path or direct file read with line numbers · `[INFERRED]` = graph marked it inferred, or I reasoned from two extracted facts · `[NEEDS INPUT]` = cannot verify in this environment.

### Routing deviation (must flag)

You routed to `/existing-site-analyzer` → `/rebuild-or-improve-advisor` → `/migration-planner`. **These three skills are not installed in this environment.** Available and used instead:

- `graphify` (Step 0, dependency verification) — **Ran**
- `senior-ui-ux-orchestrator` (chair, this report) — **Ran**
- `task-plan-v2-orchestrator` — **Planned** for Checkpoint execution, not this step

Per the no-fake-tools rule I did not simulate the three missing skills. Their intended outputs (site analysis, rebuild-vs-improve verdict, migration plan) are covered by §1–3, §5, and §6 respectively — produced directly, not by proxy.

---

## 1. Route inventory

All 18 admin route files. Runtime probe: dev server on :3001, unauthenticated `curl`, 2026-08-15. **Ran.**

| Route | File(s) | Runtime evidence | State |
| --- | --- | --- | --- |
| `/admin/login` | `app/(auth)/admin/login/page.tsx`, `layout.tsx` | `200` | **Working** (renders; auth flow itself unverified — see §7) |
| `/admin/dashboard` | `app/admin/dashboard/page.tsx` | `307` → `/admin/login?redirected=true` | **Incomplete by design** — see §3 |
| `/admin/articles` | `app/admin/articles/page.tsx` | `307` → login | Compiles + gated |
| `/admin/articles/new` | `app/admin/articles/new/page.tsx` | `307` → login | Compiles + gated |
| `/admin/articles/[id]/edit` | `app/admin/articles/[id]/edit/page.tsx` | not probed (needs valid id + auth) | Compiles (tsc clean) |
| `/admin/leads` | `app/admin/leads/page.tsx` | `307` → login | Compiles + gated |
| `/admin/leads/[id]` | `app/admin/leads/[id]/page.tsx` | not probed | Compiles |
| `/admin/products` | `app/admin/products/page.tsx` | `307` → login | Compiles + gated |
| `/admin/products/[id]/edit` | `app/admin/products/[id]/edit/page.tsx` | not probed | Compiles |
| `/admin/suppliers` | `app/admin/suppliers/page.tsx` | `307` → login | Compiles + gated |
| `/admin/suppliers/[id]` | `app/admin/suppliers/[id]/page.tsx` | not probed | Compiles |
| `/admin/settings` | `app/admin/settings/page.tsx` + `actions.ts` | `307` → login | Compiles + gated |
| `/admin/email-templates` | `app/admin/email-templates/page.tsx` | `307` → login | Compiles + gated |
| `/admin/proposal-settings` | `app/admin/proposal-settings/page.tsx` | `307` → login | Compiles + gated |
| (layout) | `app/admin/layout.tsx` | — | Working; double auth guard L22 |
| (middleware) | `middleware.ts` | 9/9 routes redirected correctly | **Working** |

### Route-state file coverage — systemic gap `[EXTRACTED]`

```
                     loading.tsx  error.tsx  not-found.tsx
dashboard                  N          N            N
articles                   N          N            N
leads                      N          N            N
products                   N          N            N
suppliers                  N          Y            N
settings                   N          N            N
email-templates            N          N            N
proposal-settings          N          N            N
```

**0 `loading.tsx`, 0 `not-found.tsx`, 1 `error.tsx` across the entire admin surface.** Only `app/admin/suppliers/error.tsx` exists. There is no root `app/admin/error.tsx`, so an unhandled throw in any other admin page escalates to the global error boundary — a full-page crash with no admin chrome and no recovery path. Every admin page is `async` + Supabase-backed, so all of them can throw.

**Important caveat**: I could not log in (no admin credentials — §7). Everything past the auth gate is assessed by **code reading, not observed behaviour**. "Compiles + gated" ≠ "verified working". `npx tsc --noEmit` is clean and `npm run lint` sits at the project's known baseline (8 problems, 2 errors / 6 warnings — pre-existing, includes `AdminSidebar.tsx`).

---

## 2. Dependency map summary

### God nodes `[EXTRACTED — GRAPH_REPORT.md §God Nodes]`

| Node | Edges | Admin relevance |
| --- | --- | --- |
| `get_supabase()` `backend/core/supabase.py:21` | 59 | Every FastAPI admin endpoint |
| `cn()` `lib/utils.ts:4` | 53 | Shared public + admin |
| `apiFetch()` `lib/api.ts:74` | 35 | **Admin's primary data channel** (23 imports) |
| `ApiFetchError` `lib/api.ts:65` | 27 | Admin error handling |
| `createClient()` `lib/supabase/server.ts:4` | 23 | Admin server components (7 imports) |
| `RevealWrapper()` | 27 | **Public only** — zero admin usage |
| `createPublic()` | 26 | **Public only** |

### Shared vs admin-only `[EXTRACTED — import census]`

Shared with public portal (23 files):
```
33× @/types/api            23× @/lib/api           8× @/lib/constants/lead-status
 8× @/components/ui/skeletons                      7× @/lib/supabase/server
 7× @/components/ui/textarea   6× @/components/ui/label   6× @/components/ui/input
 5× @/lib/utils            4× @/components/ui/dialog  3× @/lib/supabase/client
 2× @/lib/validation/rfq-schema  2× @/lib/product-mapper
```

**Critical finding for restyling risk** `[EXTRACTED]`:

> **Zero admin files import any public-portal presentation component.** Grep across `app/admin`, `components/admin`, `components/layout/Admin*`, `app/(auth)` for `@/components/sections/`, `@/components/blocks/`, `@/components/brand/`, `@/components/animations/`, `@/components/decorative/` → **no matches**.

The two surfaces share only **primitives** (`components/ui/*`), **data plumbing** (`lib/api`, `types/api`, supabase clients), and **`cn()`**. This is the single most useful fact for planning: **the entire admin surface can be restyled in place with zero regression risk to the public portal.** The only shared-mutation hazard is `components/ui/*` — which CLAUDE.md already forbids editing directly (extend via wrappers).

### Cycles & dead code

- **Import cycles: none detected** `[EXTRACTED — GRAPH_REPORT.md §Import Cycles: "None detected"]`
- **Dead code: none in admin.** Orphan scan over all 41 `components/admin/**/*.tsx` → every file has ≥1 inbound import. `[EXTRACTED]`
- Dead code *outside* admin, from prior work this session: `components/sections/InnerPageHero.tsx`, `ArticleBreadcrumb.tsx`, `LegalDoc*.tsx` already deleted. `components/ui/button.tsx` `buttonVariants` usage is shrinking but still referenced. `[EXTRACTED]`

---

## 3. Root-cause analysis

### 3.1 `/admin/dashboard` metrics — the premise needs correcting

**The metrics are not "failing to render". There is no data path at all — the feature was never built.**

`app/admin/dashboard/page.tsx:7-12` `[EXTRACTED]`:

```tsx
const STAT_CARDS = [
  { label: 'Leads Baru',     value: '—', icon: ClipboardList, ... },
  { label: 'Supplier Aktif', value: '—', icon: Sprout,        ... },
  { label: 'Artikel',        value: '—', icon: BookOpen,      ... },
  { label: 'Produk',         value: '—', icon: Package,       ... },
] as const
```

`value: '—'` is a **hardcoded string literal in a module-level constant**. Line 52 renders `{stat.value}` — so the em-dash you see on screen is the literal, rendered exactly as written. Line 62 confirms intent: `[ Dashboard content akan diimplementasi mulai Epic 2 ]`.

Full trace as requested — component → hook → query → API → table:

| Layer | Finding |
| --- | --- |
| Component | `DashboardPage()` L14. Only async call is `supabase.auth.getUser()` L16, used solely for `user?.email` L30 |
| Hook / query | **Does not exist** — no `useQuery`, no fetch, no server-side count |
| API route | **Does not exist** — no dashboard/stats endpoint in `backend/routers/` |
| Table / RLS | Never reached |

Graph verification `[EXTRACTED]`:
```
$ graphify path "dashboard/page.tsx" "RFQLead"
No path found between 'dashboard/page.tsx' and 'RFQLead'.
```

The dashboard's only outbound edge is `createClient()`. There is no edge to `rfq_leads`, `articles`, `products`, or `supplier_registrations`.

**Consequence for planning**: this is **not** a debugging task and RLS is not implicated. It is a build task — new aggregate endpoints (or direct server-side counts) + the UI to consume them. Budget accordingly; "fix the dashboard" would badly under-scope it.

### 3.2 Independently discovered — authorization is *authentication only* `[EXTRACTED]` · severity: **critical, needs your input to confirm exploitability**

Three facts that compose into one problem:

1. `middleware.ts:14` gates on `!user` only — any authenticated Supabase user passes.
2. `app/admin/layout.tsx:22` — same check, `if (!user) redirect(...)`. No role test.
3. RLS grants full CRUD to the bare `authenticated` role. `supabase/migrations/20260715190001_articles_rls.sql:20-39`:
   ```sql
   CREATE POLICY "Authenticated can insert articles" ... TO authenticated WITH CHECK (TRUE);
   CREATE POLICY "Authenticated can update articles" ... TO authenticated USING (TRUE) WITH CHECK (TRUE);
   CREATE POLICY "Authenticated can delete articles" ... TO authenticated USING (TRUE);
   ```
4. Backend `get_current_user()` `backend/dependencies/auth.py:24-60` verifies the JWT signature correctly but **returns the raw payload without checking any role/claim**.

Grep for `app_metadata`, `user_metadata`, `role ===`, `is_admin`, `ADMIN_EMAIL`, `allowlist` across `app`, `lib`, `middleware.ts`, `backend` → **zero matches**.

**There is no notion of "admin" anywhere in this system. "Logged in" *is* "admin".**

Whether this is remotely exploitable depends on one setting I cannot read: **is email signup enabled on the Supabase project?** `[NEEDS INPUT]` If yes, anyone who self-registers gets full CRUD on articles/products/leads/suppliers. If signup is disabled and users are created manually, the current risk is contained — but the design still has no defence in depth, and adding a second user (e.g. a content editor) would immediately grant them destructive access to everything.

**Positive findings worth preserving** — do not regress these during rework:
- `lib/supabase/middleware.ts:30` uses `getUser()` (server-validated), **not** `getSession()` (cookie-trusting). Correct, and explicitly commented.
- `backend/dependencies/auth.py:22` pins asymmetric algs to `{ES256, RS256}` and verifies via JWKS — deliberate algorithm-confusion defence.
- `app/admin/layout.tsx` sets `robots: 'noindex, nofollow'`.

**One caveat on that defence** `[EXTRACTED, severity: medium]`: `auth.py:41` branches on the **unverified** header `alg`, and the `HS256` branch validates against `SUPABASE_JWT_SECRET`. The asymmetric allowlist doesn't cover this path. If the legacy shared secret is still enabled — the code comment at L12-17 says it "still shows enabled in the dashboard" — an attacker holding that secret can forge an accepted token. Recommend rejecting `HS256` outright once you confirm no live client still issues it. `[NEEDS INPUT: is legacy JWT secret still enabled?]`

### 3.3 Other data-flow observations

- **`/admin/settings` is the only route using Server Actions** (`app/admin/settings/actions.ts`); every other admin page goes through `apiFetch` → FastAPI. Two different mutation architectures in one surface — worth unifying, but not broken. `[EXTRACTED]`
- No broken data flow found in leads / products / suppliers / articles / email-templates / proposal-settings by static reading. **I could not exercise them at runtime** (§7), so this is *absence of evidence*, not verified health.

---

## 4. Design-system gap analysis

Public portal is now a fully-specified system (`app/globals.css` `@theme` + documented shape/typography rules). The admin surface **predates all of it and adopts none of it.**

Class census across `app/admin`, `components/admin`, `components/layout/Admin*.tsx`, `app/(auth)` `[EXTRACTED]`:

| Public-portal token/class | Admin usage | Gap |
| --- | --- | --- |
| `font-ui` (Space Grotesk — heading/UI voice) | **0** | Admin renders headings in default sans. Nothing shares the brand voice. |
| `rounded-2xl` (cards) / `rounded-xl` (buttons) — the *only* two radii allowed | `rounded-md` ×93, `rounded-lg` ×19, `rounded-xl` ×6, `rounded-full` ×13 | 4 competing radii; the dominant one (`rounded-md`) is not in the system at all |
| `border-ink-900/10` | `border-neutral-200` ×70, `-300` ×50, `-100` ×6, `-400` ×2 | 128 borders on a greyscale ramp the public portal abandoned |
| `text-ink-700` (headings) | `text-neutral-600` ×59, `-500` ×56, `-400` ×38, `-700` ×31, `-900` ×6 | No ink-* usage; 5-step neutral ramp with no hierarchy rule |
| `bg-salt-50` (page ground) | `bg-neutral-50` ×39 | Cool-mineral ground replaced by default grey |
| `.panel-card` (hover lift + soft shadow, no border flash) | **0** | Cards use ad-hoc `hover:shadow-md` |
| `.tag-pill` / `.tag-pill-dark` | **0** | Status badges hand-rolled per component |
| `.rule-index` (eyebrow) | **0** | No eyebrow pattern |
| `.mono-tech` (tabular numerics) | **1** | Lead/product IDs and counts render in proportional type |
| Phosphor duotone icons | **0 files** — **17 files still on `lucide-react`** | Entire icon language diverges |
| `SectionDivider` / `ParallaxBlob` / `RevealWrapper` motion | **0** | Admin has no motion system (correct for dense UI — but transitions are ad-hoc `duration-150`) |

Concrete anchors:
- `app/admin/dashboard/page.tsx:41` — `rounded-xl border-neutral-100 ... hover:shadow-md` → should be `.panel-card rounded-2xl`
- `app/admin/dashboard/page.tsx:3` — `import { ClipboardList, Sprout, BookOpen, Package } from 'lucide-react'`
- `app/admin/dashboard/page.tsx:26` — `text-2xl font-bold text-ink-700` — uses `ink-700` but **not** `font-ui`; closest thing to a partial adoption anywhere in admin
- `app/admin/layout.tsx:27` — `bg-neutral-50` → `bg-salt-50`

**Assessment**: this is not drift to be patched — it is a surface that never received the design system. Because §2 proved zero shared presentation components, the fix is a clean in-place restyle. Nothing the public portal renders can break.

**Not yet decided (deliberately)**: whether admin should adopt the *marketing* aesthetic (gradient heroes, curved dividers, parallax) or a **dense-app dialect** of the same tokens (same colour/type/radius/shadow scale, but flat, compact, no decorative motion). My recommendation is the latter — dashboards and marketing pages have opposite density and scan-pattern requirements, and importing hero treatments into a CRM would hurt usability. This needs your call before Checkpoint 2. `[NEEDS INPUT]`

---

## 5. Proposed checkpoint plan

Sequenced by **risk isolation** and **dependency**, not by visible impact. Each checkpoint is independently reviewable and revertable.

### Checkpoint 1 — Auth & authorization hardening
**Risk: high (security) · Blast radius: every admin route + all RLS-covered tables**

1. Decide the admin identity model — `app_metadata.role` claim vs. an `admin_users` allowlist table `[NEEDS INPUT]`
2. Enforce in **all four** layers (any one alone is bypassable): `middleware.ts`, `app/admin/layout.tsx`, RLS predicates, `get_current_user()`
3. Rewrite RLS `USING (TRUE)` → role-scoped predicates, per table
4. Resolve the `HS256` branch in `auth.py:41`
5. Add root `app/admin/error.tsx` + `loading.tsx`

*Ship alone. No UI work in this checkpoint — it must be reviewable as pure security.*

### Checkpoint 2 — Admin IA + design-system adoption
**Risk: low · Blast radius: admin only (proven §2)**

1. Agree the admin dialect (§4 open question)
2. Build `components/admin/ui/` primitives — AdminCard, AdminTable, StatusPill, PageHeader, EmptyState
3. Migrate 17 files off `lucide-react` → Phosphor
4. Normalise radii/borders/type to tokens
5. Add the missing `loading.tsx` / `not-found.tsx` per route
6. Page-by-page, one route per PR

*Safe to run in parallel with Checkpoint 3 — different files.*

### Checkpoint 3 — Article/content system
**Risk: medium · Blast radius: `articles` table + 5 files (§6)**

Depends on Checkpoint 1 (editors must not be full admins). Includes `RichTextEditor` sanitisation review, `ThumbnailUploader`, draft/publish UX. Note `.prose-brand` was only defined last session — the admin editor now finally previews the same typography the public site renders.

### Checkpoint 4 — Dashboard build-out + backend gaps
**Risk: medium · Blast radius: new endpoints; reads 4 tables**

This is **new feature work** (§3.1), not a fix. Depends on Checkpoint 1 — aggregate counts across leads/suppliers must not be readable by a non-admin. Add aggregate endpoints, wire real metrics, replace the L60-64 placeholder, unify the Server-Action vs `apiFetch` split (§3.3).

**Recommended order**: 1 → (2 ∥ 3) → 4.

---

## 6. Schema changes that would help

Blast radius per `grep -rl` over `app`, `lib`, `backend` `[EXTRACTED]` — file lists are exhaustive, not sampled.

### S1 — Admin role / allowlist (**enables Checkpoint 1**)
- **risk: high** (touches every policy) · **reversible without data loss: yes** · **additive-only**
- Options: `app_metadata.role` claim (no new table) *or* `admin_users` table
- **Blast radius**: `middleware.ts`, `app/admin/layout.tsx`, `backend/dependencies/auth.py`, + every RLS migration listed below
- Note: rewriting a policy is additive to *data* but **destructive to access** — a wrong predicate locks admins out. Stage on a branch DB first.

### S2 — Re-scope RLS from `authenticated` → admin role
- **risk: high** · **reversible: yes** · **destructive to access, not to data**
- Files: `20260715190001_articles_rls.sql`, `20260705123959_products_rls.sql`, `20260707131758_rfq_leads_rls.sql`, `20260712013805_supplier_registrations_rls.sql`, `20260711100001_proposal_settings_rls.sql`, `20260711110001_email_wa_templates_rls.sql`, `20260708020001_lead_status_history_rls.sql`, `20260705124000_storage_products_rls.sql`, `20260715190002_storage_article_thumbnails_rls.sql`
- **Blast radius by table**:
  - `articles` (5): `app/admin/articles/page.tsx`, `app/admin/articles/[id]/edit/page.tsx`, `lib/data/articles.ts`, `app/(public)/artikel/[slug]/page.tsx`, `backend/routers/articles.py`
  - `products` (10): `app/admin/products/page.tsx`, `app/admin/products/[id]/edit/page.tsx`, `app/(public)/produk/page.tsx`, `app/(public)/produk/[slug]/page.tsx`, `app/(public)/page.tsx`, `app/(public)/kontak/page.tsx`, `app/(public)/minta-penawaran/page.tsx`, `app/sitemap.ts`, `backend/routers/products.py`, `backend/routers/rfq.py`
  - `rfq_leads` (1): `backend/routers/rfq.py`
  - `supplier_registrations` (1): `backend/routers/supplier.py`
  - `lead_status_history` (1): `backend/routers/rfq.py`
  - `proposal_settings` (1): `backend/routers/proposal_settings.py`
  - `company_settings` (7): `app/(public)/layout.tsx`, `app/(public)/page.tsx`, `app/(public)/kontak/page.tsx`, `backend/routers/settings.py`, `backend/routers/contact.py`, `backend/routers/rfq.py`, `backend/services/email_service.py`
- ⚠️ `products` and `company_settings` are read by **public** pages. A careless policy change breaks the public site, not just admin. Public reads must stay on the `anon` path.

### S3 — Dashboard aggregate support (**Checkpoint 4**)
- **risk: low** · **reversible: yes** · **additive-only**
- Options: SQL views / RPC counts, or just `count: 'exact', head: true` queries — **no schema change strictly required**
- **Blast radius**: `app/admin/dashboard/page.tsx` only (currently zero data edges, §3.1)
- Recommend starting with plain counts; add a materialised view only if measured slow.

### S4 — Article draft/publish audit fields (**Checkpoint 3, optional**)
- **risk: low** · **reversible: yes** · **additive-only** (`published_by`, `last_edited_by`, `last_edited_at`)
- **Blast radius**: same 5 `articles` files as S2. Additive columns → existing `SELECT`s unaffected.

**No destructive migration is recommended anywhere.** Nothing in this audit calls for dropping a column or table.

---

## 7. Cannot access / execute in this environment

Blocking Checkpoint 1 unless provided:

| Item | Why needed | Status |
| --- | --- | --- |
| **Admin login credentials** (email + password of an existing admin) | Every finding past the auth gate is code-read only. Cannot verify actual render, console errors, network failures, or the dashboard's live appearance | **Blocking for verification** |
| **Is Supabase email signup enabled?** | Determines whether §3.2 is a live critical vulnerability or a contained design weakness | **Blocking for triage** |
| **Is the legacy JWT shared secret still enabled?** | Determines whether the `HS256` branch (`auth.py:41`) is exploitable | **Blocking for triage** |
| Supabase project ref + dashboard access | Cannot read Auth settings, live RLS state (vs. migration files), or storage bucket policies. **Migrations on disk may not equal deployed state** | Needed |
| `SUPABASE_SERVICE_KEY`, `SUPABASE_JWT_SECRET` | Cannot query DB directly to confirm live policies or row counts | Needed for verification only |
| `RESEND_API_KEY` | Cannot verify email-template send path end-to-end | Needed for Checkpoint 3/4 |
| `ANTHROPIC_API_KEY` | Proposal generator (`ProposalGeneratorPanel`) untestable — flagged unverified in prior sessions | Needed for Checkpoint 4 |
| Production/Vercel access | Cannot confirm deployed env vars match local, or read prod logs | Needed |

**Env var names found in code** (values not read, `.env.local` deliberately not opened):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SENTRY_DSN`, `SUPABASE_SERVICE_KEY`, `REVALIDATION_SECRET` · backend: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_JWT_SECRET`, `ALLOWED_ORIGINS`, `ENVIRONMENT`, `SENTRY_DSN`, `REVALIDATION_SECRET`, `RESEND_API_KEY`, `ANTHROPIC_API_KEY`, `FRONTEND_URL`

**Missing skills**: `existing-site-analyzer`, `rebuild-or-improve-advisor`, `migration-planner` are not installed (see Step 0).

---

## Evidence ledger

| Check | Status |
| --- | --- |
| Graph staleness vs git | **Ran** |
| `graphify query` × 3, `graphify path` × 1 | **Ran** |
| Route enumeration (filesystem) | **Ran** |
| Unauthenticated route probe (10 routes, curl) | **Ran** |
| `npx tsc --noEmit` | **Ran** — clean |
| `npm run lint` | **Ran** — 8 problems, project baseline |
| Import/class census (grep) | **Ran** |
| RLS migration file read | **Ran** |
| Orphan/dead-code scan | **Ran** |
| **Authenticated admin UI render** | **Blocked** — no credentials |
| **Live Supabase RLS state** | **Blocked** — no project access |
| **Browser console / network errors in admin** | **Blocked** — cannot get past login |
| Screenshots of admin screens | **Skipped** — same reason |

No code, migration, or database change was written or executed.
