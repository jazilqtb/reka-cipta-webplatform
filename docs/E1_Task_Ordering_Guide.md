# Panduan Urutan Pengerjaan — Epic 1
## CV Reka Cipta Indonesia · Solo Developer Guide

> **Prinsip utama:** Urutan di bawah bukan layer-by-layer (L1→L2→L3→L4→L5), melainkan dependency-driven. Layer 1–3 adalah *artefak desain* yang dikerjakan tepat sebelum task engineering yang membutuhkannya — bukan semua di awal.

---

## ⚡ TL;DR — Urutan Sederhana (untuk yang tidak mau baca panjang)

```
FASE 0 → FASE 1 → FASE 2 → FASE 3 → FASE 4 → FASE 5 → FASE 6 → FASE 7 → FASE 8 → FASE 9 → FASE 10 → FASE 11
Design   Scaffold  Infra    Config   Database  Backend  Auth     Public   Admin    Hardening Deploy   QA
Tokens   Git+Init  Spikes   Tailwind Supabase  FastAPI  Next.js  Layout   Panel    +Sentry  Staging  Staging
```

---

## FASE 0 — Pre-Code: Keputusan Desain & Arsitektur
> **Tidak ada kode ditulis di fase ini.** Semua output berupa dokumen/file konfigurasi.  
> **Estimasi:** 2–4 jam

### Kenapa fase ini ada?
Tanpa E1-UX-01 (design tokens), kamu tidak tahu warna apa yang dipakai di Tailwind config. Tanpa E1-UX-07 (routing), middleware auth tidak jelas route mana yang perlu dilindungi. Tanpa E1-SPIKE-01, folder structure di ENG-03 bisa jadi salah.

### Urutan:

| # | Task ID | Apa yang dikerjakan | Output |
|---|---------|--------------------|-----------------------|
| 1 | `E1-UX-01` | Tentukan design tokens: warna brand teal, typography scale, spacing 4px unit, border-radius | Draft `tailwind.config.ts` + `globals.css` |
| 2 | `E1-UX-07` | Dokumentasikan semua routes (public + admin), 4 redirect rules, auth flow diagram | Tabel route + ASCII/diagram auth flow |
| 3 | `E1-SPIKE-01` | Putuskan konvensi Next.js: folder structure, naming conventions, Server vs Client component rules | `ARCHITECTURE.md` draft awal |
| 4 | `E1-SPIKE-03` | Putuskan struktur FastAPI: folder, error format standard, logging format | Template `main.py` + struktur folder backend |

**🔍 Baca juga:** Review User Stories `E1-US-01` s/d `E1-US-09` sebagai acceptance criteria — tidak perlu dikerjakan terpisah, cukup baca sebelum lanjut.

---

## FASE 1 — Project Scaffold & Git Setup
> **Tujuan:** Repo bersih, kedua project (Next.js + FastAPI) berjalan lokal, struktur folder final.  
> **Estimasi:** 1–2 jam

### Kenapa urutan ini?
GitHub repo harus ada PERTAMA sebelum `npm create` — supaya initial commit langsung masuk repo yang benar dan tidak ada history yang salah. ENG-07 sebelum ENG-01.

### Urutan:

| # | Task ID | Apa yang dikerjakan | Dependensi |
|---|---------|--------------------|-----------------------|
| 5 | `E1-ENG-07` | Buat GitHub repo, `.gitignore`, README skeleton | — |
| 6 | `E1-ENG-01` | `npx create-next-app@latest` dengan TypeScript + App Router + Tailwind | ENG-07 |
| 7 | `E1-ENG-03` | Buat folder structure sesuai SPIKE-01: `/components`, `/lib`, `/types`, `/hooks`, `/constants` | ENG-01, SPIKE-01 |
| 8 | `E1-ENG-05` | Init FastAPI di folder `/backend`, setup venv, install deps, buat semua files | SPIKE-03 |
| — | — | **Initial commit** ke GitHub dengan kedua project | ENG-01, 03, 05 |

---

## FASE 2 — Infrastructure Spikes (Validasi Teknis)
> **Tujuan:** Validasi semua asumsi teknis SEBELUM implement. Ini adalah "beli asuransi" teknis.  
> **Estimasi:** 3–5 jam (termasuk buat akun dan testing)

