# Epic 1 — Fondasi Project & Global Layout
## CV Reka Cipta Indonesia · Web Platform & CRM System

> **Versi:** 1.1 (Updated — Professional Standards) &emsp;
> **Total Tasks:** 89 &emsp;
> **Metode:** MDD (Module-Driven Development) + Vertical Slicing &emsp;
> **Status:** Draft · Mei 2026

---

## Tujuan Epic

Menyiapkan seluruh infrastruktur teknis dan elemen antarmuka global yang menjadi fondasi semua epic berikutnya. Setelah epic ini selesai, proyek memiliki: struktur folder yang baku, koneksi database aktif dan ter-migrasi secara otomatis, sistem autentikasi admin yang aman (dengan rate limiting), layout global (navbar + footer) tampil di website publik, serta observability aktif di staging.

**Demo ke klien setelah epic ini selesai:**  
Website dapat dibuka di URL staging. Navbar dan footer tampil benar di mobile & desktop. Halaman login admin berfungsi dan redirect ke dashboard. Tidak ada silent error yang lolos tanpa notifikasi ke developer.

---

## Ringkasan Per Layer

| # | Layer | Tasks | Penambahan v1.1 |
|---|-------|:-----:|----------------|
| 1 | UX & Information Architecture | 8 | — |
| 2 | Technical Architecture & Spikes | 9 | +3 (DB migrations, Sentry, API contract) |
| 3 | User Stories | 9 | — |
| 4 | Engineering Sub-tasks | 40 | +5 (Supabase CLI, Sentry, Security Headers, Rate Limiting, Types) |
| 5 | QA & Observability | 23 | +5 (Sentry verify, security scan, rate limit test, a11y manual) |
| | **Total** | **89** | **+13 dari v1.0** |

---

## Layer 1 · UX & Information Architecture

Menetapkan semua keputusan desain dan arsitektur informasi sebelum baris kode pertama ditulis. Semua task di layer ini menghasilkan artefak yang menjadi referensi engineer.

---

#### `E1-UX-01` — Design token & brand color system
**Priority:** 🔴 HIGH &emsp; **Tags:** `Design` &nbsp;·&nbsp; `Blocker`

Menetapkan pondasi visual yang dipakai di seluruh project. Semua komponen UI bergantung pada token ini — kerjakan pertama sebelum menyentuh kode apapun.

- [ ] Definisikan palette warna brand: `primary` (biru aksen CTA), `secondary`, `neutral`, `accent`, `destructive/error`, `success`, `warning`
- [ ] Definisikan typography scale: H1–H4 (ukuran + weight + line-height), `body`, `caption`, `label`, `overline`
- [ ] Definisikan spacing system berbasis 4px unit: 4, 8, 12, 16, 20, 24, 32, 48, 64, 80px
- [ ] Definisikan border-radius tokens: `sm` (4px), `md` (8px), `lg` (12px), `full` (9999px)
- [ ] Extend `tailwind.config.ts` dengan semua brand token di atas
- [ ] Setup `globals.css` dengan CSS custom properties — siapkan variable untuk dark mode meski belum diimplementasi di v1

> **Output:** `tailwind.config.ts` (theme extension) + `globals.css` (CSS variables) yang siap dipakai semua engineer

#### `E1-UX-02` — Wireframe Global Navbar (desktop + mobile)
**Priority:** 🔴 HIGH &emsp; **Tags:** `Design` &nbsp;·&nbsp; `Frontend`

Spesifikasi visual dan behavior lengkap untuk navbar yang tampil di semua halaman publik.

- [ ] Desktop (>1024px): logo perusahaan di kiri, menu navigasi di tengah, CTA button `Minta Penawaran` di kanan (warna primary)
- [ ] Menu items: Beranda · Produk · Tentang Kami · Artikel · Kalkulator · Minta Penawaran · Jadi Supplier
- [ ] Mobile (<768px): logo di kiri, hamburger icon (☰) di kanan — menu items tersembunyi
- [ ] Mobile open state: drawer/dropdown dengan semua nav items
- [ ] Sticky behavior: `position: sticky; top: 0; z-index: 50` — tambah shadow-sm saat `scrollY > 10`
- [ ] Active link state: underline atau accent color untuk halaman yang sedang aktif (detect via `usePathname()`)
- [ ] Hover state: color transition 150ms per link
- [ ] Accessibility: nav harus bisa diakses keyboard — focus ring visible, hamburger button punya `aria-label`

> **Output:** Wireframe (bisa berupa Figma frame, Excalidraw, atau deskripsi tertulis detail yang disepakati tim)

#### `E1-UX-03` — Wireframe Global Footer
**Priority:** 🟡 MED &emsp; **Tags:** `Design` &nbsp;·&nbsp; `Frontend`

Layout footer 3-kolom yang tampil di semua halaman publik, responsif di mobile.

- [ ] Kolom 1 (kiri): logo perusahaan + tagline singkat perusahaan
- [ ] Kolom 2 (tengah): link navigasi utama (subset dari navbar)
- [ ] Kolom 3 (kanan): info kontak — alamat lengkap, WA 1 (082136096528), WA 2 (087839031378), email
- [ ] Baris bawah (full-width): badge SNI · badge NIB · © 2025 CV Reka Cipta Indonesia
- [ ] Responsive: 3 kolom di desktop (>768px) → 1 kolom stacked di mobile
- [ ] Tentukan warna background footer (gelap/netral) dan warna teks di atasnya

#### `E1-UX-04` — Wireframe halaman 404
**Priority:** 🔵 LOW &emsp; **Tags:** `Design` &nbsp;·&nbsp; `Frontend`

Halaman error yang brand-consistent untuk setiap URL yang tidak dikenal sistem.

- [ ] Tampilkan kode error '404' secara visual (besar, sebagai focal point)
- [ ] Pesan error Bahasa Indonesia: 'Halaman yang kamu cari tidak ditemukan.'
- [ ] Tombol CTA: 'Kembali ke Beranda' → navigasi ke `/`
- [ ] Navbar dan Footer tetap tampil (menggunakan root layout)
- [ ] Visual treatment sesuai brand — jangan default browser 404

#### `E1-UX-05` — Wireframe Admin Login page (/admin/login)
**Priority:** 🔴 HIGH &emsp; **Tags:** `Design` &nbsp;·&nbsp; `Auth` &nbsp;·&nbsp; `Admin`

Satu-satunya pintu masuk ke CRM. Desain harus simpel dan tidak memberikan informasi berlebih ke penyerang.

- [ ] Layout: card ter-center di tengah halaman, full-height background
- [ ] Komponen dari atas ke bawah: logo perusahaan, judul 'Admin Panel', field Email, field Password, button 'Masuk'
- [ ] Button 'Masuk': full width, warna primary, loading state (spinner + disabled) saat submit
- [ ] Error state: inline message di bawah form — gunakan pesan generic ('Kredensial tidak valid') tanpa membedakan email vs password salah
- [ ] TIDAK ada link 'Daftar', 'Lupa Password', atau tautan lainnya (by design — keamanan)
- [ ] Halaman ini punya layout TERSENDIRI — tidak menggunakan root layout (tidak ada Navbar/Footer publik)

#### `E1-UX-06` — Wireframe Admin Layout (sidebar + header + content area)
**Priority:** 🔴 HIGH &emsp; **Tags:** `Design` &nbsp;·&nbsp; `Admin`

Layout global yang dipakai di semua halaman admin panel setelah login.

- [ ] Sidebar: lebar 240px, fixed di kiri, full height, background gelap/netral
- [ ] Sidebar dari atas ke bawah: logo perusahaan, nav menu, spacer (flex-grow), user email, tombol 'Logout'
- [ ] Nav menu items: Dashboard · Leads & RFQ · Supplier · Artikel · Produk · Pengaturan
- [ ] Active item: background accent + warna teks berubah, deteksi otomatis via `usePathname()`
- [ ] Header atas: judul halaman saat ini (H1 besar) + breadcrumb opsional di bawahnya
- [ ] Content area: sisa lebar (kanan sidebar), scrollable, padding konsisten 24px
- [ ] Mobile consideration: sidebar bisa collapse menjadi icon-only atau drawer (opsional — catat sebagai v2 improvement jika skip)

#### `E1-UX-07` — Definisi routing & navigation architecture
**Priority:** 🔴 HIGH &emsp; **Tags:** `Design` &nbsp;·&nbsp; `Infra`

Dokumentasi semua routes, auth state transitions, dan redirect logic dalam satu artefak referensi. Ini menjadi kontrak antara designer dan engineer.

- [ ] Daftarkan semua PUBLIC routes: `/` · `/produk` · `/produk/[slug]` · `/tentang-kami` · `/kontak` · `/artikel` · `/artikel/[slug]` · `/kalkulator` · `/minta-penawaran` · `/jadi-supplier`
- [ ] Daftarkan semua ADMIN routes: `/admin/login` · `/admin/dashboard` · `/admin/leads` · `/admin/supplier` · `/admin/articles` · `/admin/products` · `/admin/settings`
- [ ] Definisikan 4 redirect rules: (1) `/admin/*` tanpa session → `/admin/login`, (2) `/admin/login` dengan session → `/admin/dashboard`, (3) login sukses → `/admin/dashboard`, (4) logout → `/admin/login`
- [ ] Buat flowchart sederhana auth state transitions (boleh ASCII diagram atau tool pilihan)
- [ ] Tentukan: apakah ada halaman yang butuh ISR/SSR/SSG masing-masing — dokumentasikan per halaman

> **Output:** Dokumen routing (bisa berupa tabel Markdown atau diagram) yang disetujui tim sebelum engineering mulai

