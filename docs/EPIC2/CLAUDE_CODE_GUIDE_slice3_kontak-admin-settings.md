# Claude Code Execution Guide — Epic 2 Slice 3
## Halaman Kontak (`/kontak`) + Admin Settings (`/admin/settings`)

> **Versi:** 1.0 · Juli 2026
> **Task Breakdown Reference:** `epic2_task_breakdown_slice3_kontak-admin-settings.md`
> **Target Executor:** Claude Code (agentic coding session)
> **Estimasi Waktu Total:** 6-9 jam kerja developer (dengan pauses di STOP gates)

---

## Operating Rules untuk Claude Code

Baca dulu semua rules ini sebelum mulai. Rules ini SUPERSEDE naluri default Anda.

### 1. Kerjakan Phase Sequentially

- Kerjakan phase satu per satu dari 1 ke 14. Jangan lompat.
- Setiap phase punya deliverable jelas. Jangan lanjut phase berikutnya sampai deliverable phase sekarang selesai.
- Setiap phase punya list "Kerjakan" (task) dan list "Jangan" (constraint). Baca keduanya.

### 2. STOP di Setiap STOP Gate

- Ada 4 STOP gate di guide ini. Ditandai dengan `🛑 STOP GATE {n}`.
- Saat mencapai STOP gate: berhenti kerja, ringkas apa yang sudah dilakukan di phase-phase sebelumnya, tunggu konfirmasi user sebelum lanjut.
- STOP gate ada karena butuh tindakan manual dari user (deploy, test manual, config platform, demo).
- **JANGAN skip STOP gate meskipun Anda yakin bisa lanjut.** Ini bukan sekadar formalitas — user perlu waktu untuk verify.

### 3. Constraint Hard yang Tidak Boleh Dilanggar

Ini konteks yang sudah teruji sakit di project ini. Melanggar = bug production.

**Supabase / Database:**
- `supabase db push` **BROKEN** di network developer ini. Semua DB migration wajib via `.sql` file → dijalankan manual via Supabase Dashboard SQL Editor. **Slice 3 tidak butuh migration baru** (reuse `company_settings` dari Slice 1) — jadi ini tidak relevan, tapi jangan pernah suggest `supabase db push`.

**Next.js Rendering:**
- `createClient()` dari `lib/supabase/server.ts` memanggil `await cookies()` → bikin route jadi Dynamic (`ƒ`). Halaman Kontak WAJIB Static (`○`), jadi WAJIB pakai `lib/supabase/public.ts` (stateless client, `persistSession: false`).
- Verifikasi Static output: setelah setiap phase yang menyentuh `app/(public)/kontak/`, jalankan `npm run build` dan cek output. Jika `/kontak` muncul sebagai `ƒ`, ada yang salah.

**Base UI (bukan Radix UI):**
- Project pakai `@base-ui/react`. Pattern `<Button asChild><Link>` adalah idiom Radix dan **TIDAK JALAN** di sini.
- Pattern yang benar untuk button-styled link: `<Link className={cn(buttonVariants({...}))}>...</Link>`.
- **JANGAN** `import` dari `@radix-ui/*` di file mana pun.

**globals.css:**
- File `globals.css` adalah **FROZEN**. Jangan modif kecuali ada instruksi eksplisit di task breakdown yang mereferensikan Design System v2.0 §-nya.
- Slice 3 TIDAK perlu modif `globals.css`.

**Next.js 15 params:**
- Route handler dan page component pakai `params` async: `{ params }: { params: Promise<{ ... }> }` → `const { key } = await params`.
- Slice 3 tidak punya dynamic route baru, tapi ingat pattern ini kalau membuat.

**lib/env.ts:**
- Akses env var pakai `process.env.NEXT_PUBLIC_X` EXPLICITLY dituliskan. Jangan pakai dynamic access seperti `process.env[key]` — bundler Next.js tidak inline itu di browser.

**React 19 `inert`:**
- Attribute `inert` sudah proper boolean di React 19. Pakai `inert={condition}` tanpa `@ts-expect-error`.

**Route group admin:**
- `(auth)/admin/login/` dan `admin/` adalah route group TERPISAH. Jangan gabungkan. Slice 3 hanya nambah `admin/settings/` — di dalam route group `admin/`, aman.

### 4. Ketika Ragu, Prefer Konservatif

- Kalau ada 2 approach: pilih yang lebih sedikit menyentuh file existing.
- Kalau ada API baru dari library yang Anda ragu compat: cek `package.json` dulu untuk versi terinstall, jangan asumsi.
- Kalau task breakdown ambigu: laporkan ke user, jangan improvise.

### 5. Late Commits Diperbolehkan

- Boleh commit file dari phase sebelumnya kalau belum ter-commit. Ini sering terjadi saat kerja iteratif.
- Tapi setelah STOP gate, semua file yang menyangkut phase-phase sebelum gate itu **HARUS** sudah ter-commit.

### 6. Verifikasi Setelah Setiap Phase

- Setiap phase ada checklist "Verifikasi" di akhir. Kerjakan semua sebelum lanjut.
- Jika ada verifikasi yang fail: fix dulu, jangan diskip. Kalau tidak tahu cara fix, lapor ke user.

### 7. Bahasa Komunikasi

- User berkomunikasi dalam Bahasa Indonesia. Balas dalam Bahasa Indonesia.
- Istilah teknis (component, endpoint, revalidate, dst) OK dalam English — pakai istilah standar industri.

---

## Prasyarat Sebelum Mulai

Verifikasi state project sebelum phase 1:

- [ ] Slice 1 (Beranda) DoD ✅ — halaman `/` tampil di staging, `company_settings` tabel exist dengan 10 rows, `backend/routers/settings.py` punya `GET /`, `types/api.ts` punya `CompanySettingItem` dkk
- [ ] Slice 2 (Tentang Kami) DoD ✅ — halaman `/tentang-kami` tampil, `InnerPageHero` component sudah ada di `components/sections/InnerPageHero.tsx`
- [ ] `lib/wa-link.ts` sudah ada (Epic 1)
- [ ] `lib/api.ts` sudah ada (Epic 1)
- [ ] `lib/supabase/public.ts` sudah ada (Slice 1)
- [ ] `constants/admin-navigation.ts` sudah ada dengan struktur `ADMIN_NAV` (Epic 1)
- [ ] Branch aktif: `dev`. Feature branch untuk slice ini: `feature/E2-S3-kontak-admin-settings`
- [ ] Backend Railway staging up: `curl https://{railway-url}/health` return 200

Jika salah satu prasyarat tidak terpenuhi, **berhenti dan lapor ke user**.

---

## PHASE 1: Backend — Pydantic Schema untuk Contact Form

**Reference task:** `E2-S3-BE-01`

### Kerjakan

- [ ] Buat file baru `backend/schemas/contact.py` dengan class `ContactRequest` dan `ContactResponse` sesuai spek di task breakdown
- [ ] Update `backend/schemas/__init__.py` untuk expose 2 class baru tersebut
- [ ] Verifikasi `pydantic[email]` sudah di `requirements.txt` — kalau belum, tambahkan (versi apapun yang latest stabil). Install: `pip install "pydantic[email]"`

### Jangan

- Jangan ubah schema settings existing (`CompanySettingItem` dll) — mereka sudah stabil dari Slice 1
- Jangan pakai `str` untuk email — pakai `EmailStr` (butuh `pydantic[email]`)
- Jangan tambah field yang tidak ada di spec (misalnya `subject`, `department`, dll) — kita fokus MVP

### Verifikasi

- [ ] Import test lokal: dari folder `backend/`, jalankan `python -c "from schemas import ContactRequest, ContactResponse; print(ContactRequest.model_json_schema())"` → tidak error, print JSON schema
- [ ] `pip freeze | grep pydantic` menunjukkan `pydantic[email]` extras terinstall (via `pydantic` + `email-validator` package)

---

## PHASE 2: Backend — Resend Email Service Wrapper

**Reference task:** `E2-S3-BE-02`

### Kerjakan

- [ ] Tambah `resend>=0.7.0` ke `backend/requirements.txt`
- [ ] `pip install resend`
- [ ] Buat file baru `backend/services/email_service.py` dengan class `EmailService` dan method `send_contact_notification()` sesuai spek task breakdown
- [ ] Buat/update `backend/services/__init__.py` untuk expose `EmailService`
- [ ] Verifikasi `settings.RESEND_API_KEY` sudah didefinisi di `core/config.py` (dari pattern pydantic-settings existing) — kalau belum ada field ini, tambahkan

### Jangan

- Jangan hardcode API key di file — semua dari `settings.RESEND_API_KEY`
- Jangan pakai `smtplib` atau library email lain — pakai `resend` SDK saja untuk konsistensi
- Jangan buat email template rumit — HTML sederhana cukup. Kita bukan sedang bikin marketing email.
- Jangan lupa `reply_to`: harus email pengirim form (`payload.email`), supaya admin bisa balas langsung dari inbox

### Verifikasi

- [ ] Import test: `python -c "from services import EmailService; print(EmailService.send_contact_notification.__doc__)"` → print docstring
- [ ] Startup FastAPI lokal: `uvicorn main:app --reload` → tidak ada error, log "Application startup complete"

---

## PHASE 3: Backend — POST /contact/send Endpoint

**Reference task:** `E2-S3-BE-03`

### Kerjakan

- [ ] Verifikasi `slowapi` sudah terinstall (dari Epic 1 untuk rate limit login). Kalau belum: `pip install slowapi` dan tambah ke `requirements.txt`
- [ ] Buat `backend/routers/contact.py` sesuai spek task breakdown:
  - Router prefix `/contact`
  - Endpoint `POST /send` dengan rate limit `5/minute` per IP
  - Fetch email tujuan dari `company_settings.email` via Supabase
  - Panggil `EmailService.send_contact_notification()`
  - Handle error 500 dengan pesan generik (jangan expose internal error ke response)
- [ ] Register router di `backend/main.py`: `app.include_router(contact_router, prefix="/api/v1")`
- [ ] Pastikan `slowapi` middleware sudah ter-setup di `main.py` (kalau belum, tambah — refer ke Epic 1 setup)

### Jangan

- Jangan bikin endpoint memerlukan auth — form kontak untuk publik
- Jangan trust IP dari `request.client.host` langsung di production di belakang Railway proxy — pakai `get_remote_address` dari `slowapi.util` yang sudah handle `X-Forwarded-For`
- Jangan pakai `EmailStr` di response body — pakai plain string
- Jangan return object `resend.Emails.send()` mentah ke client — response harus sesuai schema `ContactResponse`
- Jangan hardcode email tujuan (`rekaciptaindonesiaa@gmail.com`) di kode — WAJIB baca dari `company_settings`. Alasan: kalau admin update di CRM, notification harus mengikuti.

### Verifikasi

- [ ] Swagger UI (`http://localhost:8000/docs`): endpoint `POST /api/v1/contact/send` muncul dengan schema request/response yang benar, tanpa lock icon
- [ ] Curl test 200: `curl -X POST http://localhost:8000/api/v1/contact/send -H "Content-Type: application/json" -d '{"name":"Test","email":"test@example.com","message":"Halo, test."}'` → return `{success: true, ...}` (asumsi RESEND_API_KEY sudah ter-set lokal atau gunakan Resend test key)
- [ ] Curl test 422: kirim `{"name":"a"}` → return 422 dengan detail field validation
- [ ] Curl test 429: loop 6× curl → request ke-6 return 429

---

