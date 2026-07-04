# Guide Eksekusi untuk Claude Code — Epic 2 Slice 2: Halaman Tentang Kami

> **Untuk:** Claude Code (agent autonomous)
> **Operator:** Jazi (sole developer)
> **Project:** CV Reka Cipta Indonesia — `reka-cipta-platform`
> **Working dir:** `~/workspace/projects/reka-cipta-website/reka-cipta-platform`
> **Branch:** `dev`
> **Spesifikasi sumber:** `epic2_task_breakdown_slice2_tentang-kami.md` (di project root, jadikan reference utama untuk konten/teks/struktur kode)

---

## Cara Membaca Guide Ini (BACA INI DULU SEBELUM MULAI)

Guide ini disusun sebagai **alur eksekusi linier** dengan **gerbang STOP** di titik-titik yang butuh Jazi turun tangan secara manual.

**Aturan operasi Claude Code:**

1. Kerjakan **fase demi fase** secara berurutan. Jangan lompat.
2. Setiap **🛑 STOP GATE** = berhenti total, tampilkan instruksi manual untuk Jazi dengan format yang sudah disediakan, lalu **tunggu konfirmasi eksplisit** ("lanjut", "done", "ok", dll.) sebelum lanjut ke fase berikutnya. Jangan asumsikan Jazi sudah mengerjakan.
3. Setiap **✅ VERIFY** = jalankan command verifikasi yang ditentukan. Jika output tidak sesuai ekspektasi, **berhenti** dan laporkan ke Jazi — jangan force lanjut.
4. **Jangan pernah** memodifikasi `.env.local`, `.env.production`, atau menjalankan apa pun yang menyentuh Supabase Dashboard / Vercel / Sentry dashboard. Itu domain Jazi.
5. **Jangan pernah** menjalankan `npx supabase db push` — proyek ini pakai jalur Dashboard SQL Editor karena `db push` rusak di network Jazi (lihat memori arsitektur).
6. Spesifikasi visual, copy/teks, struktur kode lengkap sudah ada di `epic2_task_breakdown_slice2_tentang-kami.md`. Gunakan itu sebagai **single source of truth**; guide ini hanya orchestrator.
7. Untuk setiap file kode yang dibuat: ikuti **persis** code snippet yang ada di dokumen task breakdown (`E2-S2-*` blocks). Jangan improvisasi struktur file, naming, atau prop interface kecuali dokumen task breakdown tidak menyebutkan.
8. Bahasa interaksi: **Bahasa Indonesia**.

**Format STOP gate yang harus Claude Code keluarkan ke Jazi:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛑 STOP GATE [N]: [Judul singkat]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Saya perlu kamu kerjakan langkah berikut secara manual:

[langkah-langkah numbered, sangat detail, dengan command/SQL/URL eksak]

Setelah selesai, balas dengan "lanjut" agar saya kembali bekerja.
Jika ada error, paste output errornya.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Ringkasan Fase

| Fase | Deskripsi | Pemain |
|---|---|---|
| 0 | Pre-flight: branch, dependencies, env check | Claude Code |
| 🛑 1 | Verifikasi `SUPABASE_SERVICE_KEY` ada di `.env.local` | Jazi |
| 2 | Buat migration file SQL untuk bucket `legal-docs` | Claude Code |
| 🛑 2 | Eksekusi SQL di Supabase Dashboard | Jazi |
| 3 | Install shadcn `Dialog` + `AspectRatio` | Claude Code |
| 4 | Buat `constants/company-profile.ts` | Claude Code |
| 5 | Buat Route Handler `/api/legal-docs/[filename]` | Claude Code |
| 🛑 3 | Upload 4 PDF ke bucket `legal-docs` | Jazi |
| 🛑 4 | Verifikasi Route Handler dengan curl (Jazi run `npm run dev`) | Jazi + Claude Code |
| 6 | Tambah `.photo-teal-hover` ke `globals.css` | Claude Code |
| 7 | Buat folder `public/images/team/` dan `public/images/legal-thumbnails/` | Claude Code |
| 🛑 5 | Drop foto tim & thumbnail (atau skip pakai fallback) | Jazi |
| 8 | Buat semua komponen frontend (FE-01 s/d FE-07) | Claude Code |
| 9 | Build & smoke test lokal | Claude Code |
| 🛑 6 | Visual review lokal manual | Jazi |
| 10 | Update ARCHITECTURE.md & sitemap.ts | Claude Code |
| 11 | Commit semua perubahan ke branch `dev` | Claude Code |
| 🛑 7 | Verifikasi env var di Vercel + deploy + QA staging | Jazi |
| 12 | (Opsional) Bantu Jazi interpret hasil Lighthouse | Claude Code |