### Kenapa spikes dikerjakan sekarang?
Spike adalah EKSPERIMEN, bukan implementasi. Jika kamu langsung implement Supabase Auth tanpa SPIKE-02, kamu bisa pakai package yang salah (`@supabase/auth-helpers` yang deprecated) dan harus refactor. Lakukan spike dulu, lalu implement berdasarkan hasil spike.

### Urutan:

| # | Task ID | Apa yang dikerjakan | Dependensi |
|---|---------|--------------------|-----------------------|
| 9 | `E1-ENG-08` | Buat Supabase project di dashboard (pilih region Singapore) | — |
| 10 | `E1-SPIKE-07` | Validasi workflow Supabase CLI: install, login, link, test migration | ENG-08 |
| 11 | `E1-SPIKE-04` | Setup Vercel + Railway accounts, connect GitHub repo, test auto-deploy dengan dummy commit | ENG-07, ENG-01, ENG-05 |
| 12 | `E1-SPIKE-08` | Buat akun Sentry, buat 2 project (`reka-cipta-web` + `reka-cipta-api`), catat DSN | — |
| 13 | `E1-SPIKE-02` | Validasi `@supabase/ssr`: test `createServerClient`, `createBrowserClient`, `updateSession()` | ENG-08, ENG-01 |
| 14 | `E1-SPIKE-05` | Buat RLS pattern library (3 pattern), test setiap pattern di Supabase | ENG-08, SPIKE-07 |

> **⚠️ Warning SPIKE-04:** Saat ini deploy hanya berisi scaffold kosong — yang perlu divalidasi adalah pipeline-nya berjalan, bukan konten halamannya.

---

## FASE 3 — Konfigurasi & Design System
> **Tujuan:** Environment variables terdefinisi, Tailwind + shadcn terinstall & terintegrasi dengan brand tokens dari UX-01.  
> **Estimasi:** 1–2 jam

### Kenapa ENG-04 dikerjakan setelah spikes?
Setelah spikes, kamu baru tahu SEMUA env vars yang dibutuhkan (Supabase URL, Sentry DSN, Railway URL, dll). Kalau ENG-04 dikerjakan sebelum spikes, file `.env.local.example`-nya pasti tidak lengkap.

### Urutan:

| # | Task ID | Apa yang dikerjakan | Dependensi |
|---|---------|--------------------|-----------------------|
| 15 | `E1-ENG-04` | Buat `.env.local.example`, `lib/env.ts` dengan type-safe access (zod validation) | SPIKE-02, 04, 08 (setelah semua akun dibuat) |
| 16 | `E1-SPIKE-06` | Validasi instalasi shadcn/ui, test render `<Button>` `<Input>` `<Card>` | ENG-01, UX-01 |
| 17 | `E1-ENG-02` | Configure Tailwind + install semua shadcn components, extend config dengan brand tokens dari UX-01 | SPIKE-06, UX-01, ENG-04 |

---

## FASE 4 — Database Foundation (Supabase)
> **Tujuan:** Database siap, migrations tersetup via CLI, admin account aktif, client tersedia di Next.js.  
> **Estimasi:** 1–2 jam

### Urutan:

| # | Task ID | Apa yang dikerjakan | Dependensi |
|---|---------|--------------------|-----------------------|
| 18 | `E1-ENG-09` | Setup Supabase CLI: init migration dir, login, link project | SPIKE-07, ENG-08, ENG-01 |
| 19 | `E1-ENG-10` | Tulis dan apply first migration: base RLS setup via `supabase migration new` | ENG-09, SPIKE-05 |
| 20 | `E1-ENG-12` | Buat storage buckets: `product-photos`, `lab-docs`, `article-thumbnails`, `legal-docs` | ENG-08 |
| 21 | `E1-ENG-13` | Buat admin account pertama via Supabase dashboard | ENG-08, ENG-10 |
| 22 | `E1-ENG-11` | Setup Supabase client di Next.js: `server.ts`, `client.ts`, `middleware.ts` | SPIKE-02, ENG-08, ENG-04, ENG-01 |

> **🔍 Catatan ENG-11:** Buat 3 file terpisah sesuai hasil SPIKE-02. Jangan gabungkan server dan client client di satu file.

---

## FASE 5 — API Contract + FastAPI Backend
> **Tujuan:** TypeScript types dan Pydantic schemas selaras, semua auth endpoints FastAPI berfungsi.  
> **Estimasi:** 2–3 jam