## PHASE 4: Backend — PATCH /settings Endpoint

**Reference task:** `E2-S3-BE-04`

### Kerjakan

- [ ] Update `backend/routers/settings.py` — TAMBAHKAN handler `PATCH /` (jangan hapus `GET /` yang sudah ada dari Slice 1)
- [ ] Import `Depends`, `HTTPException`, `get_current_user` dari `dependencies.auth`
- [ ] Implement whitelist enforcement: reject dengan 422 kalau ada key di payload yang tidak masuk `EDITABLE_KEYS` set (6 key: whatsapp_1, whatsapp_2, email, address, gmaps_embed_url, wa_default_message)
- [ ] Loop update per row (Supabase Python SDK tidak native support batch UPDATE dengan multiple WHERE) — dengan proper error handling
- [ ] Return `CompanySettingsResponse` dengan SEMUA settings terbaru (untuk memudahkan frontend refresh state)
- [ ] Log update dengan `logger.info("settings_updated", extra={"user_id": ..., "keys": ...})` untuk audit trail

### Jangan

- Jangan lupa dependency `Depends(get_current_user)` — endpoint HARUS auth-protected
- Jangan izinkan key non-editable (partner_count, cities_served, dst) untuk di-update dari endpoint ini — meski di masa depan, ini akan di-manage dari CRM Epic 4
- Jangan sanitize/transform value di backend — kirim apa adanya ke DB. Validasi format ada di frontend dan Pydantic schema (kalau perlu tambah field-specific validation, itu di Pydantic).
- Jangan pakai upsert — pakai UPDATE (row seharusnya sudah exist dari seed Slice 1)
- Jangan expose stack trace di response error

### Verifikasi

- [ ] Swagger UI: `PATCH /api/v1/settings/` muncul DENGAN lock icon (auth required)
- [ ] Test 401 (tanpa token): `curl -X PATCH http://localhost:8000/api/v1/settings/ -H "Content-Type: application/json" -d '{"updates":[{"key":"email","value":"a@b.c"}]}'` → 401
- [ ] Test 200: login dulu untuk dapat JWT, lalu `curl -X PATCH ... -H "Authorization: Bearer {token}" -d '{"updates":[{"key":"whatsapp_1","value":"081234567890"}]}'` → 200 dengan response `{items: [...]}` yang berisi 10 items terbaru
- [ ] Test 422 (whitelist violation): kirim `{"updates":[{"key":"partner_count","value":"999"}]}` dengan Bearer token → 422 dengan pesan yang menyebut key tidak boleh diubah
- [ ] Verifikasi DB: buka Supabase Dashboard → table `company_settings` → row `whatsapp_1` punya value baru `081234567890` dan `updated_at` terbaru

---

## 🛑 STOP GATE 1 — Env Var + Backend Deploy Verification

**User harus melakukan tindakan manual sebelum lanjut.**

### Yang harus di-verify oleh user:

1. **RESEND_API_KEY di Railway (staging + production):**
   - Buka Railway Dashboard → project backend RCI → Variables tab
   - Verifikasi `RESEND_API_KEY` ter-set untuk kedua environment
   - Kalau belum: buat API key baru di Resend dashboard, paste ke Railway, redeploy
2. **Domain verification untuk `from` email:**
   - Cek Resend dashboard → Domains tab → apakah `rekaciptaindonesia.com` sudah verified?
   - Kalau BELUM verified: sementara ubah `DEFAULT_FROM` di `email_service.py` ke `"CV RCI <onboarding@resend.dev>"` — Resend default testing domain. Update ke domain final setelah verify.
3. **Deploy backend ke Railway staging:**
   - Push branch feature ke `dev` (atau merge PR)
   - Verify di Railway logs: startup bersih, tidak ada `ValidationError` untuk env vars
   - `curl https://{railway-staging-url}/health` → return 200
   - `curl https://{railway-staging-url}/docs` → Swagger UI muncul dengan endpoint contact + settings PATCH
4. **Smoke test end-to-end via curl ke staging:**
   - Test POST /contact/send dengan data valid → verifikasi email masuk ke inbox admin
   - Test PATCH /settings/ dengan JWT admin (login via login endpoint dulu) → verifikasi row di Supabase Dashboard

### Setelah user konfirmasi:

- ✅ RESEND_API_KEY set + backend deploy sukses + smoke test lulus → lanjut Phase 5

**JANGAN lanjut Phase 5 tanpa konfirmasi user.**

---

## PHASE 5: TypeScript API Contract Sync

**Reference task:** `E2-S3-CONT-01`

### Kerjakan

- [ ] Update `types/api.ts` — tambah interface `ContactRequest` dan `ContactResponse` sesuai spek task breakdown (di bawah interface existing Slice 1)
- [ ] Update `ARCHITECTURE.md §16.1` — tambah 2 baris ke tabel mapping Pydantic ↔ TypeScript

### Jangan

- Jangan ubah interface existing (`CompanySettingItem`, `CompanySettingsResponse`, dll)
- Jangan pakai `type` alias — pakai `interface` untuk konsistensi dengan existing pattern
- Jangan lupa `phone` field OPTIONAL: `phone?: string`

### Verifikasi

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `git diff types/api.ts` menunjukkan hanya penambahan 2 interface baru, tidak ada perubahan interface existing

---

## PHASE 6: Frontend Public — Halaman /kontak Skeleton + Metadata

**Reference tasks:** `E2-S3-FE-01`, `E2-S3-UX-05`, `E2-S3-UX-06`

### Kerjakan

- [ ] Buat folder `app/(public)/kontak/`
- [ ] Buat `app/(public)/kontak/page.tsx` — Server Component dengan:
  - `export const revalidate = 3600`
  - `export const metadata: Metadata = {...}` sesuai spek `E2-S3-UX-05`
  - Fetch `company_settings` via `lib/supabase/public.ts` (JANGAN pakai server.ts)
  - Transform hasil ke `settingsMap: Record<string, string>`
  - Render placeholder dulu: `<InnerPageHero {...} /><main><h2>Kontak - WIP</h2></main>` — komponen actual dibangun di phase berikutnya