---

# FASE 0 — Pre-flight Check

> **Pemain:** Claude Code
> **Tujuan:** Pastikan working tree bersih, branch benar, dependencies sehat.

Jalankan secara berurutan:

```bash
cd ~/workspace/projects/reka-cipta-website/reka-cipta-platform
git status
git branch --show-current
```

**✅ VERIFY:**
- Branch saat ini = `dev`. Jika bukan, jalankan `git checkout dev` (atau buat dari `main`).
- Working tree bersih. Jika ada uncommitted changes, **STOP** dan tanya Jazi mau diapakan (stash / commit / discard).

Lalu:

```bash
git pull origin dev
node --version
npm list @supabase/supabase-js next react typescript --depth=0 2>/dev/null | head -20
```

**✅ VERIFY:**
- `@supabase/supabase-js` ada (dipakai oleh Route Handler).
- Next.js v15 atau v16.
- Jika `@supabase/supabase-js` tidak ada di dependencies, jalankan `npm install @supabase/supabase-js`.

Setelah Fase 0 hijau, lapor ke Jazi:

> "Fase 0 OK. Branch `dev`, working tree bersih, dependencies sehat. Lanjut ke Stop Gate 1 — verifikasi env var."

Lalu **stop dan keluarkan Stop Gate 1**.

---

# 🛑 STOP GATE 1 — Verifikasi `SUPABASE_SERVICE_KEY`

> **Pemain:** Jazi
> **Kenapa stop:** Claude Code tidak boleh membaca/menulis `.env.local`. Service key ini wajib ada karena Route Handler akan pakai untuk generate signed URL.

**Instruksi yang harus Claude Code kirim ke Jazi:**

```
🛑 STOP GATE 1: Verifikasi SUPABASE_SERVICE_KEY

Saya butuh kamu cek apakah env var ini sudah ada di .env.local:

1. Buka file: ~/workspace/projects/reka-cipta-website/reka-cipta-platform/.env.local
2. Pastikan ada baris:
       SUPABASE_SERVICE_KEY=eyJhbGciOi...
   (TANPA prefix NEXT_PUBLIC_ — ini server-only)

3. Jika belum ada, ambil dari Supabase Dashboard:
   - Buka https://supabase.com/dashboard/project/<project-ref>/settings/api
   - Section "Project API keys"
   - Copy key yang label-nya "service_role" (BUKAN "anon")
   - Paste ke .env.local sebagai:
       SUPABASE_SERVICE_KEY=<paste di sini>
   - SAVE file

4. JANGAN commit .env.local — pastikan ada di .gitignore.

5. Balas "lanjut" kalau sudah ada / sudah ditambahkan.
   Balas "tidak ada akses dashboard" jika ada hambatan.
```

**Setelah Jazi balas "lanjut" →** lanjut ke Fase 2.

---

# FASE 2 — Migration File: Bucket `legal-docs`

> **Pemain:** Claude Code
> **Referensi:** `E2-S2-STG-01` di dokumen task breakdown
> **Catatan keras:** JANGAN jalankan `npx supabase db push`. Kita hanya menulis file SQL; eksekusinya manual via Dashboard.

Generate timestamp untuk nama file migration:

```bash
date +%Y%m%d%H%M%S
```

Buat file `supabase/migrations/<timestamp>_create_legal_docs_bucket.sql` dengan **isi SQL persis seperti di `E2-S2-STG-01`** (insert bucket + 3 RLS policy).

**✅ VERIFY:**
```bash
ls -la supabase/migrations/ | grep legal_docs
cat supabase/migrations/<timestamp>_create_legal_docs_bucket.sql
```
File ada, isi SQL terbaca utuh, tidak ada karakter aneh dari salin-tempel.

Setelah file dibuat, **stop dan keluarkan Stop Gate 2**.

---

# 🛑 STOP GATE 2 — Eksekusi SQL Migration di Supabase Dashboard

> **Pemain:** Jazi
> **Kenapa stop:** `supabase db push` rusak di network Jazi. Jalur resmi proyek ini: paste SQL ke Dashboard SQL Editor.