#### `E1-UX-08` — Loading skeleton pattern library
**Priority:** 🔵 LOW &emsp; **Tags:** `Design` &nbsp;·&nbsp; `Frontend`

Definisi komponen skeleton yang dipakai di seluruh halaman saat data sedang dimuat via API.

- [ ] Variant `TextLineSkeleton`: satu baris teks, bisa full-width atau partial (75%, 50%)
- [ ] Variant `CardSkeleton`: card dengan image placeholder (atas) + 3 text line skeletons (bawah)
- [ ] Variant `ImageSkeleton`: aspect ratio 16:9 atau 1:1, full-width
- [ ] Variant `TableRowSkeleton`: 5 kolom, tinggi 48px
- [ ] Animation: CSS pulse — opacity 0.5 ↔ 1.0, duration 1.5s, ease-in-out
- [ ] Gunakan shadcn/ui `<Skeleton />` component sebagai base implementation

---

## Layer 2 · Technical Architecture & Spikes

Validasi semua asumsi teknis sebelum menulis production code. Setiap spike menghasilkan keputusan yang terdokumentasi — bukan hanya kode.

---

#### `E1-SPIKE-01` — Spike: Next.js 14 App Router conventions & folder structure
**Priority:** 🔴 HIGH &emsp; **Tags:** `Infra` &nbsp;·&nbsp; `Frontend` &nbsp;·&nbsp; `Blocker`

Validasi dan dokumentasikan konvensi project sebelum mulai coding. Ini menjadi pedoman seluruh sesi development.

- [ ] Validasi App Router conventions: `/app`, `/app/api`, server vs client component boundaries
- [ ] Tentukan folder structure: `/app` (pages) · `/components/ui` · `/components/layout` · `/components/sections` · `/lib` · `/lib/supabase` · `/types` · `/hooks` · `/constants`
- [ ] Naming conventions: PascalCase untuk components (`Navbar.tsx`), kebab-case untuk non-component files (`nav-links.ts`), camelCase untuk functions
- [ ] Configure `tsconfig.json`: `strict: true`, path alias `@/*` → root
- [ ] Tentukan secara eksplisit: komponen mana yang HARUS `'use client'` vs bisa Server Component
- [ ] Tentukan pola data fetching: kapan fetch langsung ke Supabase vs melalui FastAPI

> **Output:** `ARCHITECTURE.md` di root project — dokumen referensi yang diupdate setiap ada keputusan arsitektural baru

#### `E1-SPIKE-02` — Spike: Supabase Auth + Next.js middleware session management
**Priority:** 🔴 HIGH &emsp; **Tags:** `Auth` &nbsp;·&nbsp; `Backend` &nbsp;·&nbsp; `Blocker`

Validasi pendekatan auth sebelum implementasi. Salah pilih package atau pola bisa menyebabkan refactor besar di tengah project.

- [ ] Gunakan `@supabase/ssr` (package resmi terbaru) — bukan `@supabase/auth-helpers` yang deprecated
- [ ] Test `createServerClient` di Server Components: cara baca session dari cookies dengan benar
- [ ] Test `createBrowserClient` di Client Components: cara handle interaksi user (login, logout)
- [ ] Test `middleware.ts`: `updateSession()` harus dipanggil di setiap request untuk refresh cookie
- [ ] Validasi JWT behavior: expiry 1 jam + refresh token auto-rotate
- [ ] Identifikasi edge case: apa yang terjadi saat token expired di tengah sesi aktif?

> **Output:** Dokumentasi cara pakai Supabase client per context (Server Component / Client Component / Middleware / Route Handler)

#### `E1-SPIKE-03` — Spike: FastAPI project structure, CORS & error handling standard
**Priority:** 🔴 HIGH &emsp; **Tags:** `Backend` &nbsp;·&nbsp; `Infra`

Definisi struktur FastAPI yang konsisten untuk semua endpoint di epic berikutnya.

- [ ] Folder structure: `/routers` · `/models` · `/schemas` · `/dependencies` · `/core/config.py` · `/core/supabase.py`
- [ ] Gunakan `pydantic-settings` untuk environment variables — validasi saat startup, bukan saat runtime
- [ ] CORS config: `allow_origins` dari config (list URL, bukan wildcard `*` di production)
- [ ] Standardisasi error response: `{ detail: str, code: str }` untuk semua HTTPException
- [ ] Tentukan logging format: structured JSON logging ke stdout (agar mudah di-parse oleh Railway/Sentry)
- [ ] Test: apakah FastAPI bisa di-cold start di Railway dalam waktu wajar?

> **Output:** Template `main.py` + folder structure yang bisa langsung digunakan untuk semua epic berikutnya

#### `E1-SPIKE-04` — Spike: Vercel + Railway deployment pipeline & branch strategy
**Priority:** 🔴 HIGH &emsp; **Tags:** `Infra`

Setup CI/CD pipeline sejak awal agar staging environment tersedia untuk demo klien sejak Epic 1 selesai.

- [ ] Setup Vercel project → connect GitHub repo → konfigurasi auto-deploy
- [ ] Setup Railway project → connect `/backend` folder → konfigurasi start command
- [ ] Branch strategy: `main` → production auto-deploy · `dev` → staging auto-deploy · `feature/*` → preview deploy (opsional)
- [ ] Env var management: Vercel dashboard untuk Next.js vars · Railway dashboard untuk FastAPI vars
- [ ] Naming convention env vars: `NEXT_PUBLIC_` prefix hanya untuk vars yang aman di-expose ke browser
- [ ] Test: push dummy commit → verifikasi auto-deploy berjalan di kedua platform

> **Output:** Deployment checklist + section di `README.md` tentang cara deploy dan rollback

#### `E1-SPIKE-05` — Spike: Supabase RLS policy pattern library
**Priority:** 🟡 MED &emsp; **Tags:** `Database` &nbsp;·&nbsp; `Auth`

Buat template RLS policy yang reusable untuk semua tabel di epic berikutnya. Jangan design per-tabel — design per-pattern.

- [ ] Pattern A — **Public READ, Auth WRITE**: semua user bisa `SELECT`, hanya `auth.uid()` valid bisa `INSERT/UPDATE/DELETE`
- [ ] Pattern B — **Auth READ + WRITE**: hanya `auth.uid()` valid yang bisa semua operasi
- [ ] Pattern C — **Public READ only, No Write via API**: semua bisa `SELECT`, tidak ada write (data hanya dari seed/migration)
- [ ] Test setiap pattern: verifikasi anonymous request via REST ditolak saat harusnya ditolak
- [ ] Dokumentasikan: kapan harus pakai pattern mana (decision tree sederhana)

> **Output:** File `supabase/migrations/00000000000000_rls_patterns_template.sql` sebagai referensi copy-paste untuk migration berikutnya

#### `E1-SPIKE-06` — Spike: Tailwind CSS + shadcn/ui design system setup & validation
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` &nbsp;·&nbsp; `Design` &nbsp;·&nbsp; `Blocker`

Konfigurasi design system lengkap sebelum build komponen apapun — termasuk validasi bahwa semua tools saling kompatibel.

- [ ] Install & init shadcn/ui: `npx shadcn@latest init` (pilih style: Default, base color: Neutral atau Slate)
- [ ] Daftarkan komponen shadcn yang dibutuhkan di Epic 1: `Button Input Label Form Card Skeleton Badge Separator DropdownMenu`
- [ ] Install command: `npx shadcn@latest add button input label form card skeleton badge separator dropdown-menu`
- [ ] Extend `tailwind.config.ts` dengan brand colors dari E1-UX-01
- [ ] Verifikasi `globals.css` memiliki semua CSS variables yang dihasilkan shadcn
- [ ] Smoke test: render 1 `<Button>`, 1 `<Input>`, 1 `<Card>` — pastikan styling dan dark mode variable benar

> **Output:** Design system siap pakai — semua komponen terinstall dan terintegrasi dengan brand tokens

#### `E1-SPIKE-07` — Spike: Supabase CLI + database-as-code migration workflow ⭐ `BARU`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Database` &nbsp;·&nbsp; `Infra` &nbsp;·&nbsp; `Blocker`

**Penambahan v1.1.** Validasi workflow migrasi database menggunakan Supabase CLI sehingga schema database bisa di-version control dan di-apply secara otomatis ke staging/production. Ini adalah requirement profesional standar — schema tidak boleh hanya hidup di Supabase dashboard.

- [ ] Install Supabase CLI: `npm install supabase --save-dev` atau `brew install supabase/tap/supabase`
- [ ] Init migration directory: `supabase init` → generates folder `supabase/migrations/`
- [ ] Test `supabase login` dan `supabase link --project-ref <project-id>` — pastikan CLI bisa connect ke project
- [ ] Test workflow lengkap: buat migration baru → `supabase migration new test_table` → edit SQL → `supabase db push` → verifikasi di dashboard
- [ ] Validasi: `supabase db diff` untuk generate migration dari perubahan lokal
- [ ] Tentukan: apakah pakai `supabase db push` manual atau integrate ke GitHub Actions untuk auto-apply?
- [ ] Dokumentasikan workflow untuk semua engineer: cara buat migration baru, cara rollback, cara sync ke environment baru

> **Output:** Workflow terdokumentasi di `ARCHITECTURE.md` + folder `supabase/migrations/` siap digunakan

#### `E1-SPIKE-08` — Spike: Sentry SDK evaluation untuk Next.js & FastAPI ⭐ `BARU`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Infra` &nbsp;·&nbsp; `Observability`