- [ ] Buat `app/(public)/kontak/loading.tsx` sesuai spek
- [ ] Update `app/sitemap.ts` — tambah entry `/kontak` dengan `priority: 0.9, changeFrequency: 'monthly'`
- [ ] Inject JSON-LD `LocalBusiness` schema di `page.tsx` via `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />` — pass value dari `settingsMap`

### Jangan

- Jangan pakai `createClient()` dari `lib/supabase/server.ts` — akan bikin route Dynamic (`ƒ`). WAJIB `lib/supabase/public.ts`
- Jangan hardcode data kontak — semua dari `company_settings`
- Jangan lupa fallback untuk `settingsMap[key]` yang mungkin undefined (data corruption safety): pakai `?? ''` default
- Jangan render iframe atau external script di `<head>` — semua di body untuk Content Security Policy

### Verifikasi

- [ ] `npm run build` → output menunjukkan `/kontak` sebagai `○ Static` (bukan `ƒ Dynamic`)
- [ ] `npm run dev` → `http://localhost:3000/kontak` render dengan `InnerPageHero` + placeholder heading, tidak error
- [ ] View Page Source → JSON-LD `<script type="application/ld+json">` ada di HTML
- [ ] `/sitemap.xml` di dev server (setelah rebuild) menyertakan `/kontak`

---

## PHASE 7: Frontend Public — ContactInfo + WhatsAppButtons Components

**Reference tasks:** `E2-S3-FE-02`, `E2-S3-FE-03`

### Kerjakan

- [ ] Buat `components/sections/ContactInfo.tsx` — Server Component, props `{ address: string; email: string }`, render 3 baris info dengan icon Lucide, bungkus `<RevealWrapper variant="reveal-left">`
- [ ] Buat `components/sections/WhatsAppButtons.tsx` — Server Component, props `{ whatsapp1, whatsapp2?, defaultMessage }`, render 2 tombol WA
- [ ] Buat helper `formatPhoneDisplay(nomor: string)` di `lib/utils.ts` (atau file baru `lib/format.ts`) yang transform `082136096528` → `+62 821-3609-6528`
- [ ] Update `app/(public)/kontak/page.tsx` — replace placeholder dengan render `<ContactInfo />` + `<WhatsAppButtons />` dalam grid 2 kolom desktop

### Jangan

- **JANGAN PAKAI `<Button asChild><Link>` pattern** — ini idiom Radix, project pakai Base UI. Gunakan `<Link className={cn(buttonVariants({size: 'lg'}), "bg-green-500 hover:bg-green-600 text-white gap-2")}>` — copy exact ke file
- Jangan pakai `<button onClick={window.location.href = ...}>` — ini bikin Client Component tidak perlu. Selalu `<Link>` untuk navigation
- Jangan lupa `target="_blank"` DAN `rel="noopener noreferrer"` untuk external link (WA)
- Jangan lupa handle `whatsapp2` optional — kalau kosong/undefined, sembunyikan tombol kedua tanpa error
- Jangan pakai emoji WhatsApp di button label — pakai icon `MessageCircle` dari Lucide

### Verifikasi

- [ ] Render halaman: info + WA buttons tampil sesuai wireframe
- [ ] Klik tombol WA → tab baru terbuka ke `https://wa.me/6282136096528?text=Halo...`
- [ ] Klik email link → membuka mail app dengan `To:` terisi
- [ ] Test breakpoint 375px: WA buttons stack vertikal, tap target ≥ 44px
- [ ] View source dari WA button → verifikasi ini `<a href="https://wa.me/...">`, bukan `<button>` atau ada `data-radix-*` attribute (kalau ada `data-radix-*`, berarti masih pakai pattern lama)
- [ ] TypeScript check clean: `npx tsc --noEmit`

---

## PHASE 8: Frontend Public — Contact Form (`'use client'`) + shadcn Sonner Install

**Reference task:** `E2-S3-FE-04`

### Kerjakan

- [ ] Verifikasi shadcn components:
  - `Form`, `Input`, `Label`, `Button` sudah ada dari Epic 1
  - `Textarea` — cek `components/ui/textarea.tsx`. Kalau belum ada: `npx shadcn@latest add textarea`
  - `Sonner` (toast) — cek `components/ui/sonner.tsx`. Kalau belum ada: `npx shadcn@latest add sonner`
- [ ] Kalau install Sonner baru: mount `<Toaster />` di `app/layout.tsx` (root layout), position `bottom-right` atau sesuai preferensi
- [ ] Verifikasi `react-hook-form`, `@hookform/resolvers`, `zod` sudah terinstall (biasanya dari Epic 1 login form). Kalau belum: `npm install react-hook-form @hookform/resolvers zod`
- [ ] Buat `components/forms/ContactForm.tsx` — `'use client'`, implementasi lengkap sesuai spek task breakdown:
  - Zod schema dengan 4 field
  - `useForm` dengan default values
  - `onSubmit` handler yang panggil `apiFetch<ContactResponse>('/contact/send', { method: 'POST', body: JSON.stringify(values) })` (auth default false)
  - Toast success/error/warning handling
  - Character counter di message field
  - Submit button dengan loading state
- [ ] Update `app/(public)/kontak/page.tsx` — tambah `<ContactForm />` di grid kolom kanan

### Jangan