**Instruksi yang harus Claude Code kirim ke Jazi (sertakan SQL utuh untuk gampang copy-paste):**

```
🛑 STOP GATE 2: Jalankan migration SQL via Supabase Dashboard

File migration sudah saya buat di:
  supabase/migrations/<timestamp>_create_legal_docs_bucket.sql

Langkahmu:

1. Buka https://supabase.com/dashboard/project/<project-ref>/sql/new
2. Copy SELURUH isi SQL berikut, paste ke editor:

----- COPY DARI SINI -----
<paste isi SQL persis dari file migration>
----- SAMPAI SINI -----

3. Klik tombol "Run" (atau Cmd/Ctrl + Enter).
4. Pastikan output: "Success. No rows returned" atau success message lainnya
   tanpa error.

5. Verifikasi bucket terbentuk:
   - Sidebar kiri → Storage
   - Bucket "legal-docs" harus muncul dengan ikon GEMBOK (private)
   - Klik bucket → harus kosong (belum ada file)

6. Verifikasi bucket benar-benar private (security test):
   - Coba buka URL ini di browser (ganti <project-ref>):
       https://<project-ref>.supabase.co/storage/v1/object/public/legal-docs/test.pdf
   - Harus return error 400 atau 403 — BUKAN 200/404. Kalau 200, ada
     kesalahan konfigurasi: bucket masih public.

7. Balas "lanjut" jika sukses + bucket terbentuk + private OK.
   Balas dengan paste error message jika ada masalah.
```

**Setelah Jazi balas "lanjut" →** lanjut ke Fase 3.

---

# FASE 3 — Install shadcn `Dialog` + `AspectRatio`

> **Pemain:** Claude Code
> **Referensi:** `E2-S2-SETUP-01`
> **Catatan keras:** Project pakai Base UI, bukan Radix UI. shadcn versi terbaru sudah support Base UI registry. **Verifikasi** bahwa file yang ter-generate tidak mengimpor `@radix-ui/*`. Jika iya, **STOP** dan lapor ke Jazi — perlu refactor manual karena memori arsitektur menegaskan `asChild` & `@radix-ui/react-slot` tidak boleh dipakai.

```bash
npx shadcn@latest add dialog
npx shadcn@latest add aspect-ratio
```

**✅ VERIFY:**
```bash
ls components/ui/dialog.tsx components/ui/aspect-ratio.tsx
grep -n "@radix-ui" components/ui/dialog.tsx components/ui/aspect-ratio.tsx
```

- Kedua file ada.
- `grep` untuk `@radix-ui` **harus return nothing**. Jika ada match → **STOP** dan lapor ke Jazi: "shadcn meng-generate komponen yang impor @radix-ui. Project ini pakai Base UI. Perlu keputusan: (a) refactor manual ke Base UI primitives, atau (b) install `@radix-ui/react-dialog` sebagai pengecualian khusus untuk Dialog. Saya tidak akan auto-fix tanpa instruksi."

Smoke test cepat:

```bash
npx tsc --noEmit 2>&1 | tail -20
```

Tidak boleh ada error TypeScript baru.

Setelah Fase 3 hijau, lanjut ke Fase 4 (tanpa stop gate).

---

# FASE 4 — `constants/company-profile.ts`

> **Pemain:** Claude Code
> **Referensi:** `E2-S2-CONST-01`

Buat file `constants/company-profile.ts` dengan **isi persis seperti di dokumen task breakdown** — 5 export utama:
- `COMPANY_TIMELINE` (3 milestone)
- `COMPANY_VISION` (string)
- `COMPANY_MISSION` (5 poin, **bukan 4** — ini penting, dokumen menegaskan)
- `TEAM_MEMBERS` (4 orang)
- `LEGAL_DOCUMENTS` (4 dokumen)

Plus types: `TimelineMilestone`, `MissionPoint`, `TeamMember`, `LegalDocument`.

**✅ VERIFY:**
```bash
npx tsc --noEmit 2>&1 | tail -20
node -e "const c = require('./constants/company-profile.ts'); console.log(c)" 2>/dev/null || \
  npx tsx -e "import * as c from './constants/company-profile.ts'; console.log(Object.keys(c))"
```

Verifikasi: 5 export terbaca, no TS error. Cek manual jumlah misi = 5 dan jumlah tim = 4.