**Penambahan v1.1.** Validasi integrasi Sentry sebelum implementasi. Tanpa error tracking otomatis, bug di staging bisa tidak terdeteksi dan sampai ke production tanpa sepengetahuan developer.

- [ ] Buat akun Sentry gratis (atau gunakan yang sudah ada) → buat 2 project: `reka-cipta-web` (Next.js) dan `reka-cipta-api` (Python FastAPI)
- [ ] Test Sentry Next.js SDK: `npm install @sentry/nextjs` → `npx @sentry/wizard@latest -i nextjs` → verifikasi Sentry menangkap test error
- [ ] Test Sentry Python SDK: `pip install sentry-sdk[fastapi]` → verifikasi Sentry menangkap unhandled FastAPI exception
- [ ] Validasi: apakah Sentry Source Maps berfungsi untuk Next.js? (penting untuk stacktrace yang readable)
- [ ] Tentukan: environment tagging (`staging` vs `production`) dan release tracking strategy
- [ ] Tentukan: alert rules — kapan Sentry kirim notifikasi? (first occurrence, regression, spike)

> **Output:** DSN untuk Next.js dan FastAPI, dokumentasi konfigurasi, dan alert rules yang sudah disetujui

#### `E1-SPIKE-09` — Spike: API contract definition — TypeScript ↔ Pydantic schema sync ⭐ `BARU`
**Priority:** 🟡 MED &emsp; **Tags:** `Backend` &nbsp;·&nbsp; `Frontend` &nbsp;·&nbsp; `Infra`

**Penambahan v1.1.** Pastikan TypeScript interfaces di Next.js dan Pydantic schemas di FastAPI selalu sinkron sebelum UI work dimulai. Inkonsistensi type antara frontend dan backend adalah sumber bug yang sulit di-debug.

- [ ] Buat `/types/api.ts` di Next.js: definisikan TypeScript interface untuk semua API response yang dipakai di Epic 1 (`AuthResponse`, `UserProfile`)
- [ ] Pastikan setiap field di Pydantic schema FastAPI memiliki pasangan yang tepat di TypeScript (nama field, tipe data, nullable)
- [ ] Buat `/schemas/auth.py` di FastAPI: Pydantic models untuk request/response auth endpoints
- [ ] Evaluasi tools otomasi (opsional untuk v1): `openapi-typescript` bisa auto-generate TypeScript dari FastAPI OpenAPI spec
- [ ] Dokumentasikan: jika ada perubahan schema Pydantic → wajib update TypeScript types secara manual (atau via tool) sebelum PR merge

> **Output:** `/types/api.ts` dengan semua types untuk Epic 1 + `/schemas/auth.py` yang aligned + keputusan tentang otomasi vs manual sync

---

## Layer 3 · User Stories

Setiap user story mendeskripsikan satu kebutuhan pengguna dari perspektif mereka. Acceptance Criteria adalah kontrak antara product dan engineering — bisa langsung dipakai sebagai checklist QA.

---

#### `E1-US-01` — Admin: Login dengan email dan password (happy path)
**Priority:** 🔴 HIGH &emsp; **Tags:** `Auth` &nbsp;·&nbsp; `Admin`

*As an admin, I want to log in using my email and password, so that I can securely access the admin panel.*

**Acceptance Criteria:**
- [ ] Form menampilkan field `Email` dan `Password` dengan label yang jelas
- [ ] Tombol `Masuk` ada dan dapat diklik
- [ ] Submit dengan credentials valid → loading state aktif → redirect ke `/admin/dashboard`
- [ ] JWT session tersimpan di httpOnly cookie (managed oleh Supabase — tidak accessible via `document.cookie`)
- [ ] TIDAK ada link registrasi, lupa password, atau tautan apapun selain form

#### `E1-US-02` — Admin: Melihat pesan error yang jelas saat credentials salah
**Priority:** 🔴 HIGH &emsp; **Tags:** `Auth`

*As an admin, when I enter wrong credentials, I want to see a clear but non-revealing error message, so that I know to try again without giving an attacker useful information.*

**Acceptance Criteria:**
- [ ] Login dengan password salah → pesan error: 'Kredensial tidak valid. Silakan coba lagi.'
- [ ] Login dengan email tidak terdaftar → pesan error YANG SAMA (tidak boleh membedakan 'email tidak ada' vs 'password salah')
- [ ] Field email tidak di-clear setelah error, field password di-clear
- [ ] Tombol `Masuk` kembali aktif setelah error — admin bisa mencoba lagi
- [ ] Tidak ada redirect yang terjadi
- [ ] Setelah N kali gagal, rate limiter memblokir request (lihat E1-ENG-42)

#### `E1-US-03` — Admin: Session tetap aktif saat refresh atau buka tab baru
**Priority:** 🔴 HIGH &emsp; **Tags:** `Auth`

*As an admin, I want my session to persist when I refresh the page or open a new tab, so that I don't have to log in repeatedly during a working session.*

**Acceptance Criteria:**
- [ ] Login → refresh halaman `/admin/dashboard` → tetap di dashboard, tidak redirect ke login
- [ ] Login → tutup browser → buka kembali `/admin/dashboard` → tetap login (cookie persists)
- [ ] Session valid selama refresh token belum expire
- [ ] Setelah JWT expire → middleware detect → redirect otomatis ke `/admin/login`

#### `E1-US-04` — Admin: Logout dan session diakhiri dengan aman
**Priority:** 🔴 HIGH &emsp; **Tags:** `Auth`

*As an admin, I want to log out so that my session is terminated and the account is secure when I leave the computer.*

**Acceptance Criteria:**
- [ ] Tombol `Logout` selalu terlihat di sidebar admin panel
- [ ] Klik logout → panggil Supabase `signOut()` → session cookie dihapus dari browser
- [ ] Setelah logout → redirect ke `/admin/login`
- [ ] Setelah logout: tekan tombol Back di browser → tidak bisa kembali ke halaman admin (middleware redirect ke login)
- [ ] Session di Supabase juga diinvalidasi (server-side signout)

#### `E1-US-05` — System: Semua route /admin/* terlindungi dari akses tidak sah
**Priority:** 🔴 HIGH &emsp; **Tags:** `Auth` &nbsp;·&nbsp; `Infra`

*As a system, I want all admin routes to be protected so that only authenticated admins can access the CRM panel.*

**Acceptance Criteria:**
- [ ] Akses `/admin/dashboard` tanpa session → redirect ke `/admin/login`
- [ ] Akses `/admin/settings` tanpa session → redirect ke `/admin/login`
- [ ] Berlaku untuk SEMUA route di bawah `/admin/*` kecuali `/admin/login`
- [ ] Akses `/admin/login` saat session aktif → redirect ke `/admin/dashboard`
- [ ] Redirect terjadi di **server-side middleware** — tidak ada flash of protected content di browser

#### `E1-US-06` — Visitor: Navigasi website melalui Navbar
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend`

*As a website visitor, I want a clear and accessible navigation bar so that I can find what I need quickly, even on mobile.*

**Acceptance Criteria:**
- [ ] Semua 7 menu item terlihat di desktop: Beranda · Produk · Tentang Kami · Artikel · Kalkulator · Minta Penawaran · Jadi Supplier
- [ ] CTA `Minta Penawaran` berwarna aksen biru dan menonjol dibanding link biasa
- [ ] Di mobile (<768px): hamburger icon tampil, desktop nav items tersembunyi
- [ ] Tap hamburger → menu terbuka dengan semua nav items
- [ ] Tap nav item → navigasi terjadi + menu tertutup
- [ ] Navbar sticky: tetap di atas saat scroll ke bawah
- [ ] Keyboard: semua nav items bisa diakses via Tab key, hamburger button punya `aria-label='Buka menu'`

#### `E1-US-07` — Visitor: Menemukan informasi kontak di Footer
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend`

*As a website visitor, I want to see company contact information in the footer of every page, so that I can reach out without having to navigate to a contact page.*

**Acceptance Criteria:**
- [ ] Footer tampil di semua halaman publik
- [ ] Menampilkan: logo, tagline perusahaan, link navigasi, alamat lengkap, nomor WA (dua nomor), email
- [ ] Badge SNI dan NIB terlihat di baris bawah footer
- [ ] Copyright line tampil
- [ ] Responsive: layout yang benar di desktop (3 kolom) dan mobile (1 kolom stacked)

#### `E1-US-08` — Visitor: Melihat halaman 404 yang helpful saat URL tidak ditemukan
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend`

*As a website visitor, when I visit a URL that doesn't exist, I want to see a helpful branded error page instead of a blank screen, so that I can navigate back.*

**Acceptance Criteria:**
- [ ] Mengunjungi URL tidak dikenal (misal `/halaman-tidak-ada`) → tampil halaman 404 custom (bukan default browser)
- [ ] Pesan error dalam Bahasa Indonesia
- [ ] Tombol `Kembali ke Beranda` berfungsi — navigasi ke `/`
- [ ] Navbar dan Footer tetap tampil di halaman 404
- [ ] HTTP response code benar-benar 404 (bukan 200) — penting untuk SEO

#### `E1-US-09` — Admin: Melihat dashboard placeholder setelah login berhasil
**Priority:** 🔴 HIGH &emsp; **Tags:** `Admin`

*As an admin, after logging in, I want to see a dashboard page (even if placeholder) so that I know the login was successful and the admin panel is working.*

**Acceptance Criteria:**
- [ ] Setelah login sukses → redirect ke `/admin/dashboard`
- [ ] Admin layout tampil: sidebar kiri + header atas + area konten kanan
- [ ] Sidebar menampilkan menu navigasi dan tombol Logout
- [ ] Konten area menampilkan teks placeholder yang jelas: 'Dashboard — fitur sedang dalam pengembangan'
- [ ] Email user yang sedang login terlihat di bagian bawah sidebar

---

## Layer 4 · Engineering Sub-tasks

Semua task engineering di bawah diasumsikan dikerjakan oleh 1 developer dengan bantuan AI coding tools. Setiap sub-group bisa dikerjakan secara sekuensial. Task dengan label `Blocker` harus selesai sebelum sub-group berikutnya dimulai.

---

### 4.1 — Project Initialization

#### `E1-ENG-01` — Init Next.js 14 project dengan TypeScript & App Router
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` &nbsp;·&nbsp; `Blocker`