- Jangan pakai `<form action="...">` HTML action — pakai `form.handleSubmit(onSubmit)` dari react-hook-form
- Jangan pakai `onSubmit` di `<form>` tag di React 19 kalau ini bukan Client Component — HTML form akan submit ke same URL kalau tidak di-`preventDefault()`. Untuk aman, pakai `<Form>` dari shadcn yang sudah wrap semua ini
- Jangan lupa `noValidate` di `<form>` untuk override browser native validation (Zod handle sendiri)
- Jangan pakai `alert()` atau `window.confirm()` — pakai toast/dialog dari shadcn
- Jangan hardcode toast message — atau kalau hardcode, minimal konsisten dengan tone Bahasa Indonesia yang formal/professional
- Jangan pass `auth: true` — endpoint ini publik
- Jangan lupa timeout di `apiFetch` — default 10s cukup untuk email send

### Verifikasi

- [ ] Fill form dengan data valid → submit → verifikasi:
  - Button jadi disabled + text loading
  - Setelah request selesai, toast success muncul
  - Form ter-reset ke default (kosong)
  - Email masuk ke inbox admin (`rekaciptaindonesiaa@gmail.com` atau apa pun yang di `company_settings.email`)
- [ ] Fill dengan `email: "notanemail"` → error inline muncul, form tidak submit
- [ ] Fill dengan `message: "halo"` (< 10 char) → error inline muncul
- [ ] Submit 6× cepat → request ke-6 dapat toast warning tentang rate limit
- [ ] Character counter update secara realtime saat typing di message field

---

## PHASE 9: Frontend Public — Google Maps Embed + Assembly

**Reference tasks:** `E2-S3-FE-05`, `E2-S3-FE-06`

### Kerjakan

- [ ] Buat `components/sections/GMapsEmbed.tsx` — Server Component, props `{ embedUrl: string; address: string }`
- [ ] Implement validation: `embedUrl.startsWith('https://www.google.com/maps/embed')` → render iframe. Else → render fallback dengan tombol "Buka di Google Maps"
- [ ] Update `app/(public)/kontak/page.tsx` — tambah `<GMapsEmbed embedUrl={settingsMap.gmaps_embed_url} address={settingsMap.address} />` di bawah section utama
- [ ] Bungkus dengan `<RevealWrapper variant="reveal-up">`
- [ ] Verifikasi hierarchy heading final di halaman:
  - `<h1>` "Hubungi Kami" (di `InnerPageHero`)
  - `<h2>` "Informasi Kontak" (di `ContactInfo`)
  - `<h3>` "Chat langsung via WhatsApp" (di `WhatsAppButtons`)
  - `<h2>` "Kirim Pesan" (di `ContactForm`)
  - `<h2>` "Lokasi Kantor Kami" (di `GMapsEmbed`)
- [ ] Verifikasi tepat 1 `<h1>` di seluruh halaman

### Jangan

- Jangan render iframe tanpa validasi — kalau `gmaps_embed_url` di DB berisi URL malicious (misal admin secara tidak sengaja paste URL lain), iframe bisa jadi vector XSS
- Jangan pakai `<iframe sandbox="">` — Google Maps butuh JavaScript, sandbox ketat akan break map
- Jangan lupa `loading="lazy"` — kalau lupa, LCP score turun karena iframe block initial render
- Jangan lupa `title` attribute di iframe untuk accessibility

### Verifikasi

- [ ] Test dengan `gmaps_embed_url` valid: iframe render, peta interaktif jalan
- [ ] Test dengan `gmaps_embed_url` empty string: fallback UI dengan tombol "Buka di Google Maps" muncul, tombol berfungsi
- [ ] Test dengan `gmaps_embed_url` = URL random (misal `https://evil.com`): validation reject, fallback muncul
- [ ] `npm run build` — output masih `/kontak` sebagai `○ Static`, tidak ada error
- [ ] Lighthouse Kontak dev: Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 90

---

## 🛑 STOP GATE 2 — Visual QA Halaman /kontak

**User harus melakukan tindakan manual sebelum lanjut.**

### Yang harus di-verify oleh user:

1. **Merge feature branch ke `dev` atau deploy preview:**
   - Push commit, biarkan Vercel deploy preview
2. **Visual QA di 3 breakpoint:**
   - 375px (iPhone SE via Chrome DevTools device mode)
   - 768px (tablet portrait)
   - 1280px (laptop)
   - Cek: hero tampil, info + WA + form + gmaps semua terbaca, tidak ada overflow horizontal
3. **Functional test:**
   - Klik tombol WA — tab baru terbuka ke chat WA yang benar dengan pesan default
   - Klik email link — buka mail app
   - Submit form kontak dengan email pribadi → verifikasi email masuk
   - Cek email: sender name, subject, HTML body rapih, reply-to benar
   - Test rate limit: submit 6× cepat → toast warning muncul
4. **Lighthouse:**
   - Run Lighthouse di deploy preview → screenshot skor
   - Target: Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 90, Best Practices ≥ 90

### Setelah user konfirmasi:

- ✅ Halaman `/kontak` visual OK + form E2E lulus + Lighthouse acceptable → lanjut Phase 10

**JANGAN lanjut Phase 10 tanpa konfirmasi user.**

---

## PHASE 10: Frontend Admin — Setup Page + Sidebar Verify

**Reference tasks:** `E2-S3-AD-01`, `E2-S3-AD-03`

### Kerjakan

- [ ] Buka `constants/admin-navigation.ts` — verifikasi ada entry untuk Pengaturan dengan `href="/admin/settings"`. Kalau belum: tambahkan (icon: `Settings` dari Lucide)
- [ ] Buat folder `app/admin/settings/`
- [ ] Buat `app/admin/settings/page.tsx` — Server Component tipis:
  - `export const metadata = { title: 'Pengaturan Kontak — Admin RCI' }`
  - Render `<AdminHeader title="Pengaturan Kontak" breadcrumb={[...]} />`
  - Render `<p>` deskripsi singkat
  - Render `<SettingsForm />` (client component — akan dibuat Phase 11)