### Kenapa API Contract (ENG-40) dikerjakan SEBELUM UI?
Kalau `interface AuthResponse` di TypeScript tidak cocok dengan Pydantic `AuthResponse` di FastAPI (misalnya nama field berbeda: `access_token` vs `accessToken`), form login akan gagal dan kamu akan debug hal yang seharusnya tidak ada. Definisikan contract dulu, baru build UI.

### Urutan:

| # | Task ID | Apa yang dikerjakan | Dependensi |
|---|---------|--------------------|-----------------------|
| 23 | `E1-SPIKE-09` | Evaluasi TypeScript ↔ Pydantic sync strategy | ENG-03, ENG-05 |
| 24 | `E1-ENG-40` | Buat `/types/api.ts` (TS interfaces) + `/schemas/auth.py` (Pydantic), cross-check semua fields | SPIKE-09, ENG-03, ENG-05 |
| 25 | `E1-ENG-06` | CORS middleware di FastAPI + `GET /health` endpoint | ENG-05, SPIKE-03 |
| 26 | `E1-ENG-16` | Buat `get_current_user()` dependency di FastAPI (BLOCKER untuk semua auth endpoints) | ENG-05, ENG-06, ENG-08 |
| 27 | `E1-ENG-17` | Implement `POST /api/v1/auth/login` | ENG-16, ENG-40 |
| 28 | `E1-ENG-18` | Implement `POST /api/v1/auth/logout` | ENG-16 |
| 29 | `E1-ENG-19` | Implement `GET /api/v1/auth/me` | ENG-16 |
| 30 | `E1-ENG-39` | Rate limiting di `/auth/login`: max 5 req/menit/IP, return 429 | ENG-17 |

> **⚠️ Warning:** ENG-16 adalah BLOCKER untuk ENG-17, 18, 19. Jangan loncat ke ENG-17 sebelum dependency `get_current_user()` selesai dan tested.

---

## FASE 6 — Next.js Auth Middleware
> **Tujuan:** Semua route `/admin/*` terlindungi di server-side. Tidak ada flash of protected content.  
> **Estimasi:** 1 jam

### Kenapa middleware dikerjakan SEBELUM membangun Admin UI?
Kalau kamu build admin login page dulu tanpa middleware, kamu tidak bisa test apakah redirect logic bekerja. Middleware harus ada dulu supaya setiap komponen admin bisa langsung dites redirect-nya.

### Urutan:

| # | Task ID | Apa yang dikerjakan | Dependensi |
|---|---------|--------------------|-----------------------|
| 31 | `E1-ENG-14` | Buat `middleware.ts`: protect `/admin/*`, redirect logic, `updateSession()` | ENG-11, ENG-04, SPIKE-02 |
| 32 | `E1-ENG-15` | Test semua redirect cases lokal sebelum push ke staging | ENG-14, ENG-13 |

---

## FASE 7 — Public Layout UI
> **Tujuan:** Navbar + Footer + 404 + root layout berjalan. Website publik sudah tampil di staging.  
> **Estimasi:** 3–4 jam

### Strategi: Wireframe langsung sebelum coding komponen
Untuk solo developer dengan AI coding tools, buat wireframe *tepat sebelum* coding komponen terkait — jangan semua wireframe di awal. Ini menjaga konteks tetap segar.

### Urutan:

| # | Task ID | Apa yang dikerjakan | Dependensi |
|---|---------|--------------------|-----------------------|
| 33 | `E1-UX-02` | Wireframe Navbar (desktop + mobile state) | UX-01 |
| 34 | `E1-ENG-20` | Build Navbar component desktop: logo, nav links, CTA button, active state | ENG-02, ENG-03, UX-02 |
| 35 | `E1-ENG-21` | Tambah mobile hamburger behavior: state, aria-label, click-outside | ENG-20 |
| 36 | `E1-ENG-22` | Sticky + shadow-on-scroll: `useScrollY` hook, transition smooth | ENG-20, ENG-21 |
| 37 | `E1-UX-03` | Wireframe Footer (3 kolom, info kontak) | UX-01 |
| 38 | `E1-ENG-23` | Build Footer component: 3 kolom, WA links, badge SNI/NIB, copyright | ENG-02, ENG-03, UX-03 |
| 39 | `E1-ENG-24` | Wire Navbar + Footer ke root layout, setup font, default metadata | ENG-20, 21, 22, ENG-23 |
| 40 | `E1-UX-04` | Wireframe 404 page | UX-01 |
| 41 | `E1-ENG-25` | Build `/app/not-found.tsx`: angka 404 besar, tombol kembali, verify HTTP status 404 | ENG-24, UX-04 |
| 42 | `E1-UX-08` | Definisi skeleton pattern library (4 variants) | UX-01 |
| 43 | `E1-ENG-26` | Build skeleton components: `TextLine`, `Card`, `Image`, `TableRow` via shadcn `<Skeleton>` | ENG-02, UX-08 |
| 44 | `E1-ENG-27` | Build placeholder homepage: minimal content, metadata SEO baseline | ENG-24 |