- [ ] Run: `npx create-next-app@latest reka-cipta-web --typescript --tailwind --app --no-src-dir --import-alias '@/*'`
- [ ] Hapus boilerplate: bersihkan `app/page.tsx`, hapus default `globals.css` content
- [ ] Verify `tsconfig.json`: `strict: true`, `paths: { '@/*': ['./*'] }`
- [ ] Tambah `.nvmrc` dengan versi Node LTS (20.x)
- [ ] Verifikasi: `npm run build` berhasil tanpa error, `npm run dev` berjalan di localhost:3000

#### `E1-ENG-02` — Configure Tailwind CSS + install shadcn/ui components
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` &nbsp;·&nbsp; `Design` &nbsp;·&nbsp; `Blocker`

- [ ] Run: `npx shadcn@latest init` → pilih style Default, base color Slate atau Neutral
- [ ] Install komponen: `npx shadcn@latest add button input label form card skeleton badge separator dropdown-menu`
- [ ] Extend `tailwind.config.ts` dengan brand tokens dari E1-UX-01 (colors, fontFamily, spacing jika ada custom)
- [ ] Verifikasi `globals.css` memiliki semua CSS variables (--background, --foreground, --primary, dll.)
- [ ] Smoke test: render `<Button>`, `<Input>`, `<Card>` di temporary test page — pastikan styling benar
- [ ] Hapus test page setelah verifikasi

#### `E1-ENG-03` — Setup folder structure & naming conventions
**Priority:** 🔴 HIGH &emsp; **Tags:** `Infra`

- [ ] Buat folders: `/components/ui` · `/components/layout` · `/components/sections`
- [ ] Buat folders: `/lib` · `/lib/supabase` · `/types` · `/hooks` · `/constants`
- [ ] Buat `/constants/navigation.ts`: export array nav items untuk Navbar (label, href, isExternal)
- [ ] Buat `/constants/adminNavigation.ts`: export array nav items untuk Admin Sidebar
- [ ] Buat `/types/index.ts` sebagai barrel export (akan diisi seiring development)
- [ ] Update `ARCHITECTURE.md` dengan folder structure yang final

#### `E1-ENG-04` — Configure environment variables — template & type-safe access
**Priority:** 🔴 HIGH &emsp; **Tags:** `Infra` &nbsp;·&nbsp; `Blocker`

- [ ] Buat `.env.local.example` dengan semua vars: `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_KEY` · `ANTHROPIC_API_KEY` · `RESEND_API_KEY` · `NEXT_PUBLIC_API_URL` · `NEXT_PUBLIC_SENTRY_DSN`
- [ ] Tambah `.env.local` ke `.gitignore`
- [ ] Buat `/lib/env.ts`: type-safe env access dengan runtime validation (`zod` atau manual check)
- [ ] Isi `.env.local` dengan actual values dari Supabase project dan Sentry
- [ ] Dokumentasikan di `README.md`: list semua env vars, tujuannya, dan cara mendapatkan valuenya

#### `E1-ENG-05` — Init FastAPI project dengan folder structure lengkap
**Priority:** 🔴 HIGH &emsp; **Tags:** `Backend` &nbsp;·&nbsp; `Infra`

- [ ] Buat folder `/backend` di root project
- [ ] Setup Python venv: `python -m venv .venv && source .venv/bin/activate`
- [ ] Install dependencies: `pip install fastapi uvicorn[standard] supabase pydantic-settings python-jose[cryptography] httpx sentry-sdk[fastapi]`
- [ ] Buat `requirements.txt`: `pip freeze > requirements.txt`
- [ ] Buat struktur files: `main.py` · `/routers/__init__.py` · `/routers/auth.py` · `/core/config.py` · `/core/supabase.py` · `/dependencies/__init__.py` · `/dependencies/auth.py` · `/schemas/__init__.py` · `/schemas/auth.py`
- [ ] Buat `/backend/.env.example` dengan semua vars yang dibutuhkan FastAPI
- [ ] Verifikasi: `uvicorn main:app --reload` berjalan tanpa error

#### `E1-ENG-06` — Configure CORS + health check endpoint di FastAPI
**Priority:** 🔴 HIGH &emsp; **Tags:** `Backend` &nbsp;·&nbsp; `Infra`

- [ ] Install `CORSMiddleware` di `main.py`
- [ ] `allow_origins`: baca dari config (`ALLOWED_ORIGINS` env var, comma-separated) — JANGAN hardcode
- [ ] `allow_methods`: `['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']`
- [ ] `allow_headers`: `['Authorization', 'Content-Type']`
- [ ] Buat endpoint: `GET /health` → `{ status: 'ok', version: '1.0.0', environment: str }`
- [ ] Test lokal: `curl http://localhost:8000/health` → harus return 200
- [ ] Test CORS lokal: fetch dari localhost:3000 ke localhost:8000 — tidak ada CORS error di console

#### `E1-ENG-07` — Setup GitHub repository & initial commit
**Priority:** 🔴 HIGH &emsp; **Tags:** `Infra`

- [ ] Buat private repo di GitHub: `reka-cipta-web`
- [ ] Buat `.gitignore` komprehensif: `node_modules` · `.env.local` · `.venv` · `__pycache__` · `.next` · `*.pyc` · `.DS_Store`
- [ ] Tulis `README.md`: overview project, tech stack, cara setup local dev environment, list env vars
- [ ] Initial commit dengan struktur project yang bersih
- [ ] Buat branch `dev` dari `main`
- [ ] Push ke GitHub — verifikasi semua file ada dan `.env.local` TIDAK ikut ter-commit

### 4.2 — Supabase Setup

#### `E1-ENG-08` — Create & configure Supabase project
**Priority:** 🔴 HIGH &emsp; **Tags:** `Database` &nbsp;·&nbsp; `Blocker`

- [ ] Buat project baru di supabase.com — pilih region Asia Pacific (Singapore) untuk latency rendah
- [ ] Note dan simpan di password manager: Project URL, anon key, service role key
- [ ] Authentication settings: enable Email provider · **disable** 'Confirm email' (admin dibuat manual) · set JWT expiry 3600s
- [ ] Salin credentials ke `.env.local`
- [ ] Verifikasi koneksi dari Next.js: panggil `supabase.auth.getSession()` dari server component → tidak error

#### `E1-ENG-09` — Setup Supabase CLI + init migration directory
**Priority:** 🔴 HIGH &emsp; **Tags:** `Database` &nbsp;·&nbsp; `Infra` &nbsp;·&nbsp; `Blocker`

**Implementasi dari E1-SPIKE-07.** Semua perubahan database harus melalui migration file yang di-commit ke Git — tidak pernah edit schema langsung via Supabase dashboard.

- [ ] Install Supabase CLI: `npm install supabase --save-dev`
- [ ] Add script di `package.json`: `"db:push": "supabase db push"`, `"db:diff": "supabase db diff"`
- [ ] Login ke CLI: `npx supabase login`
- [ ] Link ke project: `npx supabase link --project-ref <project-ref-id>`
- [ ] Init: `npx supabase init` → generates folder `supabase/` dengan `config.toml`
- [ ] Commit folder `supabase/` ke Git (kecuali `.env` di dalamnya)
- [ ] Verifikasi: `npx supabase status` → menampilkan project info yang benar

#### `E1-ENG-10` — Write & apply first migration: base RLS policy template
**Priority:** 🔴 HIGH &emsp; **Tags:** `Database` &nbsp;·&nbsp; `Auth`

- [ ] Buat migration baru: `npx supabase migration new base_rls_setup`
- [ ] Isi file migration dengan: `ALTER DEFAULT PRIVILEGES` untuk security, enable RLS sebagai default policy
- [ ] Tambahkan SQL helper functions untuk RLS policies yang akan dipakai berulang (misal: `auth.uid() = user_id`)
- [ ] Apply ke Supabase: `npx supabase db push`
- [ ] Verifikasi di Supabase dashboard: migration teraplikasi
- [ ] Test: buat tabel test → verifikasi anonymous REST call ditolak tanpa RLS policy
- [ ] Hapus tabel test setelah verifikasi
- [ ] Dokumentasikan migration workflow di `ARCHITECTURE.md`

#### `E1-ENG-11` — Setup Supabase client di Next.js (@supabase/ssr)
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` &nbsp;·&nbsp; `Auth`

- [ ] Install: `npm install @supabase/ssr`
- [ ] Buat `/lib/supabase/server.ts`: fungsi `createClient()` menggunakan `createServerClient` — baca cookies dari Next.js headers
- [ ] Buat `/lib/supabase/client.ts`: fungsi `createClient()` menggunakan `createBrowserClient`
- [ ] Buat `/lib/supabase/middleware.ts`: fungsi `updateSession()` — dipanggil di setiap middleware request untuk refresh cookie
- [ ] Test: panggil `await supabase.auth.getUser()` di satu Server Component — verifikasi tidak error (null user adalah expected untuk unauthenticated)

#### `E1-ENG-12` — Setup Supabase Storage buckets
**Priority:** 🟡 MED &emsp; **Tags:** `Database` &nbsp;·&nbsp; `Infra`

Persiapan storage untuk Epic 2 dan 3. Belum dipakai di Epic 1.

- [ ] Buat bucket: `product-photos` (Public: true)
- [ ] Buat bucket: `lab-docs` (Public: true)
- [ ] Buat bucket: `article-thumbnails` (Public: true)
- [ ] Buat bucket: `legal-docs` (Public: false — untuk dokumen legal internal)
- [ ] Dokumentasikan URL pattern: `https://<project>.supabase.co/storage/v1/object/public/<bucket>/<filename>`