- [ ] Untuk sementara: buat stub `components/admin/SettingsForm.tsx` dengan `'use client'` + `return <div>Settings form WIP</div>` supaya import tidak error

### Jangan

- Jangan tambah auth check di `page.tsx` — `app/admin/layout.tsx` sudah handle dari Epic 1 (double guard: middleware + layout)
- Jangan pakai `redirect()` di page.tsx untuk unauth — biarkan middleware handle
- Jangan tambah `revalidate` atau caching — admin pages default Dynamic, itu benar

### Verifikasi

- [ ] Login sebagai admin → sidebar → klik "Pengaturan" → landing di `/admin/settings`, tampil placeholder "Settings form WIP"
- [ ] Unauthenticated user buka `/admin/settings` → redirect ke `/admin/login`
- [ ] Active state di sidebar: entry "Pengaturan" highlight saat di halaman ini
- [ ] Breadcrumb di AdminHeader tampil: "Dashboard > Pengaturan"

---

## PHASE 11: Frontend Admin — SettingsForm Component (Full Implementation)

**Reference task:** `E2-S3-AD-02`

### Kerjakan

- [ ] Ganti stub `components/admin/SettingsForm.tsx` dengan implementasi lengkap:
  - Zod schema untuk 6 field editable
  - `useEffect` fetch initial via `apiFetch<CompanySettingsResponse>('/settings/', { auth: true })` saat mount
  - Loading state (skeleton 6 lines) saat initial fetch
  - Error state dengan "Coba Lagi" button kalau fetch fail
  - `useForm` dengan default `{}`, ter-reset ke server values setelah fetch selesai
  - Render 6 field dengan shadcn `Form` components — pastikan sesuai spek `E2-S3-UX-04`
  - Helper text di `gmaps_embed_url` dan `wa_default_message`
  - Section terpisah "Statistik Dinamis (Read-only)" di bawah form dengan 4 data non-editable
  - Footer form: tombol Batal (secondary, `form.reset(serverValues)`) + Simpan (primary)
  - Submit handler yang:
    1. Transform values ke payload `{ updates: [{ key, value }, ...] }`
    2. `apiFetch('/settings/', { method: 'PATCH', body: JSON.stringify(payload), auth: true })`
    3. Toast success
    4. Panggil Server Action `revalidateSettings()` (dari Phase 12 — bikin stub dulu sekarang, isi actual di Phase 12)
    5. Reset form ke response terbaru
    6. Error handling: 401 redirect login, 4xx toast error dengan detail, 5xx toast generic

### Jangan

- Jangan pakai `useEffect` untuk `form.reset` saat mount kosong — reset HANYA setelah data ter-fetch
- Jangan pakai `SWR` atau `React Query` — pakai plain `useEffect` + `useState` konsisten dengan pattern admin di ARCHITECTURE.md §6.3
- Jangan pass `auth: false` — endpoint butuh JWT
- Jangan pakai `alert()` untuk error — toast (Sonner)
- Jangan tampilkan raw error dari backend ke user — sanitize/generic-kan
- Jangan lupa `form.formState.isDirty` — kalau ingin disable Batal saat form belum di-edit (nice UX)
- Jangan pakai `window.location.reload()` setelah save — pakai form state update dari response
- Jangan lupa read-only info block untuk 4 stat non-editable — ini penting UX, jangan diskip

### Verifikasi

- [ ] Buka `/admin/settings` → initial loading skeleton muncul → form ter-populate dengan value existing
- [ ] Ubah `whatsapp_1` ke `081234567890` → klik Simpan → toast sukses muncul dalam ≤ 3 detik
- [ ] Cek Supabase Dashboard → `company_settings.whatsapp_1.value` = `081234567890`, `updated_at` terbaru
- [ ] Buka `/kontak` di incognito → nilai baru muncul (SETELAH Phase 12 revalidation aktif)
- [ ] Test validasi client: masukkan `whatsapp_1: "abc"` → error inline muncul, tidak submit
- [ ] Test whitelist backend: buka DevTools Network tab → intercept PATCH request, ubah payload jadi `{updates:[{key:"partner_count",value:"999"}]}` → verifikasi backend reject 422
- [ ] Test tombol Batal: ubah field → Batal → form kembali ke server state
- [ ] Read-only info block tampil dengan 4 stat, visually terpisah (dashed border)

---

## PHASE 12: Cache Invalidation via Server Action

**Reference task:** `E2-S3-CACHE-01`

### Kerjakan

- [ ] Buat `app/admin/settings/actions.ts`:
  - `'use server'` directive di baris pertama
  - Export async function `revalidateSettings()` yang:
    - Check user auth via `lib/supabase/server.ts` `createClient()` + `getUser()` (untuk security)
    - Throw kalau tidak authenticated
    - `revalidatePath('/')` (Beranda footer baca `company_settings`)
    - `revalidatePath('/kontak')`
    - Return `{ revalidated: true, timestamp: ... }`
- [ ] Update `components/admin/SettingsForm.tsx` — import `revalidateSettings` dan panggil setelah `PATCH` sukses (sebelum toast final)
- [ ] Handle error dari `revalidateSettings()`: kalau throw, tetap show toast success untuk save (karena data sudah di DB), tapi warn tentang cache

### Jangan

- Jangan pakai `revalidateTag()` kecuali sudah setup tag di semua fetch existing (belum, tidak konsisten) — pakai `revalidatePath()` yang lebih explicit
- Jangan lupa `'use server'` — tanpa ini, Server Action tidak jalan
- Jangan pakai `revalidatePath('/*')` — terlalu agresif. Spesifik ke `/` dan `/kontak` saja
- Jangan panggil `revalidateSettings()` dari komponen yang bukan admin — Server Action harus dilindungi karena tidak automatically auth-checked
- Jangan lupa import dari `'@/app/admin/settings/actions'` di SettingsForm (bukan relative path)