---

## FASE 8 — Admin Panel UI
> **Tujuan:** Login admin berfungsi end-to-end, admin layout tampil, dashboard placeholder ada.  
> **Estimasi:** 2–3 jam

### Kenapa Admin Sidebar (ENG-29) sebelum Admin Login page (ENG-28)?
Admin Login punya layout tersendiri (tidak butuh sidebar), tapi Admin Layout (ENG-31) butuh sidebar. Build sidebar dulu supaya waktu wire admin layout tidak ada blocking dependency. Admin Login page bisa dibangun paralel/setelah sidebar karena tidak saling bergantung.

### Urutan:

| # | Task ID | Apa yang dikerjakan | Dependensi |
|---|---------|--------------------|-----------------------|
| 45 | `E1-UX-05` | Wireframe Admin Login page (layout card, error state, NO link lain) | UX-01 |
| 46 | `E1-UX-06` | Wireframe Admin Layout (sidebar 240px, header, content area) | UX-01 |
| 47 | `E1-ENG-29` | Build `AdminSidebar.tsx`: logo, nav items, active detection, logout handler | ENG-02, ENG-03, ENG-11, UX-06 |
| 48 | `E1-ENG-30` | Build `AdminHeader.tsx`: title prop, breadcrumb opsional | ENG-02, UX-06 |
| 49 | `E1-ENG-28` | Build Admin Login page: react-hook-form + zod, supabase.signInWithPassword, loading state, error generic | ENG-11, ENG-14, ENG-04, UX-05 |
| 50 | `E1-ENG-31` | Wire Admin Layout: server-side session check, render Sidebar, pass user email sebagai prop | ENG-28, ENG-29, ENG-30, ENG-11 |
| 51 | `E1-ENG-32` | Build Admin Dashboard placeholder: AdminHeader + placeholder card + tampilkan email user | ENG-31 |

> **⚠️ Warning ENG-31:** Pastikan `/app/admin/login/` punya `layout.tsx` TERSENDIRI (tidak di-wrap admin layout). Kalau salah, login page akan tampil DALAM admin layout → infinite redirect loop.

---

## FASE 9 — Security Hardening + Observability
> **Tujuan:** HTTP security headers aktif, Sentry menangkap error di frontend dan backend.  
> **Estimasi:** 1–2 jam

### Kenapa security + observability dikerjakan SEBELUM deployment final?
Sentry harus aktif sejak deploy pertama yang ditest — kalau dipasang belakangan, kamu sudah miss error yang terjadi saat testing deployment. Security headers juga harus ada dari deploy pertama supaya tidak ada window waktu tanpa proteksi.

### Urutan:

| # | Task ID | Apa yang dikerjakan | Dependensi |
|---|---------|--------------------|-----------------------|
| 52 | `E1-ENG-38` | HTTP Security Headers di `next.config.js`: X-Frame-Options, HSTS, dll. | ENG-01, SPIKE-08 |
| 53 | `E1-ENG-36` | Integrate Sentry ke Next.js: wizard, config files, test error, source maps | ENG-01, SPIKE-08, ENG-04 |
| 54 | `E1-ENG-37` | Integrate Sentry ke FastAPI: `sentry_sdk.init()`, structured JSON logging | ENG-05, SPIKE-08 |

---

## FASE 10 — Deployment ke Staging
> **Tujuan:** Website & API live di URL staging, siap untuk demo klien.  
> **Estimasi:** 1–2 jam

### Kenapa deployment di fase akhir sebelum QA?
Kamu butuh staging URL untuk mengisi CORS config FastAPI (ENG-35). Dan semua QA tasks di Layer 5 harus dijalankan di staging environment, bukan localhost.

### Urutan:

| # | Task ID | Apa yang dikerjakan | Dependensi |
|---|---------|--------------------|-----------------------|
| 55 | `E1-ENG-33` | Deploy Next.js ke Vercel: import repo, set env vars, trigger build | ENG-24, ENG-27, ENG-38, ENG-36, ENG-04 |
| 56 | `E1-ENG-34` | Deploy FastAPI ke Railway: connect `/backend`, start command, set env vars | ENG-06, ENG-37, ENG-39 |
| 57 | `E1-ENG-35` | Update `ALLOWED_ORIGINS` di Railway dengan Vercel staging URL, test CORS dari staging | ENG-33, ENG-34 |

---

## FASE 11 — QA (Semua di Staging)
> **Tujuan:** Verifikasi semua acceptance criteria terpenuhi sebelum demo ke klien.  
> **Estimasi:** 3–5 jam

Semua QA tasks di Layer 5 dikerjakan setelah staging berjalan. Urutan pengerjaan QA sendiri:

### 5.1 — Functional Tests (UI + Auth)
| # | Task ID | Apa yang ditest |
|---|---------|----------------|
| 58 | `E1-QA-01` | Navbar desktop: semua 7 links, CTA, active state |
| 59 | `E1-QA-02` | Navbar mobile: hamburger open/close, overflow |
| 60 | `E1-QA-03` | Navbar sticky scroll, shadow, z-index |
| 61 | `E1-QA-04` | Footer: 3 kolom desktop, stacked mobile, info kontak akurat |
| 62 | `E1-QA-05` | 404 page: custom render, tombol back, HTTP status benar-benar 404 |
| 63 | `E1-QA-06` | Admin login happy path: redirect, loading state |
| 64 | `E1-QA-07` | Admin login error state: pesan generic, field behavior |
| 65 | `E1-QA-08` | Logout + back button protection |
| 66 | `E1-QA-09` | Protected routes: akses tanpa auth → redirect |
| 67 | `E1-QA-10` | Redirect jika sudah login + akses `/admin/login` |
| 68 | `E1-QA-11` | Session persistence: refresh + reopen browser |

### 5.2 — Responsiveness & Cross-Browser
| # | Task ID | Apa yang ditest |
|---|---------|----------------|
| 69 | `E1-QA-12` | Cross-browser: Chrome, Firefox, Safari, Edge |
| 70 | `E1-QA-13` | Breakpoints: 375, 390, 768, 1024, 1280, 1440px |

### 5.3 — Performance, Security & Infrastructure
| # | Task ID | Apa yang ditest |
|---|---------|----------------|
| 71 | `E1-QA-14` | Lighthouse: Performance ≥85, A11y ≥90, SEO ≥90 |
| 72 | `E1-QA-15` | Supabase connection + RLS di staging |
| 73 | `E1-QA-16` | FastAPI health check, CORS headers, Sentry test error |
| 74 | `E1-QA-17` | Env vars Vercel + Railway semua ada dan benar |
| 75 | `E1-QA-18` | Sentry aktif di frontend + backend, stacktrace readable |
| 76 | `E1-QA-19` | Security headers scan via securityheaders.com → grade ≥ B |
| 77 | `E1-QA-20` | Rate limiting test: 6 req/menit → ke-6 return 429 |

### 5.4 — Accessibility Manual Tests
| # | Task ID | Apa yang ditest |
|---|---------|----------------|
| 78 | `E1-QA-21` | Keyboard navigation: semua komponen interaktif, focus ring visible |
| 79 | `E1-QA-22` | Screen reader: NVDA/VoiceOver, landmarks, aria labels |

### 5.5 — Definition of Done
| # | Task ID | Apa yang ditest |
|---|---------|----------------|
| 80 | `E1-QA-23` | Final DoD checklist: 19 item ✅ sebelum demo klien |

---

## 🚨 Tabel Dependensi Kritis (Yang Paling Sering Salah)