#### `E1-ENG-13` — Create first admin account via Supabase dashboard
**Priority:** 🔴 HIGH &emsp; **Tags:** `Auth` &nbsp;·&nbsp; `Database`

- [ ] Buka Supabase dashboard → Authentication → Users → Add User
- [ ] Set email dan generate password kuat (min 16 karakter, mix of upper/lower/number/symbol)
- [ ] Simpan credentials di password manager — JANGAN di file apapun yang ada di repository
- [ ] Verifikasi: akun muncul di tabel `auth.users`
- [ ] Test: login dengan akun ini dari form login aplikasi → sukses

### 4.3 — Auth Middleware (Next.js)

#### `E1-ENG-14` — Implement Next.js middleware.ts untuk route protection
**Priority:** 🔴 HIGH &emsp; **Tags:** `Auth` &nbsp;·&nbsp; `Infra` &nbsp;·&nbsp; `Blocker`

- [ ] Buat `/middleware.ts` di root project
- [ ] Panggil `updateSession()` dari `/lib/supabase/middleware.ts` di setiap request
- [ ] Logic proteksi: jika path match `/admin/*` DAN bukan `/admin/login` DAN tidak ada session → `redirect('/admin/login')`
- [ ] Logic redirect: jika path adalah `/admin/login` DAN ada session → `redirect('/admin/dashboard')`
- [ ] Set `config.matcher`: `['/admin/:path*']` — middleware hanya berjalan untuk admin routes
- [ ] Verifikasi tidak ada infinite redirect loop antara `/admin/login` dan `/admin/dashboard`

#### `E1-ENG-15` — Test auth redirect logic secara local sebelum push
**Priority:** 🔴 HIGH &emsp; **Tags:** `Auth` &nbsp;·&nbsp; `QA`

- [ ] Test: buka `localhost:3000/admin/dashboard` tanpa login → harus redirect ke `/admin/login`
- [ ] Test: buka `localhost:3000/admin/settings` tanpa login → harus redirect ke `/admin/login`
- [ ] Test: login → buka `localhost:3000/admin/login` → harus redirect ke `/admin/dashboard`
- [ ] Test: login → refresh `/admin/dashboard` → tetap di dashboard
- [ ] Test: login → logout → tekan Back di browser → harus redirect ke `/admin/login`
- [ ] Dokumentasikan hasil semua test di PR description atau task notes

### 4.4 — FastAPI Auth Endpoints

#### `E1-ENG-16` — Buat JWT validation dependency (dependencies/auth.py)
**Priority:** 🔴 HIGH &emsp; **Tags:** `Backend` &nbsp;·&nbsp; `Auth` &nbsp;·&nbsp; `Blocker`

Buat dependency ini dulu — semua endpoint `[AUTH]` bergantung padanya.

- [ ] Buat fungsi `get_current_user()` di `/dependencies/auth.py` sebagai FastAPI Dependency
- [ ] Extract Bearer token dari `Authorization` header — raise `HTTP 401` jika header tidak ada
- [ ] Validasi token via `supabase.auth.get_user(token)` — raise `HTTP 401` jika expired atau invalid
- [ ] Return `user` object jika valid
- [ ] Penggunaan di endpoint: `user: User = Depends(get_current_user)`
- [ ] Test: panggil endpoint yang menggunakan dependency ini dengan token valid → sukses · dengan token invalid → 401

#### `E1-ENG-17` — Implement POST /api/v1/auth/login
**Priority:** 🔴 HIGH &emsp; **Tags:** `Backend` &nbsp;·&nbsp; `Auth`

- [ ] Router: `/routers/auth.py`
- [ ] Request body schema (`/schemas/auth.py`): `LoginRequest { email: EmailStr, password: str }`
- [ ] Response schema: `AuthResponse { access_token: str, user: UserProfile }`
- [ ] Logic: `supabase.auth.sign_in_with_password({ email, password })`
- [ ] Sukses (200): return `access_token` dan `user` data
- [ ] Gagal (401): return `{ detail: 'Kredensial tidak valid', code: 'INVALID_CREDENTIALS' }` — jangan bedakan email vs password
- [ ] Test via Swagger UI (`/docs`): happy path + error path

#### `E1-ENG-18` — Implement POST /api/v1/auth/logout
**Priority:** 🟡 MED &emsp; **Tags:** `Backend` &nbsp;·&nbsp; `Auth`

- [ ] Require `Authorization: Bearer <token>` header
- [ ] Gunakan `Depends(get_current_user)` dari E1-ENG-16
- [ ] Logic: `supabase.auth.sign_out()`
- [ ] Response 200: `{ message: 'Berhasil logout' }`
- [ ] Response 401 jika token tidak valid (dihandle oleh dependency)

#### `E1-ENG-19` — Implement GET /api/v1/auth/me [AUTH]
**Priority:** 🟡 MED &emsp; **Tags:** `Backend` &nbsp;·&nbsp; `Auth`

- [ ] Gunakan `Depends(get_current_user)` dari E1-ENG-16
- [ ] Response: `{ id: str, email: str, created_at: datetime }`
- [ ] Response 401 jika token expired atau invalid (dihandle oleh dependency)
- [ ] Endpoint ini berguna untuk verifikasi session dari Next.js jika diperlukan

### 4.5 — Frontend: Public Layout

#### `E1-ENG-20` — Build Navbar component — desktop layout
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend`

- [ ] File: `/components/layout/Navbar.tsx` — tambahkan `'use client'` directive (butuh state untuk mobile menu)
- [ ] Logo: gunakan `next/image` dengan logo perusahaan
- [ ] Nav links: map dari `/constants/navigation.ts`, gunakan `next/link`
- [ ] Active link: gunakan `usePathname()` untuk detect dan apply active styling
- [ ] CTA button: shadcn `<Button>` dengan variant primary, text `Minta Penawaran`
- [ ] Accessibility: `<nav aria-label='Navigasi utama'>`, setiap link punya text yang jelas

#### `E1-ENG-21` — Add mobile hamburger menu behavior
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend`

- [ ] State: `const [isOpen, setIsOpen] = useState(false)`
- [ ] Hamburger button: toggle icon ☰/✕ berdasarkan `isOpen`, `aria-label` = 'Buka menu' / 'Tutup menu', `aria-expanded={isOpen}`
- [ ] Mobile menu: div berisi semua nav items, hidden di desktop (`hidden md:flex` pattern Tailwind)
- [ ] Setiap nav link: `onClick={() => setIsOpen(false)}`
- [ ] Tutup menu saat klik di luar: `useEffect` dengan event listener pada `document`
- [ ] Test di 375px viewport (iPhone SE) — pastikan tidak ada overflow

#### `E1-ENG-22` — Sticky Navbar + shadow on scroll
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend`

- [ ] CSS: `className='sticky top-0 z-50 bg-white'`
- [ ] Buat hook `/hooks/useScrollY.ts` → return `scrollY` value
- [ ] Apply shadow: jika `scrollY > 10` → tambah `shadow-sm` class
- [ ] Transisi smooth: `transition-shadow duration-200`
- [ ] Verifikasi: navbar tidak tertimpa element lain (z-index cukup tinggi)

#### `E1-ENG-23` — Build Footer component
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend`

- [ ] File: `/components/layout/Footer.tsx` — Server Component (tidak butuh interactivity)
- [ ] Layout: `grid grid-cols-1 md:grid-cols-3 gap-8`
- [ ] Kolom 1: logo + tagline
- [ ] Kolom 2: quick links dari `/constants/navigation.ts` (subset)
- [ ] Kolom 3: alamat, WA 1 `(082136096528)`, WA 2 `(087839031378)`, email
- [ ] Bottom bar: badge SNI, badge NIB, copyright — `© {new Date().getFullYear()} CV Reka Cipta Indonesia`
- [ ] Accessibility: `<footer aria-label='Footer'>`, links punya text yang jelas

#### `E1-ENG-24` — Wire Navbar + Footer ke root layout (/app/layout.tsx)
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend`

- [ ] Edit `/app/layout.tsx`
- [ ] Import dan render `<Navbar />` dan `<Footer />`
- [ ] Struktur: `<html><body className='flex flex-col min-h-screen'><Navbar /><main className='flex-1'>{children}</main><Footer /></body></html>`
- [ ] Setup font: gunakan `next/font` — pilih font yang sesuai brand (jangan Inter default)
- [ ] Setup metadata default: `title`, `description`, `robots` untuk SEO baseline

#### `E1-ENG-25` — Build 404 page (/app/not-found.tsx)
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend`

- [ ] File: `/app/not-found.tsx` — Next.js App Router convention untuk custom 404
- [ ] Tampilkan angka '404' besar sebagai focal point visual
- [ ] Pesan: 'Halaman yang kamu cari tidak ditemukan.'
- [ ] Tombol: `<Link href='/'>Kembali ke Beranda</Link>` menggunakan shadcn `<Button>` variant
- [ ] Root layout (Navbar + Footer) tampil otomatis
- [ ] Verifikasi: HTTP response status benar-benar 404 (bukan 200)