### Verifikasi

- [ ] Ubah `whatsapp_1` di admin → Simpan
- [ ] Tanpa hard refresh, buka `/kontak` di tab baru dalam waktu ≤ 2 detik → nilai baru sudah muncul
- [ ] Buka `/` di tab baru → footer nilai baru muncul
- [ ] Test edge: temporary comment `revalidateSettings()` call di SettingsForm → ubah field → Simpan → buka `/kontak` → nilai BELUM update (masih cache lama). Ini expected behavior tanpa revalidation.
- [ ] Restore call → verifikasi update langsung terjadi

---

## 🛑 STOP GATE 3 — Admin Flow E2E + Revalidation Verification

**User harus melakukan tindakan manual sebelum lanjut.**

### Yang harus di-verify oleh user:

1. **Deploy admin changes ke staging:**
   - Push commit, tunggu Vercel deploy
2. **E2E test flow admin:**
   - Login sebagai admin di staging
   - Buka `/admin/settings`
   - Ubah 3 field berbeda (misal: `whatsapp_1`, `email`, `wa_default_message`)
   - Klik Simpan → toast sukses muncul
3. **Verify propagation:**
   - Buka `/kontak` di incognito → nilai baru muncul, tombol WA baru bawa pesan baru
   - Buka `/` di incognito → footer nilai baru muncul
   - Cek Supabase Dashboard → row-row `company_settings` terupdate dengan `updated_at` terbaru
4. **Security test:**
   - Logout, buka `/admin/settings` → redirect login ✅
   - Buka DevTools → intercept PATCH request → coba kirim `{updates:[{key:"partner_count",value:"999"}]}` → response 422 ✅
5. **Test client dengan sample edit:**
   - Ubah field via admin → cek halaman publik langsung update dalam < 5 detik

### Setelah user konfirmasi:

- ✅ Admin flow lulus + revalidation berjalan + security test OK → lanjut Phase 13

**JANGAN lanjut Phase 13 tanpa konfirmasi user.**

---

## PHASE 13: Documentation Updates

### Kerjakan

- [ ] Update `ARCHITECTURE.md §5.3` — tambah 3 baris di tabel mapping direktif:
  ```markdown
  | `app/(public)/kontak/page.tsx` | Server | Data dari Supabase via public client, ISR revalidate: 3600 |
  | `app/admin/settings/page.tsx` | Server | Wrapper tipis, no auth check (di layout) |
  | `components/forms/ContactForm.tsx` | 'use client' | react-hook-form, useState, toast |
  | `components/admin/SettingsForm.tsx` | 'use client' | react-hook-form, useState, useEffect fetch |
  ```
- [ ] Update `ARCHITECTURE.md §11.3` — tambah `Textarea Sonner` ke daftar shadcn components terinstall
- [ ] Update `ARCHITECTURE.md §16.1` — verifikasi `ContactRequest`, `ContactResponse` sudah ditambah dari Phase 5
- [ ] Update `ARCHITECTURE.md` Changelog table — tambah entry:
  ```markdown
  | 2026-07-XX | 1.1 | Epic 2 Slice 3: kontak page + admin settings + PATCH endpoint + Resend service | Slice 3 selesai | Tim Dev |
  ```
- [ ] Optional: update `README.md` root project dengan catatan "Admin dapat mengedit info kontak di `/admin/settings`. Perubahan langsung tercermin di halaman publik."

### Jangan

- Jangan ubah sections yang tidak relevan
- Jangan hapus catatan historikal dari Slice 1 & 2

### Verifikasi

- [ ] Diff `ARCHITECTURE.md`: hanya tambahan/perubahan pada §5.3, §11.3, §16.1, dan changelog
- [ ] Semua link internal (§ references) masih valid

---

## PHASE 14: Final QA — Build + Lighthouse + TypeScript Clean

### Kerjakan

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → sukses, output:
  - `/kontak` sebagai `○ Static`
  - `/admin/settings` sebagai `ƒ Dynamic` (expected)
  - Tidak ada warning baru dibanding Slice 2 build
- [ ] Backend: `cd backend && python -m pytest` kalau ada test suite (Epic 1 mungkin sudah setup) — atau minimal `python -c "from main import app; print('OK')"`
- [ ] Lighthouse `/kontak` di staging deploy:
  - Performance ≥ 85
  - Accessibility ≥ 90
  - SEO ≥ 90
  - Best Practices ≥ 90
- [ ] Sentry check: buka Sentry dashboard, filter last 24 hours untuk backend + frontend → tidak ada new error yang di-introduce oleh slice 3
- [ ] Verifikasi semua checklist DoD di `E2-S3-QA-06` sudah ✅
- [ ] Semua file baru + modified ter-commit ke Git dengan pesan commit yang deskriptif
- [ ] Buat PR dari feature branch ke `dev` (atau merge kalau workflow trunk-based)

### Jangan

- Jangan skip Lighthouse hanya karena "sudah pernah lihat OK di dev" — audit di staging URL asli
- Jangan force-merge kalau ada CI/CD failing
- Jangan lupa tag commit terakhir dengan `epic2-slice3-complete` (opsional tapi bagus untuk history)

### Verifikasi

- [ ] Screenshot Lighthouse skor disimpan di `docs/lighthouse-reports/` (kalau folder ada) atau di PR description
- [ ] `git log --oneline` menunjukkan semua commit slice 3 dengan message yang jelas

---

## 🛑 STOP GATE 4 — Client Demo & Epic 2 Sign-off

**Ini adalah gate terakhir. Setelah lulus, Epic 2 selesai dan tim bisa mulai Epic 3.**

### Yang harus dilakukan user:

1. **Prepare demo environment:**
   - Verifikasi staging URL berjalan + Railway backend up
   - Login admin credentials siap
   - Screen sharing tool siap