Lanjut Fase 5 (tanpa stop gate).

---

# FASE 5 — Route Handler `/api/legal-docs/[filename]`

> **Pemain:** Claude Code
> **Referensi:** `E2-S2-RH-01`

Buat file `app/api/legal-docs/[filename]/route.ts` dengan isi persis seperti di dokumen task breakdown:

- Import `createClient` dari `@supabase/supabase-js`.
- Konstanta `VALID_FILENAMES` whitelist 4 file.
- Buat `supabaseAdmin` pakai `SUPABASE_SERVICE_KEY` (server-only).
- `GET` handler: validasi filename → `createSignedUrl(filename, 3600)` → return `{ url }` dengan `Cache-Control: private, max-age=300`.

**⚠️ Catatan Next.js 15:** signature `{ params }` di Next.js 15 berubah — `params` adalah `Promise`. Sesuaikan:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  // ... sisa logika persis dari task breakdown
}
```

Jika project pakai Next.js 16, cek signature terbaru — kalau ragu, **STOP** dan tanya Jazi.

**✅ VERIFY:**
```bash
npx tsc --noEmit 2>&1 | grep "api/legal-docs"
```
Tidak boleh ada error.

Setelah Fase 5 selesai, **stop dan keluarkan Stop Gate 3** (upload PDF).

---

# 🛑 STOP GATE 3 — Upload 4 Dokumen Legal PDF ke Bucket

> **Pemain:** Jazi
> **Kenapa stop:** File PDF aktual harus diperoleh dari klien dan diunggah via Dashboard. Claude Code tidak punya akses ke kedua hal itu.

**Instruksi yang harus Claude Code kirim:**

```
🛑 STOP GATE 3: Upload 4 PDF dokumen legal

Bucket "legal-docs" sudah siap. Sekarang isi 4 dokumen.

Langkahmu:

1. Siapkan 4 file PDF dengan nama PERSIS seperti ini (CASE-SENSITIVE,
   harus identik karena whitelist Route Handler memvalidasi nama file):

       akta-notaris.pdf
       nib.pdf
       npwp.pdf
       kemenkumham.pdf

2. Buka https://supabase.com/dashboard/project/<project-ref>/storage/buckets/legal-docs

3. Klik tombol "Upload files" → pilih ke-4 PDF.

4. Verifikasi: di bucket harus tampil 4 file dengan nama persis seperti di
   atas. Klik salah satu → tampil file detail.

5. KALAU PDF AKTUAL BELUM TERSEDIA DARI KLIEN:
   - Buat 4 PDF placeholder. Cara paling cepat:
     a. Buka https://www.ilovepdf.com/word_to_pdf atau aplikasi Word/Pages
     b. Bikin dokumen 1 halaman dengan teks besar:
            "PLACEHOLDER — Akta Notaris CV Reka Cipta Indonesia"
        Lakukan untuk 4 dokumen (ganti label tiap file).
     c. Export sebagai PDF dengan nama persis sesuai daftar di atas.
   - Upload semua 4 PDF placeholder ke bucket.
   - Catat di task tracker bahwa konten masih placeholder — perlu di-replace
     sebelum demo final ke klien.

6. Balas "lanjut" setelah 4 file ter-upload (asli atau placeholder).
   Balas "PDF belum dapat dari klien dan tidak mau pakai placeholder" kalau
   mau pause slice ini.
```

**Setelah Jazi balas "lanjut" →** lanjut ke Stop Gate 4 (sekaligus, karena yang dites adalah Route Handler yang baru selesai dibuat).

---

# 🛑 STOP GATE 4 — Test Route Handler End-to-End

> **Pemain:** Jazi (jalankan dev server) + Claude Code (jalankan curl)
> **Kenapa stop:** `npm run dev` memblokir terminal Claude Code; Jazi yang harus pegang prosesnya.

**Instruksi yang harus Claude Code kirim:**

```
🛑 STOP GATE 4: Test Route Handler dengan PDF asli

1. Di terminal terpisah, jalankan dev server:
       cd ~/workspace/projects/reka-cipta-website/reka-cipta-platform
       npm run dev

2. Tunggu sampai output bilang "Ready in Xs" / "started server on http://localhost:3000".