#### `E1-ENG-26` — Build global Skeleton components
**Priority:** 🔵 LOW &emsp; **Tags:** `Frontend`

- [ ] File: `/components/ui/skeletons/CardSkeleton.tsx` — menggunakan shadcn `<Skeleton />`
- [ ] Buat variants: `TextLineSkeleton` · `ImageSkeleton` · `CardSkeleton` · `TableRowSkeleton`
- [ ] Export dari `/components/ui/skeletons/index.ts`
- [ ] Gunakan di dalam `<Suspense>` boundaries untuk data fetching

#### `E1-ENG-27` — Build placeholder homepage (/app/page.tsx)
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend`

Tujuan: konfirmasi Navbar + Footer tampil benar dan deployment berjalan. Akan di-replace total di Epic 2.

- [ ] File: `/app/page.tsx` — Server Component
- [ ] Content minimal: nama perusahaan + kalimat singkat
- [ ] Set metadata: `title='CV Reka Cipta Indonesia | Distributor Garam SNI'`, `description='...'`
- [ ] Jangan spend waktu banyak di halaman ini — ini hanya placeholder untuk verifikasi layout global

### 4.6 — Frontend: Admin Panel

#### `E1-ENG-28` — Build Admin Login page (/app/admin/login/page.tsx)
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` &nbsp;·&nbsp; `Auth` &nbsp;·&nbsp; `Admin`

- [ ] File: `/app/admin/login/page.tsx` — `'use client'` component
- [ ] Form handling: `react-hook-form` + `zod` schema: `{ email: z.string().email(), password: z.string().min(6) }`
- [ ] On submit: call `supabase.auth.signInWithPassword()` dari browser client
- [ ] Success: `router.push('/admin/dashboard')`
- [ ] Error: set error state → tampil pesan generic di bawah form
- [ ] Loading state: button `disabled` + spinner icon saat awaiting response
- [ ] Layout halaman ini TERSENDIRI (`/app/admin/login/layout.tsx`) — tidak pakai root Navbar/Footer
- [ ] Verifikasi: halaman tidak accessible keyboard trap (bisa Tab keluar dari form)

#### `E1-ENG-29` — Build Admin Sidebar component
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` &nbsp;·&nbsp; `Admin`

- [ ] File: `/components/layout/AdminSidebar.tsx` — `'use client'` (butuh logout action)
- [ ] Logo perusahaan di atas sidebar
- [ ] Nav items: map dari `/constants/adminNavigation.ts`
- [ ] Active item: detect via `usePathname()` → apply background + text color accent
- [ ] Bottom area: email user aktif (pass sebagai prop dari layout) + tombol Logout
- [ ] Logout handler: `supabase.auth.signOut()` → `router.push('/admin/login')`
- [ ] Accessibility: `<nav aria-label='Admin navigation'>`, active item punya `aria-current='page'`
- [ ] Width: 240px, `shrink-0` agar tidak compress saat konten area kecil

#### `E1-ENG-30` — Build Admin Header component
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend` &nbsp;·&nbsp; `Admin`

- [ ] File: `/components/layout/AdminHeader.tsx` — Server Component
- [ ] Props: `{ title: string, breadcrumb?: Array<{ label: string, href: string }> }`
- [ ] Render `title` sebagai `<h1>` dengan ukuran konsisten
- [ ] Render breadcrumb jika `breadcrumb` prop ada
- [ ] Border-bottom untuk visual separation dari konten area
- [ ] Padding konsisten dengan konten area

#### `E1-ENG-31` — Wire Admin Layout (/app/admin/layout.tsx)
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` &nbsp;·&nbsp; `Auth` &nbsp;·&nbsp; `Admin`

Layout ini berlaku untuk SEMUA halaman admin KECUALI `/admin/login` yang punya layout sendiri.

- [ ] File: `/app/admin/layout.tsx` — Server Component
- [ ] Check session: `const { data: { user } } = await supabase.auth.getUser()`
- [ ] Jika tidak ada user → `redirect('/admin/login')`
- [ ] Render: `<div className='flex h-screen'><AdminSidebar user={user} /><main className='flex-1 overflow-y-auto'>{children}</main></div>`
- [ ] Pass `user.email` ke `AdminSidebar` sebagai prop
- [ ] Verifikasi: `/app/admin/login/` punya layout TERSENDIRI dan tidak di-wrap oleh layout ini (file harus di luar folder admin atau punya layout override)

#### `E1-ENG-32` — Build Admin Dashboard placeholder page
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` &nbsp;·&nbsp; `Admin`

- [ ] File: `/app/admin/dashboard/page.tsx` — Server Component
- [ ] Render `<AdminHeader title='Dashboard' />`
- [ ] Content: card dengan pesan 'Dashboard — fitur sedang dalam pengembangan'
- [ ] Tampilkan email user yang login: baca dari Supabase server client
- [ ] Ini akan di-replace di epic selanjutnya dengan metric cards dan activity feed

### 4.7 — Deployment

#### `E1-ENG-33` — Deploy Next.js ke Vercel (staging environment)
**Priority:** 🔴 HIGH &emsp; **Tags:** `Infra`

- [ ] Buat Vercel project → import GitHub repository `reka-cipta-web`
- [ ] Set Root Directory: `./` (atau sesuai struktur)
- [ ] Add semua environment variables di Vercel dashboard (dari `.env.local.example`)
- [ ] Trigger first deploy: push ke branch `dev`
- [ ] Verifikasi: build sukses, website bisa diakses di URL Vercel staging
- [ ] Note staging URL untuk digunakan di FastAPI CORS config

#### `E1-ENG-34` — Deploy FastAPI ke Railway (staging)
**Priority:** 🔴 HIGH &emsp; **Tags:** `Backend` &nbsp;·&nbsp; `Infra`

- [ ] Buat Railway project → New Service → GitHub Repo → pilih `/backend` folder
- [ ] Tambah start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] Atau tambah `Procfile`: `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] Set semua environment variables di Railway dashboard
- [ ] Test: `GET https://<railway-url>/health` → response `{ status: 'ok' }`
- [ ] Note Railway URL untuk di-set sebagai `NEXT_PUBLIC_API_URL` di Vercel

#### `E1-ENG-35` — Update FastAPI CORS dengan Vercel staging URL + final connection test
**Priority:** 🔴 HIGH &emsp; **Tags:** `Backend` &nbsp;·&nbsp; `Infra`

- [ ] Update `ALLOWED_ORIGINS` env var di Railway dengan Vercel staging URL
- [ ] Redeploy FastAPI di Railway
- [ ] Test cross-origin: dari Vercel staging URL → Railway API endpoint
- [ ] Verifikasi: tidak ada CORS error di browser console
- [ ] Update `NEXT_PUBLIC_API_URL` di Vercel dengan Railway URL
- [ ] End-to-end test: admin login dari staging URL → sukses

### 4.8 — Observability & Error Tracking ⭐ `BARU`

#### `E1-ENG-36` — Integrate Sentry ke Next.js (frontend error tracking) ⭐ `BARU`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` &nbsp;·&nbsp; `Observability`

**Penambahan v1.1.** Tanpa Sentry, silent React errors dan unhandled promise rejections di browser tidak akan terdeteksi.

- [ ] Install: `npm install @sentry/nextjs`
- [ ] Run wizard: `npx @sentry/wizard@latest -i nextjs` — ikuti semua langkah (generates config files)
- [ ] Verify files dibuat: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- [ ] Set `NEXT_PUBLIC_SENTRY_DSN` di `.env.local` dan di Vercel env vars
- [ ] Configure di Sentry dashboard: set environment tagging (`staging` / `production`)
- [ ] Test: tambahkan `throw new Error('Sentry test error')` sementara di satu komponen → verifikasi muncul di Sentry dashboard → hapus test error
- [ ] Pastikan Source Maps di-upload saat build (agar stacktrace terbaca — bukan minified code)

#### `E1-ENG-37` — Integrate Sentry ke FastAPI + setup structured logging ⭐ `BARU`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Backend` &nbsp;·&nbsp; `Observability`

**Penambahan v1.1.** Crash di Railway hanya terdeteksi jika ada yang aktif monitoring Railway logs. Sentry mengotomasi ini.

- [ ] Sudah install `sentry-sdk[fastapi]` di step E1-ENG-05
- [ ] Init Sentry di `main.py`: `sentry_sdk.init(dsn=settings.SENTRY_DSN, environment=settings.ENVIRONMENT, traces_sample_rate=0.2)`
- [ ] Add Sentry `FastApiIntegration()` ke list integrations
- [ ] Setup structured logging: gunakan Python `logging` dengan format JSON (`python-json-logger` library)
- [ ] Log level: WARNING dan ERROR untuk production, DEBUG untuk development
- [ ] Test: raise intentional `Exception` di endpoint → verifikasi muncul di Sentry dashboard → hapus test exception
- [ ] Set alert rule di Sentry: notifikasi (email/Slack) saat ada error baru atau error spike

### 4.9 — Security Hardening ⭐ `BARU`

#### `E1-ENG-38` — Configure HTTP Security Headers di Next.js (next.config.js) ⭐ `BARU`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` &nbsp;·&nbsp; `Security`

**Penambahan v1.1.** Security headers mencegah serangan XSS, clickjacking, dan MIME sniffing. Ini zero-cost protection yang harus ada dari hari pertama.