| Jika kamu mengerjakan ini... | Kamu HARUS sudah selesai... | Kalau tidak... |
|---|---|---|
| `ENG-02` (Tailwind config) | `UX-01` (Design tokens) | Brand colors tidak masuk ke Tailwind, harus redo config |
| `ENG-04` (Env vars) | Semua spikes (SPIKE-02, 04, 08) | `.env.local.example` tidak lengkap, env vars ada yang ketinggalan |
| `ENG-09` (Supabase CLI) | `SPIKE-07` (CLI spike) | Workflow salah, migration format tidak standard |
| `ENG-11` (Supabase client) | `SPIKE-02` (Auth spike) | Mungkin pakai package deprecated / cara baca cookie yang salah |
| `ENG-14` (middleware.ts) | `ENG-11` (Supabase client) | Tidak bisa panggil `updateSession()`, session tidak di-refresh |
| `ENG-17` (POST /login) | `ENG-16` (JWT dependency) | Tidak ada cara validasi token di endpoint berikutnya |
| `ENG-28` (Admin Login page) | `ENG-14` (middleware) | Tidak bisa test apakah redirect setelah login bekerja |
| `ENG-31` (Admin Layout) | `ENG-29` (Sidebar) + `ENG-30` (Header) | Layout tidak bisa dirender, halaman admin error |
| `ENG-35` (Update CORS) | `ENG-33` (Vercel deployed) | Tidak punya staging URL untuk dimasukkan ke ALLOWED_ORIGINS |
| `ENG-39` (Rate limiting) | `ENG-17` (POST /login endpoint) | Tidak ada endpoint yang di-rate-limit |
| Semua QA tasks | `ENG-35` (full staging live) | QA harus di staging, tidak valid di localhost |

---

## 📋 Master Checklist — Semua 89 Task Berurutan

```
FASE 0 — Pre-Code
 [ ] 01. E1-UX-01   Design tokens
 [ ] 02. E1-UX-07   Routing architecture
 [ ] 03. E1-SPIKE-01 Next.js conventions
 [ ] 04. E1-SPIKE-03 FastAPI structure
     ↓ Review E1-US-01 s/d E1-US-09 sebagai referensi AC

FASE 1 — Scaffold
 [ ] 05. E1-ENG-07  GitHub repo
 [ ] 06. E1-ENG-01  Init Next.js
 [ ] 07. E1-ENG-03  Folder structure
 [ ] 08. E1-ENG-05  Init FastAPI

FASE 2 — Infrastructure Spikes
 [ ] 09. E1-ENG-08  Create Supabase project
 [ ] 10. E1-SPIKE-07 Supabase CLI spike
 [ ] 11. E1-SPIKE-04 Deployment pipeline spike
 [ ] 12. E1-SPIKE-08 Sentry evaluation
 [ ] 13. E1-SPIKE-02 Supabase Auth spike
 [ ] 14. E1-SPIKE-05 RLS pattern library

FASE 3 — Config & Design System
 [ ] 15. E1-ENG-04  Environment variables
 [ ] 16. E1-SPIKE-06 Tailwind + shadcn spike
 [ ] 17. E1-ENG-02  Configure Tailwind + shadcn

FASE 4 — Database Foundation
 [ ] 18. E1-ENG-09  Supabase CLI setup
 [ ] 19. E1-ENG-10  First migration (RLS)
 [ ] 20. E1-ENG-12  Storage buckets
 [ ] 21. E1-ENG-13  Create admin account
 [ ] 22. E1-ENG-11  Supabase client (Next.js)

FASE 5 — API Contract + FastAPI
 [ ] 23. E1-SPIKE-09 API contract spike
 [ ] 24. E1-ENG-40  TypeScript types + Pydantic schemas
 [ ] 25. E1-ENG-06  CORS + health check (FastAPI)
 [ ] 26. E1-ENG-16  JWT dependency (BLOCKER)
 [ ] 27. E1-ENG-17  POST /auth/login
 [ ] 28. E1-ENG-18  POST /auth/logout
 [ ] 29. E1-ENG-19  GET /auth/me
 [ ] 30. E1-ENG-39  Rate limiting

FASE 6 — Auth Middleware
 [ ] 31. E1-ENG-14  middleware.ts
 [ ] 32. E1-ENG-15  Test auth redirect (lokal)

FASE 7 — Public Layout UI
 [ ] 33. E1-UX-02   Wireframe Navbar
 [ ] 34. E1-ENG-20  Navbar desktop
 [ ] 35. E1-ENG-21  Mobile hamburger
 [ ] 36. E1-ENG-22  Sticky + scroll shadow
 [ ] 37. E1-UX-03   Wireframe Footer
 [ ] 38. E1-ENG-23  Footer component
 [ ] 39. E1-ENG-24  Root layout (wire Navbar + Footer)
 [ ] 40. E1-UX-04   Wireframe 404
 [ ] 41. E1-ENG-25  404 page
 [ ] 42. E1-UX-08   Skeleton pattern library
 [ ] 43. E1-ENG-26  Skeleton components
 [ ] 44. E1-ENG-27  Placeholder homepage

FASE 8 — Admin Panel UI
 [ ] 45. E1-UX-05   Wireframe Admin Login
 [ ] 46. E1-UX-06   Wireframe Admin Layout
 [ ] 47. E1-ENG-29  Admin Sidebar
 [ ] 48. E1-ENG-30  Admin Header
 [ ] 49. E1-ENG-28  Admin Login page
 [ ] 50. E1-ENG-31  Wire Admin Layout
 [ ] 51. E1-ENG-32  Admin Dashboard placeholder

FASE 9 — Security + Observability
 [ ] 52. E1-ENG-38  HTTP Security Headers
 [ ] 53. E1-ENG-36  Sentry Next.js
 [ ] 54. E1-ENG-37  Sentry FastAPI

FASE 10 — Deployment
 [ ] 55. E1-ENG-33  Deploy Next.js → Vercel
 [ ] 56. E1-ENG-34  Deploy FastAPI → Railway
 [ ] 57. E1-ENG-35  Update CORS + end-to-end test

FASE 11 — QA (Staging)
 [ ] 58. E1-QA-01   Navbar desktop
 [ ] 59. E1-QA-02   Navbar mobile
 [ ] 60. E1-QA-03   Navbar sticky
 [ ] 61. E1-QA-04   Footer
 [ ] 62. E1-QA-05   404 page
 [ ] 63. E1-QA-06   Admin login happy path
 [ ] 64. E1-QA-07   Admin login error
 [ ] 65. E1-QA-08   Logout
 [ ] 66. E1-QA-09   Protected routes
 [ ] 67. E1-QA-10   Redirect saat sudah login
 [ ] 68. E1-QA-11   Session persistence
 [ ] 69. E1-QA-12   Cross-browser
 [ ] 70. E1-QA-13   Responsive breakpoints
 [ ] 71. E1-QA-14   Lighthouse audit
 [ ] 72. E1-QA-15   Supabase + RLS staging
 [ ] 73. E1-QA-16   FastAPI health + CORS + Sentry
 [ ] 74. E1-QA-17   Env vars Vercel + Railway
 [ ] 75. E1-QA-18   Sentry aktif kedua project
 [ ] 76. E1-QA-19   Security headers scan
 [ ] 77. E1-QA-20   Rate limiting test
 [ ] 78. E1-QA-21   Keyboard navigation
 [ ] 79. E1-QA-22   Screen reader
 [ ] 80. E1-QA-23   DoD Final Checklist ← EPIC 1 DONE ✅
```