3. Balas "dev server jalan" agar saya bisa jalankan curl test.

   Atau, kalau mau test sendiri, jalankan di terminal lain:

       curl -i http://localhost:3000/api/legal-docs/nib.pdf
       # Expected: HTTP 200, body { "url": "https://...token..." }

       curl -i "http://localhost:3000/api/legal-docs/../etc/passwd"
       # Expected: HTTP 404, body { "error": "Document not found", "code": "INVALID_FILENAME" }

       curl -i http://localhost:3000/api/legal-docs/random.pdf
       # Expected: HTTP 404, "INVALID_FILENAME"

4. Test URL hasilnya: copy URL dari response curl pertama → paste di browser
   → PDF dokumen NIB harus muncul. Kalau muncul, signed URL works.

5. Balas "lanjut" jika ketiga test lulus.
   Balas dengan paste error kalau ada yang gagal.
   JANGAN matikan dev server — masih dipakai di fase berikutnya untuk
   smoke test frontend.
```

**Setelah Jazi balas "lanjut" →** lanjut ke Fase 6.

---

# FASE 6 — Tambah `.photo-teal-hover` ke `globals.css`

> **Pemain:** Claude Code
> **Referensi:** `E2-S2-FE-05` (catatan tentang CSS)
> **Catatan keras:** `globals.css` adalah file FROZEN per memori arsitektur. Penambahan ini diizinkan karena class sudah didefinisikan di Design System v2.0 §19.5; kita hanya implementasi yang belum ada. Tambahkan dengan komentar `/* Tambahan Slice 2 — Design System §19.5 */`.

1. Baca `app/globals.css` (atau `styles/globals.css` — sesuaikan dengan struktur project).
2. Cek apakah `.photo-teal-hover` sudah ada. Jika ya: skip fase ini.
3. Jika belum: append blok CSS persis seperti di task breakdown `E2-S2-FE-05`, dibungkus marker komentar:

```css
/* ─── Tambahan Slice 2 — Design System v2.0 §19.5 ─── */
.photo-teal-hover { position: relative; overflow: hidden; }
.photo-teal-hover img { transition: filter 400ms ease, transform 400ms ease; }
.photo-teal-hover::after {
  content: '';
  position: absolute; inset: 0;
  background: #0B7D6E;
  mix-blend-mode: multiply;
  opacity: 0;
  transition: opacity 300ms ease;
  border-radius: inherit;
}
.photo-teal-hover:hover img { transform: scale(1.04); filter: grayscale(20%); }
.photo-teal-hover:hover::after { opacity: 0.3; }
/* ─── End Tambahan Slice 2 ─── */
```

**✅ VERIFY:**
```bash
grep -n "photo-teal-hover" app/globals.css
```
Harus return minimal 5 baris (definisi base + 4 selektor pseudo/hover).

Lanjut Fase 7 tanpa stop gate.

---

# FASE 7 — Siapkan Folder Aset Statis

> **Pemain:** Claude Code

```bash
mkdir -p public/images/team
mkdir -p public/images/legal-thumbnails
touch public/images/team/.gitkeep
touch public/images/legal-thumbnails/.gitkeep
```

Setelah folder ada, **stop dan keluarkan Stop Gate 5**.

---

# 🛑 STOP GATE 5 — Drop Foto Tim & Thumbnail (atau Skip)

> **Pemain:** Jazi
> **Kenapa stop:** File foto aktual perlu ditaruh manual; ini bukan code.

**Instruksi yang harus Claude Code kirim:**

```
🛑 STOP GATE 5: Foto tim & thumbnail dokumen (opsional)

Folder sudah saya siapkan:
  public/images/team/
  public/images/legal-thumbnails/

Pilihan A — kalau foto tim sudah ada:
  1. Resize ke max 400×400px, compress < 100KB (pakai squoosh.app).
  2. Drop ke public/images/team/ dengan nama PERSIS:
       widril-fakki.jpg
       abdul-majid.jpg
       salman-al-halili.jpg
       irwan-sugianto.jpg
  3. Balas "foto tim siap".

Pilihan B — kalau foto tim belum ada:
  1. Skip. Komponen TeamMember akan otomatis pakai fallback avatar
     berisi inisial nama (WF, AM, SH, IS) di background teal.
  2. Balas "skip foto tim".

Thumbnail dokumen legal (opsional di kedua pilihan):
  - Kalau punya screenshot/preview dokumen jpg, taruh di
    public/images/legal-thumbnails/ dengan nama:
       akta-notaris.jpg, nib.jpg, npwp.jpg, kemenkumham.jpg
  - Kalau tidak punya, skip — card akan tampil ikon FileText sebagai gantinya.