- [ ] Edit `next.config.js` → tambahkan `headers()` function
- [ ] Header: `X-Frame-Options: DENY` — mencegah clickjacking (website di-embed di iframe pihak ketiga)
- [ ] Header: `X-Content-Type-Options: nosniff` — mencegah MIME type sniffing
- [ ] Header: `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] Header: `X-XSS-Protection: 1; mode=block`
- [ ] Header: `Permissions-Policy: camera=(), microphone=(), geolocation=()` — disable API yang tidak dipakai
- [ ] Header: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` — enforce HTTPS
- [ ] Content-Security-Policy (CSP): mulai dengan header dasar, refine jika ada violation (gunakan `Content-Security-Policy-Report-Only` di staging dulu)
- [ ] Apply ke semua routes dengan `source: '/(.*)'`

> **Output:** Header yang terverifikasi via scan di securityheaders.com saat QA (E1-QA-20)

#### `E1-ENG-39` — Implement rate limiting pada FastAPI auth endpoints ⭐ `BARU`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Backend` &nbsp;·&nbsp; `Security`

**Penambahan v1.1.** Tanpa rate limiting, `POST /auth/login` bisa di-brute force tanpa hambatan apapun.

- [ ] Install: `pip install slowapi` (rate limiting middleware untuk FastAPI/Starlette)
- [ ] Setup `Limiter` di `main.py` dengan Redis atau in-memory backend (in-memory cukup untuk v1)
- [ ] Apply rate limit ke `POST /auth/login`: max **5 requests per IP per menit**
- [ ] Rate limit exceeded → return `HTTP 429 Too Many Requests` dengan response: `{ detail: 'Terlalu banyak percobaan login. Coba lagi dalam 1 menit.', code: 'RATE_LIMIT_EXCEEDED' }`
- [ ] Tambahkan response header: `Retry-After: 60` saat 429
- [ ] Verifikasi: rate limit tidak berlaku untuk endpoint non-auth (jangan block health check atau endpoint lain)
- [ ] Test: hit endpoint 6 kali dalam 1 menit → request ke-6 harus return 429

### 4.10 — API Contract & Shared Types ⭐ `BARU`

#### `E1-ENG-40` — Define API contract — TypeScript interfaces & Pydantic schema alignment ⭐ `BARU`
**Priority:** 🟡 MED &emsp; **Tags:** `Backend` &nbsp;·&nbsp; `Frontend` &nbsp;·&nbsp; `Infra`

**Penambahan v1.1.** Implementasi dari E1-SPIKE-09. Pastikan TypeScript types dan Pydantic schemas aligned sebelum UI work dimulai.

- [ ] Buat `/types/api.ts` di Next.js dengan TypeScript interfaces untuk semua API response Epic 1:
- [ ]   `interface AuthResponse { access_token: string; user: UserProfile }`
- [ ]   `interface UserProfile { id: string; email: string; created_at: string }`
- [ ]   `interface ApiError { detail: string; code: string }`
- [ ] Buat `/schemas/auth.py` di FastAPI dengan Pydantic models yang exact-match:
- [ ]   `class LoginRequest(BaseModel): email: EmailStr; password: str`
- [ ]   `class UserProfile(BaseModel): id: str; email: str; created_at: datetime`
- [ ]   `class AuthResponse(BaseModel): access_token: str; user: UserProfile`
- [ ] Cross-check setiap field: nama, tipe, nullable — pastikan tidak ada mismatch
- [ ] Dokumentasikan di `ARCHITECTURE.md`: setiap perubahan Pydantic schema → wajib update TypeScript types
- [ ] Evaluasi: apakah worth setup `openapi-typescript` untuk auto-sync? Dokumentasikan keputusan

---

## Layer 5 · QA & Observability Tasks

Semua test di bawah harus dijalankan di **staging environment** (bukan localhost) sebelum Epic 1 dinyatakan Done. Gunakan checklist ini sebagai template test run — centang dan tambahkan catatan per item.

---

### 5.1 — Functional Tests

#### `E1-QA-01` — Navbar: desktop rendering & semua links bekerja
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Frontend`

- [ ] Semua 7 menu item tampil di desktop (viewport 1280px)
- [ ] CTA 'Minta Penawaran' berwarna aksen biru dan menonjol
- [ ] Klik tiap nav item → navigasi ke route yang benar
- [ ] Active link styling terlihat di halaman yang sedang aktif
- [ ] Logo klik → navigasi ke `/`

#### `E1-QA-02` — Navbar: mobile hamburger behavior
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Frontend`

- [ ] Di viewport 375px: hamburger icon tampil, desktop nav items tersembunyi
- [ ] Tap hamburger → menu terbuka dengan semua nav items
- [ ] Icon berubah ☰ → ✕ saat menu open
- [ ] Tap nav item → navigasi terjadi + menu tertutup
- [ ] Tap di luar menu area → menu tertutup (jika diimplementasi)
- [ ] Tidak ada horizontal overflow di 375px viewport

#### `E1-QA-03` — Navbar: sticky scroll behavior
**Priority:** 🟡 MED &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Frontend`

- [ ] Scroll halaman ke bawah (di halaman dengan konten panjang) → navbar tetap di top viewport
- [ ] Shadow muncul saat sudah scroll (jika diimplementasi)
- [ ] Nav links masih bisa diklik saat sticky
- [ ] z-index: navbar tidak tertimpa elemen lain (dropdown, modal, dll.)

#### `E1-QA-04` — Footer: rendering desktop & mobile
**Priority:** 🟡 MED &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Frontend`

- [ ] Desktop (1280px): 3 kolom tampil side by side
- [ ] Mobile (375px): kolom stack vertikal, readable
- [ ] Info kontak akurat: alamat Jl. Bratang Gede III-I No. 16A, WA 082136096528, WA 087839031378, email rekaciptaindonesiaa@gmail.com
- [ ] Badge SNI dan NIB tampil
- [ ] Copyright text tampil dengan tahun yang benar

#### `E1-QA-05` — 404 Page: URL tidak dikenal
**Priority:** 🟡 MED &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Frontend`

- [ ] Buka `/url-yang-pasti-tidak-ada` → tampil halaman 404 custom (bukan default browser atau Vercel)
- [ ] Tombol 'Kembali ke Beranda' → navigasi ke `/`
- [ ] Navbar dan Footer tampil di halaman 404
- [ ] Verifikasi HTTP status code via DevTools Network tab: response harus `404`, bukan `200`

#### `E1-QA-06` — Admin Login: happy path
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Auth`

- [ ] Buka `/admin/login` → form tampil dengan benar (logo, email, password, button)
- [ ] Isi email + password admin yang valid → klik 'Masuk'
- [ ] Loading state tampil (button disabled saat menunggu)
- [ ] Setelah sukses → redirect ke `/admin/dashboard`
- [ ] Dashboard tampil dengan sidebar, header, dan placeholder content
- [ ] Email user tampil di bagian bawah sidebar

#### `E1-QA-07` — Admin Login: error state
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Auth`

- [ ] Isi password salah → klik Masuk → pesan error generic tampil (bukan detail spesifik tentang field mana yang salah)
- [ ] Isi email tidak terdaftar → klik Masuk → pesan error YANG SAMA
- [ ] Form tidak redirect saat error
- [ ] Email field masih terisi, password field di-clear
- [ ] Tombol kembali aktif — admin bisa mencoba lagi
- [ ] Pesan error: 'Kredensial tidak valid. Silakan coba lagi.' (atau pesan yang disepakati)

#### `E1-QA-08` — Admin Logout
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Auth`

- [ ] Login → klik tombol 'Logout' di sidebar
- [ ] Redirect ke `/admin/login`
- [ ] Setelah logout: tekan Back di browser → tidak kembali ke dashboard (redirect ke login)
- [ ] Buka `/admin/dashboard` di tab baru setelah logout → redirect ke login

#### `E1-QA-09` — Protected Routes: akses tanpa autentikasi
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Auth`

- [ ] Tanpa login, buka `/admin/dashboard` → redirect ke `/admin/login`
- [ ] Tanpa login, buka `/admin/settings` → redirect ke `/admin/login`
- [ ] Tanpa login, buka `/admin/leads` → redirect ke `/admin/login`
- [ ] Redirect terjadi server-side: tidak ada flash of protected content di browser sebelum redirect

#### `E1-QA-10` — Protected Routes: sudah login akses /admin/login
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Auth`

- [ ] Login sukses → buka tab baru → navigasi ke `/admin/login`
- [ ] Harus redirect ke `/admin/dashboard`
- [ ] Tidak tampil halaman login jika session masih aktif

#### `E1-QA-11` — Session: persistence setelah refresh & reopen browser
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Auth`

- [ ] Login → refresh halaman `/admin/dashboard` → tetap di dashboard
- [ ] Login → tutup browser → buka kembali `/admin/dashboard` → tetap login
- [ ] Tidak ada redirect loop atau unexpected behavior

### 5.2 — Responsiveness & Cross-Browser

#### `E1-QA-12` — Cross-browser compatibility test
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA`

- [ ] **Chrome latest**: Navbar, Footer, Admin Login, Admin Layout — semua render benar
- [ ] **Firefox latest**: layout konsisten, tidak ada CSS quirks
- [ ] **Safari latest**: perhatikan `position: sticky`, flexbox, dan cookie behavior
- [ ] **Edge latest**: render konsisten dengan Chrome
- [ ] Tools yang bisa digunakan: BrowserStack, Sauce Labs, atau device langsung

#### `E1-QA-13` — Responsive breakpoint test
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA`

- [ ] **375px** (iPhone SE): mobile layout, hamburger menu, tidak ada horizontal overflow
- [ ] **390px** (iPhone 14 Pro): mobile layout
- [ ] **768px** (iPad portrait): transisi mobile → tablet layout
- [ ] **1024px** (iPad landscape / small laptop): desktop navbar aktif
- [ ] **1280px** (standard laptop): full desktop layout
- [ ] **1440px** (large monitor): tidak ada stretching atau overflow aneh

### 5.3 — Performance, Security & Infrastructure

#### `E1-QA-14` — Lighthouse audit di staging
**Priority:** 🟡 MED &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Infra`