---

## ❓ FAQ untuk Solo Developer

**Q: Haruskah semua wireframe (UX-02 s/d UX-06) dikerjakan sebelum mulai coding?**  
A: Tidak. UX-01 dan UX-07 harus ada di awal (Fase 0). Sisanya dikerjakan *tepat sebelum* komponen terkait — ini lebih efisien untuk solo developer dan menjaga konteks tetap segar saat coding.

**Q: Layer 3 (User Stories) dikerjakan kapan?**  
A: User Stories sudah ada di task breakdown — tidak perlu dibuat ulang. Cukup baca setiap US sebelum mulai engineering task yang relevan sebagai checklist acceptance criteria.

**Q: Bisakah FASE 5 (FastAPI) dan FASE 7 (Public Layout UI) dikerjakan paralel?**  
A: Secara teknis bisa (tidak ada dependensi silang), tapi sebagai solo developer lebih baik selesaikan satu track dulu. Backend auth yang berfungsi (Fase 5-6) lebih kritis untuk testing end-to-end daripada tampilan publik.

**Q: Kenapa `E1-ENG-12` (Storage buckets) dilakukan di Fase 4, padahal baru dipakai di Epic 2?**  
A: Karena setup-nya hanya butuh akses Supabase dashboard dan tidak ada dependensi coding. Lebih efisien dikerjakan saat Supabase sudah terbuka dan ter-linked — daripada balik buka Supabase lagi nanti.

---

*Dibuat berdasarkan analisis dependensi Epic 1 Task Breakdown v1.1 · CV Reka Cipta Indonesia*