Balas dengan kombinasi pilihan kamu (mis. "skip foto tim, skip thumbnail"
atau "foto tim siap, skip thumbnail") agar saya lanjut.
```

**Setelah Jazi balas →** lanjut ke Fase 8.

---

# FASE 8 — Implementasi Semua Komponen Frontend

> **Pemain:** Claude Code
> **Referensi:** `E2-S2-FE-01` s/d `E2-S2-FE-07`

Kerjakan **berurutan** sesuai task breakdown, jangan diparalelkan:

1. **FE-01** — `app/(public)/tentang-kami/page.tsx` + `loading.tsx` (skeleton sederhana)
2. **FE-02** — `components/sections/InnerPageHero.tsx` (reusable, dipakai juga di Slice 3)
3. **FE-03** — `components/sections/CompanyTimeline.tsx`
4. **FE-04** — `components/sections/VisiMisi.tsx`
5. **FE-05** — `components/blocks/TeamMember.tsx` + `components/sections/OrgStructure.tsx`
   - Untuk fallback avatar: pakai pendekatan Client Component dengan `useState` untuk error state Image. Snippet persis di task breakdown.
6. **FE-06** — `components/blocks/LegalDocCard.tsx` + `LegalDocModal.tsx` + `components/sections/LegalDocsGrid.tsx`
   - Semua Client Component (`'use client'`).
7. **FE-07** — Assembly: pastikan `page.tsx` mengimport dan menyusun semua section sesuai urutan di task breakdown.

**Setelah setiap file dibuat**, jalankan `npx tsc --noEmit` — tangkap error lebih awal sebelum menumpuk. Jangan tunda sampai semua selesai.

**✅ VERIFY (akhir fase):**
```bash
npx tsc --noEmit 2>&1 | tail -30
npm run lint 2>&1 | tail -20
```
Zero TypeScript error. Lint warnings boleh, tapi tidak boleh ada error.

Lanjut Fase 9 tanpa stop gate.

---

# FASE 9 — Build & Smoke Test Lokal

> **Pemain:** Claude Code

```bash
npm run build 2>&1 | tail -40
```

**✅ VERIFY:**
- Build sukses (exit code 0).
- Cari baris untuk `/tentang-kami` di output build — harus muncul sebagai **`○` (Static)**, bukan `ƒ` (Dynamic). Kalau muncul sebagai Dynamic, ada Server Component yang nyentuh `cookies()` atau `headers()` — investigasi dulu sebelum lanjut.
- Route `/api/legal-docs/[filename]` muncul sebagai **`ƒ` (Dynamic)** — ini benar, route handler memang dynamic.

Setelah build hijau, **stop dan keluarkan Stop Gate 6**.

---

# 🛑 STOP GATE 6 — Visual Review Lokal Manual

> **Pemain:** Jazi
> **Kenapa stop:** Lighthouse, DevTools throttle, hover effect, keyboard navigation — semuanya manusia-driven.

**Instruksi yang harus Claude Code kirim:**

```
🛑 STOP GATE 6: Visual review & smoke test di browser

Build lulus. Dev server kamu seharusnya masih jalan dari Stop Gate 4
(kalau sudah mati, jalankan ulang: npm run dev).

Buka http://localhost:3000/tentang-kami dan lakukan:

A. SCROLL TEST (1 menit):
   [ ] InnerPageHero: title "Tentang Kami" + subtitle + breadcrumb tampil
       di atas latar gelap. Animasi masuk smooth (page-transition).
   [ ] Timeline: 3 milestone (2018, 2019, 2020) muncul dengan reveal
       kiri ke kanan saat di-scroll, stagger ~200ms.
   [ ] Visi: kutipan italic dengan tanda kutip teal, reveal-blur.
   [ ] Misi: 5 POIN (bukan 4). Hitung manual — kalau cuma 4, ada
       data salah, lapor balik ke saya.
   [ ] Tim: 4 card. Foto tampil ATAU fallback avatar initial (WF/AM/SH/IS).
       Hover foto → ada efek zoom + tint teal (kalau foto ada).
   [ ] Dokumen: 4 card. Ikon FileText (atau thumbnail kalau ada).