- [ ] Jalankan Lighthouse di staging URL: Chrome DevTools → Lighthouse → Desktop + Mobile
- [ ] Performance score **≥ 85**
- [ ] Accessibility score **≥ 90**
- [ ] SEO score **≥ 90**
- [ ] Best Practices score **≥ 90**
- [ ] Screenshot hasil + simpan sebagai baseline untuk perbandingan di epic berikutnya

#### `E1-QA-15` — Verifikasi Supabase connection & RLS di staging
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Database`

- [ ] Admin login dari staging URL berhasil → membuktikan Supabase Auth terhubung
- [ ] Logout berhasil → session dihapus
- [ ] Test RLS: kirim REST request langsung ke Supabase tanpa `Authorization` header → harus return 401 atau empty rows
- [ ] Verifikasi env vars Supabase di Vercel menggunakan project URL staging (bukan localhost)

#### `E1-QA-16` — FastAPI health check, CORS & Sentry verification
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Backend`

- [ ] `GET https://<railway-url>/health` → response 200 `{ status: 'ok' }`
- [ ] Response headers mengandung `Access-Control-Allow-Origin` dengan nilai Vercel staging URL
- [ ] Test CORS: fetch dari Vercel staging URL ke Railway API → tidak ada CORS error di browser console
- [ ] Trigger test Sentry error di FastAPI → verifikasi muncul di Sentry dashboard dalam 1-2 menit

#### `E1-QA-17` — Verify environment variables di Vercel & Railway
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Infra`

- [ ] Vercel: semua env vars dari `.env.local.example` sudah diset di dashboard
- [ ] Railway: semua env vars untuk FastAPI sudah diset
- [ ] Build tidak gagal karena missing env vars
- [ ] Runtime tidak crash karena missing env vars (cek Railway logs setelah deploy)
- [ ] `NEXT_PUBLIC_*` vars: pastikan hanya vars yang aman di-expose (tidak ada service key atau secret)

#### `E1-QA-18` — Verify Sentry error tracking aktif (frontend + backend) ⭐ `BARU`
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Observability`

**Penambahan v1.1.**

- [ ] Buka Sentry dashboard → verifikasi kedua project (`reka-cipta-web` dan `reka-cipta-api`) terhubung
- [ ] Trigger test error di Next.js (sementara): lempar `throw new Error('QA test')` di satu komponen → verifikasi muncul di Sentry → hapus code
- [ ] Trigger test error di FastAPI: hit endpoint dengan intentional exception → verifikasi muncul di Sentry → hapus code
- [ ] Verifikasi: Sentry menampilkan stacktrace yang readable (bukan minified) untuk error Next.js
- [ ] Verifikasi: alert rules sudah dikonfigurasi — kirim test alert untuk konfirmasi email/notifikasi diterima

#### `E1-QA-19` — Security headers verification via external scan ⭐ `BARU`
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Security`

**Penambahan v1.1.**

- [ ] Buka **securityheaders.com** → masukkan staging URL → run scan
- [ ] Target minimum grade: **B atau lebih tinggi**
- [ ] Verifikasi header berikut ada: `X-Frame-Options` · `X-Content-Type-Options` · `Referrer-Policy` · `Strict-Transport-Security`
- [ ] Jika ada header yang missing atau misconfigured → fix di `next.config.js` → re-scan
- [ ] Screenshot hasil scan + simpan sebagai bukti audit
- [ ] Catatan: Grade A+ memerlukan CSP yang ketat — ini bisa jadi v1.1 improvement, tidak harus A+ untuk launch

#### `E1-QA-20` — Rate limiting test pada /admin/login ⭐ `BARU`
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Security`

**Penambahan v1.1.**

- [ ] Kirim 5 request login dengan credentials salah dalam 1 menit → semua harus return 401
- [ ] Kirim request ke-6 dalam window yang sama → harus return **429 Too Many Requests**
- [ ] Response 429 mengandung: pesan error yang jelas dan `Retry-After` header
- [ ] Tunggu 1 menit → kirim request lagi → harus bisa berjalan lagi (429 hanya sementara)
- [ ] Verifikasi: rate limit tidak memblokir `GET /health` endpoint (bukan auth endpoint)
- [ ] Tools: bisa gunakan Postman, curl loop, atau script sederhana untuk test ini

### 5.4 — Manual Accessibility (a11y) Tests ⭐ `BARU`

**Penambahan v1.1.** Lighthouse menangkap a11y issues secara otomatis (contrast, alt text, labels), tetapi tidak bisa test interaksi keyboard dan screen reader. Test manual ini wajib untuk komponen interaktif.

#### `E1-QA-21` — Manual keyboard navigation test ⭐ `BARU`
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Accessibility`

**Penambahan v1.1.** Test di semua komponen interaktif Epic 1 menggunakan hanya keyboard (tidak boleh pakai mouse).

- [ ] **Navbar (desktop)**: Tab → fokus pindah ke setiap nav item secara berurutan → Enter/Space untuk navigate → fokus tidak 'terperangkap'
- [ ] **Hamburger menu (mobile)**: Tab → fokus ke hamburger button → Enter untuk buka menu → Tab → fokus ke item pertama dalam menu → Escape untuk tutup menu
- [ ] **Admin Login form**: Tab → fokus Email → Tab → fokus Password → Tab → fokus button 'Masuk' → Enter untuk submit → fokus pindah ke pesan error jika ada
- [ ] **Admin Sidebar**: Tab bisa mencapai semua nav items dan tombol Logout → Enter untuk navigate
- [ ] **Focus ring**: setiap element yang difocus menampilkan focus ring yang visible (tidak dihilangkan via `outline: none` tanpa alternatif)
- [ ] Tidak ada keyboard trap: pengguna bisa Tab keluar dari setiap komponen tanpa terjebak

#### `E1-QA-22` — Screen reader test (NVDA/VoiceOver) ⭐ `BARU`
**Priority:** 🟡 MED &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Accessibility`

**Penambahan v1.1.** Test dengan screen reader untuk memastikan pengguna dengan visual impairment bisa menggunakan website.

- [ ] Tools: **NVDA** (Windows, gratis) atau **VoiceOver** (macOS, built-in, aktifkan dengan Cmd+F5)
- [ ] **Navbar**: screen reader mengumumkan nama setiap nav link dengan benar · `<nav>` diumumkan sebagai landmark · hamburger button diumumkan sebagai 'Buka menu' (sesuai `aria-label`)
- [ ] **Footer**: screen reader bisa membaca semua info kontak dengan benar · `<footer>` diumumkan sebagai landmark
- [ ] **Admin Login form**: label 'Email' dan 'Password' diumumkan saat fokus ke field masing-masing · error message diumumkan saat muncul (`aria-live` region atau focus pindah ke error)
- [ ] **Admin Sidebar**: active nav item diumumkan dengan 'current page' (via `aria-current='page'`) · tombol Logout diumumkan dengan benar
- [ ] **Heading structure**: tidak ada heading yang skip level (H1 → H2 → H3, tidak langsung H1 → H3)

### 5.5 — Definition of Done — Final Verification

#### `E1-QA-23` — DoD Final Verification Checklist
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` &nbsp;·&nbsp; `Demo`

Semua item di bawah harus ✅ sebelum Epic 1 dinyatakan selesai dan demo ke klien dilakukan.

- [ ] ☑ Website dapat diakses di URL staging Vercel — siap untuk demo ke klien
- [ ] ☑ Navbar tampil benar di mobile (375px) DAN desktop (1280px)
- [ ] ☑ Footer tampil benar di mobile DAN desktop
- [ ] ☑ Halaman 404 berfungsi untuk URL tidak dikenal (HTTP status benar-benar 404)
- [ ] ☑ `/admin/login` dapat diakses dan form tampil
- [ ] ☑ Login dengan akun admin berhasil → redirect ke `/admin/dashboard`
- [ ] ☑ Admin dashboard menampilkan sidebar, header, dan placeholder content
- [ ] ☑ Logout berfungsi → redirect ke `/admin/login` → tidak bisa back ke dashboard
- [ ] ☑ Semua `/admin/*` routes protected — redirect ke login tanpa session
- [ ] ☑ Koneksi Supabase aktif dan terverifikasi (login bekerja di staging)
- [ ] ☑ FastAPI health check endpoint aktif di Railway
- [ ] ☑ Database migrations teraplikasi via Supabase CLI (bukan manual dashboard)
- [ ] ☑ Sentry aktif di frontend DAN backend — test error berhasil tertangkap
- [ ] ☑ HTTP security headers terpasang — score B atau lebih di securityheaders.com
- [ ] ☑ Rate limiting aktif di `/auth/login` — 429 setelah 5 percobaan gagal dalam 1 menit
- [ ] ☑ Lighthouse score: Performance ≥85, Accessibility ≥90, SEO ≥90 di staging
- [ ] ☑ Keyboard navigation berfungsi untuk semua komponen interaktif
- [ ] ☑ Tidak ada console error kritis di browser
- [ ] ☑ Semua kode di-commit ke GitHub — tidak ada file `.env` yang ter-commit

---

---

*Epic 1 Task Breakdown v1.1 · CV Reka Cipta Indonesia · Updated: Penambahan database migration (Supabase CLI), observability (Sentry), security hardening (HTTP headers + rate limiting), API contract alignment, dan manual accessibility testing.*