2. **Demo script (dijalankan di depan klien):**

   **Bagian A — Halaman Publik:**
   - Buka `/kontak` di staging → tunjukkan hero, info kontak, WA buttons, form, peta
   - Klik tombol "WA +62 821-3609-6528" → tunjukkan tab baru terbuka ke WhatsApp Web dengan pesan default sudah pre-fill
   - Fill form kontak dengan email klien sendiri → Submit → tunjukkan toast sukses
   - Buka inbox klien → tunjukkan email masuk dengan konten form

   **Bagian B — Admin Panel:**
   - Login sebagai admin → sidebar → Pengaturan
   - Ubah "Pesan Default WhatsApp" ke "Halo, saya ingin bertanya tentang penawaran garam PRO YD."
   - Klik Simpan → toast muncul
   - Buka tab baru `/kontak` → klik tombol WA → tunjukkan pesan baru sudah pre-fill (yang berbeda dari sebelum edit)
   - Kembali ke `/admin/settings` → ubah "Nomor WhatsApp Utama" → Simpan
   - Buka `/` (Beranda) di tab baru → tunjukkan footer sudah menampilkan nomor baru
   - Jelaskan: "Semua perubahan langsung tercermin di halaman publik, tanpa perlu deploy ulang atau bantuan developer."

   **Bagian C — Q&A + Sign-off:**
   - Buka floor untuk pertanyaan klien
   - Konfirmasi Epic 2 dinyatakan selesai (verbally atau dokumen sign-off)
3. **Post-demo action items:**
   - Merge `dev` → `main` untuk production deploy
   - Tag release `v0.2.0` (kalau pakai semver)
   - Update project tracking (Notion/Linear/etc) — Epic 2 → DONE
   - Buat next task tracker untuk Epic 3 (Katalog Produk)

### Setelah user konfirmasi Epic 2 sign-off:

- ✅ **EPIC 2 COMPLETE.** Siap masuk Epic 3.

---

## Ringkasan File yang Dibuat/Modifikasi

**Backend (baru):**
- `backend/schemas/contact.py`
- `backend/services/email_service.py`
- `backend/routers/contact.py`
- `backend/services/__init__.py` (buat/update)

**Backend (modified):**
- `backend/schemas/__init__.py`
- `backend/routers/settings.py`
- `backend/main.py`
- `backend/requirements.txt`
- `backend/.env.example`
- `backend/core/config.py` (kalau `RESEND_API_KEY` belum ada)

**Frontend (baru):**
- `app/(public)/kontak/page.tsx`
- `app/(public)/kontak/loading.tsx`
- `app/admin/settings/page.tsx`
- `app/admin/settings/actions.ts`
- `components/sections/ContactInfo.tsx`
- `components/sections/WhatsAppButtons.tsx`
- `components/sections/GMapsEmbed.tsx`
- `components/forms/ContactForm.tsx` (`'use client'`)
- `components/admin/SettingsForm.tsx` (`'use client'`)
- `components/ui/textarea.tsx` (via shadcn add, kalau belum ada)
- `components/ui/sonner.tsx` (via shadcn add, kalau belum ada)

**Frontend (modified):**
- `types/api.ts`
- `app/sitemap.ts`
- `app/layout.tsx` (kalau mount `<Toaster />` baru)
- `constants/admin-navigation.ts` (kalau entry "Pengaturan" belum ada)
- `lib/utils.ts` (kalau tambah `formatPhoneDisplay`)

**Docs (modified):**
- `ARCHITECTURE.md` (§5.3, §11.3, §16.1, changelog)
- `README.md` (optional)

---

## Kontingensi & Troubleshooting

**Kalau `POST /contact/send` sukses tapi email tidak masuk:**
- Cek Resend dashboard → Logs tab → cari request → lihat status delivery
- Cek folder Spam di inbox admin
- Verifikasi `from` email domain sudah verified atau pakai `onboarding@resend.dev`
- Cek `RESEND_API_KEY` di Railway environment yang benar (staging vs production)

**Kalau `PATCH /settings` return 500 dengan pesan generic:**
- Cek Railway logs → cari log `settings_update_failed` → detail error
- Kemungkinan: RLS policy tidak allow service key untuk UPDATE. Cek migration RLS `company_settings` (Pattern A: `auth.uid() IS NOT NULL`). Service key bypass RLS, tapi kalau ada custom policy yang restrict, bisa gagal.

**Kalau halaman `/kontak` di build output muncul sebagai `ƒ Dynamic`:**
- Ada import atau function call yang trigger dynamic rendering (biasanya `cookies()`, `headers()`, atau server client dari `lib/supabase/server.ts`)
- Grep di `app/(public)/kontak/`: `grep -r "server.ts\|cookies()\|headers()"` — cari yang harus di-refactor ke `public.ts`

**Kalau setelah `revalidateSettings()` halaman publik tetap tampil data lama:**
- Cek apakah dijalankan di production build — dev mode selalu fresh, tidak butuh revalidate
- Cek network tab: apakah request `/kontak` return `Cache-Control` header yang expected
- Kadang CDN cache di Vercel butuh 30-60 detik untuk propagate — coba tunggu

**Kalau shadcn `Sonner` bentrok dengan design system:**
- Sesuaikan warna toast via `<Toaster theme="light" />` atau custom Tailwind class
- Kalau masih bentrok, coba `radix-ui/react-toast` alternative — tapi verifikasi tidak melanggar constraint "no Radix" (Radix Toast beda dengan Radix Slot yang di-ban)

---

*Claude Code Execution Guide · Epic 2 Slice 3 · CV Reka Cipta Indonesia · Juli 2026*
*Setelah slice ini selesai: Epic 2 COMPLETE. Next: Epic 3 — Katalog Produk (5 produk).*