B. MODAL TEST (1 menit):
   [ ] Klik tombol "Lihat" di card NIB → loading spinner muncul →
       modal terbuka → PDF NIB ter-render di iframe.
   [ ] Buka DevTools → Network tab → klik "Lihat" lagi di Akta Notaris.
       Pastikan ada request ke /api/legal-docs/akta-notaris.pdf
       dan responsenya { url: "https://..." }.
   [ ] Klik tombol "Unduh PDF" di modal → file ter-download.
   [ ] Klik "Tutup" atau tekan Esc → modal tertutup.
   [ ] Tab di dalam modal → focus tetap di dalam (focus trap aktif).

C. RESPONSIVE TEST (1 menit):
   [ ] DevTools → toggle device toolbar → set 375px:
       - Timeline tampil vertikal
       - Visi Misi satu kolom
       - Tim 2 kolom (4 card jadi 2 baris)
       - Dokumen 2 kolom
       - Modal hampir full screen
   [ ] Set 768px: tim 4 kolom, dokumen 4 kolom horizontal.
   [ ] Set 1280px: layout penuh.
   [ ] Tidak ada horizontal scroll di semua breakpoint.

D. LIGHTHOUSE (2 menit):
   [ ] DevTools → tab Lighthouse → Mobile → kategori Performance,
       Accessibility, SEO → Analyze.
   [ ] Catat skor. Target: Perf ≥ 85, A11y ≥ 90, SEO ≥ 90.

Balas dengan format:
  - "Scroll test: ✅"
  - "Modal test: ✅" atau detail kegagalan
  - "Responsive: ✅" atau breakpoint mana yang bermasalah
  - "Lighthouse: Perf 8?, A11y 9?, SEO 9?"

Saya tunggu hasilnya sebelum lanjut commit.
```

**Setelah Jazi konfirmasi semua hijau →** lanjut ke Fase 10.
**Kalau ada yang merah →** debug bersama Jazi sebelum lanjut. Jangan commit kode merah.

---

# FASE 10 — Update Dokumentasi

> **Pemain:** Claude Code
> **Referensi:** `E2-S2-FE-01` (sitemap), `E2-S2-FE-07` & `E2-S2-QA-05` (ARCHITECTURE.md)

1. **`app/sitemap.ts`** — tambahkan entry `/tentang-kami`:
   ```typescript
   { url: 'https://rekaciptaindonesia.com/tentang-kami', changeFrequency: 'yearly', priority: 0.8 },
   ```

2. **`ARCHITECTURE.md §11.3`** — tambahkan `Dialog`, `AspectRatio` ke daftar shadcn yang terinstall.

3. **`ARCHITECTURE.md §5.3`** — tambahkan baris mapping:
   ```markdown
   | `app/(public)/tentang-kami/page.tsx` | Server | Semua data dari constants, SSG |
   ```

4. **`ARCHITECTURE.md` changelog** — tambahkan entry tanggal hari ini: "Slice 2 (Tentang Kami) — bucket legal-docs, Route Handler /api/legal-docs, .photo-teal-hover dipindah dari Design System ke globals.css".

**✅ VERIFY:**
```bash
git diff --stat ARCHITECTURE.md app/sitemap.ts
```
Pastikan kedua file dimodifikasi.

Lanjut Fase 11 tanpa stop gate.

---

# FASE 11 — Commit ke Branch `dev`

> **Pemain:** Claude Code

```bash
git add -A
git status
```

**✅ VERIFY status sebelum commit:**
- `.env.local` **TIDAK** muncul di staged files (kalau muncul, **STOP** — `.gitignore` bocor, lapor ke Jazi).
- File yang di-stage hanya: file kode baru, migration SQL, ARCHITECTURE.md, sitemap.ts, globals.css, .gitkeep — plus opsional foto/thumbnail kalau Jazi drop.

Commit dengan message terstruktur (referensi: gaya commit existing di repo — kalau Jazi pakai conventional commits, ikuti; kalau ad-hoc, ikuti juga):

```bash
git commit -m "feat(epic2-slice2): halaman Tentang Kami lengkap

- bucket legal-docs (migration SQL) + Route Handler signed URL
- constants/company-profile.ts (timeline, visi-misi, tim, dokumen)
- 4 section: InnerPageHero, CompanyTimeline, VisiMisi, OrgStructure, LegalDocsGrid
- shadcn Dialog + AspectRatio
- .photo-teal-hover dipindah dari Design System ke globals.css
- sitemap + ARCHITECTURE.md diupdate

Ref: E2-S2-* tasks; epic2_task_breakdown_slice2_tentang-kami.md"

git push origin dev
```

Setelah push sukses, **stop dan keluarkan Stop Gate 7**.

---

# 🛑 STOP GATE 7 — Verifikasi Env Var Vercel + Deploy + QA Staging

> **Pemain:** Jazi
> **Kenapa stop:** Claude Code tidak punya akses Vercel dashboard. `SUPABASE_SERVICE_KEY` harus ada di production env juga, bukan cuma local.

**Instruksi yang harus Claude Code kirim:**

```
🛑 STOP GATE 7: Deploy ke Vercel + QA staging

1. ENV VAR DI VERCEL:
   - Buka https://vercel.com/<team>/<project>/settings/environment-variables
   - Pastikan SUPABASE_SERVICE_KEY ada dengan scope:
     ✅ Production  ✅ Preview  ✅ Development
   - Kalau belum ada: Add → name SUPABASE_SERVICE_KEY → paste value yang
     sama dari .env.local → Save.

2. TUNGGU DEPLOY:
   - Push tadi otomatis trigger Vercel deploy preview untuk branch dev.
   - Buka https://vercel.com/<team>/<project>/deployments
   - Tunggu deploy terbaru "Ready" (biasanya 1-3 menit).
   - Catat URL preview-nya (mis. https://reka-cipta-platform-<hash>.vercel.app).

3. SMOKE TEST DI STAGING:
   [ ] Buka <staging>/tentang-kami → halaman load tanpa error.
   [ ] Klik "Lihat" pada NIB → modal terbuka dengan PDF (sama seperti lokal).
   [ ] DevTools → Network → request /api/legal-docs/nib.pdf return 200.

4. SECURITY CHECK DI STAGING:
   [ ] Buka <staging>/api/legal-docs/../etc/passwd di browser → harus 404
       dengan JSON body, BUKAN 500 stack trace.
   [ ] Copy signed URL dari response → paste di browser baru → PDF terbuka.
   [ ] Coba akses langsung https://<project-ref>.supabase.co/storage/v1/object/public/legal-docs/nib.pdf
       → harus 400/403, bukan 200.

5. LIGHTHOUSE STAGING:
   [ ] DevTools Lighthouse di URL staging → catat skor.

Balas dengan:
  - URL staging
  - Skor Lighthouse
  - "Semua test ✅" atau detail kegagalan

Setelah semua hijau di staging, Slice 2 secara resmi SELESAI dan siap
demo ke klien.
```

**Setelah Jazi balas semua hijau →** Slice 2 selesai. Lapor:

> "🎉 Slice 2 Tentang Kami selesai dan live di staging. Demo ke klien siap. Mau lanjut Slice 3 (Kontak) atau ada yang mau di-polish dulu?"

---

# Lampiran A — Skenario "Saya butuh keputusan Jazi"

Kalau di tengah jalan Claude Code menemui ambiguitas yang **tidak** ditutup oleh dokumen task breakdown maupun guide ini, **STOP** dan tanya. Contoh:

- Versi Next.js (15 vs 16) → signature route handler beda → tanya kalau ragu.
- shadcn meng-generate komponen ber-Radix → tanya pilihan refactor vs install Radix.
- Build menampilkan `/tentang-kami` sebagai Dynamic (`ƒ`) padahal target Static (`○`) → investigasi + lapor sebelum force lanjut.
- Foto/thumbnail file format selain `.jpg` (`.png`, `.webp`) → tanya apakah ganti constants atau minta Jazi konversi.

Pertanyaan ke Jazi harus **pendek dan menyodorkan 2-3 opsi konkret**, bukan open-ended.

# Lampiran B — Hal yang TIDAK Dikerjakan di Slice 2

Untuk mencegah scope creep, **abaikan** hal-hal berikut walaupun terdengar relevan:

- Admin panel untuk edit konten Tentang Kami → keputusan arsitektur: konten via deploy, bukan CRM.
- Tabel `team_members` atau `legal_documents` di database → hardcoded di constants.
- AI proposal generator → Epic 4.
- Form kontak → Slice 3.

---

*Guide ini dibuat khusus untuk Claude Code, berdasarkan `epic2_task_breakdown_slice2_tentang-kami.md` v1.0 dan memori arsitektur project Reka Cipta. Update guide kalau task breakdown direvisi.*
