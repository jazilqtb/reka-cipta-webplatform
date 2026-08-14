# Konteks Project untuk Diskusi Hosting/Deployment

> **Cara pakai dokumen ini:** Ini adalah dokumen ringkasan kondisi teknis project saya saat ini, dibuat khusus supaya bisa saya tempel ke AI chat lain untuk belajar konsep hosting/deployment (Vercel, Railway, Supabase, SEO) secara konseptual DAN aplikatif sesuai kondisi project ini. Saya belum paham sama sekali soal hosting — baik konsepnya maupun cara menerapkannya di project ini. Tolong jelaskan dari dasar, dan kaitkan penjelasan dengan detail teknis di bawah.

---

## 1. Apa project ini

Website perusahaan (CV Reka Cipta Indonesia — perusahaan garam) dengan:
- Website publik (company profile, katalog produk, artikel/blog, kalkulator kebutuhan garam, form RFQ/minta penawaran, form pendaftaran supplier)
- Panel admin (CRM) untuk tim internal: kelola leads, artikel, produk, supplier, template email/WA, generate proposal PDF otomatis pakai AI

Ini monorepo dengan dua bagian yang **di-deploy terpisah**:
```
/                    ← Next.js 14 (App Router) — frontend
/backend/            ← FastAPI (Python) — backend API
/supabase/migrations ← Skema database (26 file migrasi)
```

## 2. Kenapa 3 platform (Vercel + Railway + Supabase)?

Ini pertanyaan konsep pertama yang perlu dijelaskan ke saya: kenapa tidak 1 platform saja?

Faktanya di project ini:
- **Vercel** — hosting frontend Next.js. Dipilih karena dibuat oleh tim yang sama dengan Next.js, jadi fitur seperti ISR (Incremental Static Regeneration), Server Components, image optimization jalan native tanpa konfigurasi tambahan.
- **Railway** — hosting backend FastAPI (Python). Dipilih karena backend butuh proses long-running (bukan serverless function), dan butuh install system package non-Python (lihat `backend/railpack.json`: `libcairo2`, `libpango`, dll — dipakai library `weasyprint` untuk generate PDF proposal).
- **Supabase** — database PostgreSQL + Auth + Storage terkelola. Bukan sekadar database, tapi juga handle login admin (Supabase Auth) dan penyimpanan file (foto produk, PDF, thumbnail artikel) lewat Supabase Storage.

## 3. Status deploy SAAT INI (penting — ini bukan project yang belum pernah live)

Bukti dari kode (`backend/core/config.py:14-17`):
```python
# Default ke domain Vercel aktual saat ini (belum ada custom domain
# rekaciptaindonesia.com terpasang). Override via env var Railway
# kapan pun custom domain sudah live — tidak perlu ubah kode.
FRONTEND_URL: str = "https://reka-cipta-webplatform.vercel.app"
```

Artinya:
- ✅ Project **sudah live** di subdomain bawaan Vercel: `reka-cipta-webplatform.vercel.app`
- ❌ **Belum** pakai custom domain `rekaciptaindonesia.com` — domain ini baru dipakai sebagai referensi hardcoded di kode (`app/sitemap.ts`, `app/robots.ts`, `app/layout.tsx`), tapi belum tersambung secara aktual (DNS belum tentu diarahkan, belum tentu domainnya sudah dibeli).
- Repo GitHub: `jazilqtb/reka-cipta-webplatform` (auto-deploy trigger dari sini)
- Supabase project ref yang tercatat di `supabase/config.toml` (komentar): `glwdujgmeojzcdrlcbip`

**Yang TIDAK bisa saya (asisten AI di terminal ini) verifikasi:**
- Apakah domain `rekaciptaindonesia.com` sudah dibeli
- Apakah DNS-nya sudah diarahkan ke Vercel
- Isi env var yang sebenarnya di dashboard Vercel/Railway (saya cuma tahu apa yang HARUS ada dari kode)
- Status project Railway (apakah root directory sudah di-set ke `/backend`)

Tidak ada CLI `gh`/`vercel`/`railway` terpasang di environment kerja saya, jadi semua ini perlu dicek manual lewat dashboard masing-masing.

## 4. Strategi branch → environment

| Branch | Environment | Target deploy |
|---|---|---|
| `main` | Production | Vercel prod + Railway prod |
| `dev` | Staging (demo klien) | Vercel staging + Railway staging |
| `feature/{task-id}-{slug}` | Preview | Vercel preview only |

Auto-deploy terjadi lewat integrasi GitHub bawaan Vercel & Railway (bukan GitHub Actions — tidak ada folder `.github/workflows`). Setiap push ke branch yang terhubung akan otomatis trigger build baru.

⚠️ **Gotcha yang pernah terjadi (dari histori kerja sebelumnya):** push ke `dev` sempat tidak langsung update di domain staging (`reka-cipta-webplatform.vercel.app`) — build baru sukses, tapi domain alias-nya tidak otomatis pindah ke deployment terbaru. Ternyata perlu klik manual **"Promote to Production"** di dashboard Vercel. Ini penting dipahami: auto-deploy ≠ otomatis langsung tayang di domain utama, tergantung setting project di Vercel.

## 5. Vercel (frontend) — detail teknis

File konfigurasi: `next.config.ts` (bukan `vercel.json` — tidak ada file itu, semua pakai default Vercel + Next.js config native).

Env vars yang harus ada di Vercel dashboard (dari `ARCHITECTURE.md` §10.1 + `.env.local.example`):
| Variable | Scope | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Anon key Supabase |
| `SUPABASE_SERVICE_KEY` | **Server-only** | Service role key — JANGAN prefix `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_API_URL` | Public | Base URL backend Railway |
| `NEXT_PUBLIC_SENTRY_DSN` | Public | Sentry (error monitoring) |
| `REVALIDATION_SECRET` | **Server-only** | Secret untuk webhook cache invalidation |

Fitur Next.js yang dipakai dan relevan untuk hosting:
- **Security headers** di-set manual di `next.config.ts` (X-Frame-Options, HSTS, dll) — bukan default Vercel.
- **Image optimization** cuma di-allow untuk domain `*.supabase.co` (lihat `images.remotePatterns`) — kalau nanti ada sumber gambar lain, ini harus ditambah manual.
- **Sentry** terintegrasi lewat `withSentryConfig()` — upload source map otomatis saat build di CI.

## 6. Railway (backend) — detail teknis

Entry point: `backend/main.py` (FastAPI), dijalankan lewat `backend/Procfile`:
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

`backend/railpack.json` — install system packages tambahan (di luar `pip install`) yang dibutuhkan `weasyprint` untuk generate PDF:
```json
{ "deploy": { "aptPackages": ["libcairo2", "libpango-1.0-0", "libpangocairo-1.0-0",
  "libgdk-pixbuf-2.0-0", "libglib2.0-0", "libffi-dev", "shared-mime-info", "fonts-liberation"] } }
```

**Penting:** karena ini monorepo, Railway harus di-set **root directory = `/backend`** di dashboard — kalau tidak, Railway akan coba deploy dari root repo dan gagal (tidak ketemu `Procfile`/`requirements.txt`).

Env vars wajib (`backend/core/config.py`):
| Variable | Wajib? | Keterangan |
|---|---|---|
| `SUPABASE_URL` | ✅ | |
| `SUPABASE_SERVICE_KEY` | ✅ | |
| `SUPABASE_JWT_SECRET` | ✅ | Verifikasi JWT dari Supabase Auth |
| `ALLOWED_ORIGINS` | Default `http://localhost:3000` | ⚠️ **HARUS diganti** ke domain frontend production, kalau tidak CORS akan block semua request dari domain live |
| `ENVIRONMENT` | Default `development` | Set `production` di Railway prod (juga mematikan `/docs` Swagger endpoint otomatis) |
| `FRONTEND_URL` | Default `https://reka-cipta-webplatform.vercel.app` | Dipakai untuk generate link di email (misal link admin panel di notifikasi email) |
| `RESEND_API_KEY` | ✅ untuk fitur email | |
| `ANTHROPIC_API_KEY` | ✅ untuk fitur AI Proposal Generator | |
| `SENTRY_DSN` | Opsional | |
| `REVALIDATION_SECRET` | Sama dengan Next.js | |

CORS (`backend/main.py:53-60`) membaca `ALLOWED_ORIGINS` (comma-separated) dan strict — origin yang tidak terdaftar akan ditolak browser.

## 7. Supabase — detail teknis

- **Database:** PostgreSQL, semua tabel pakai **RLS (Row Level Security)** aktif — jadi akses data diatur lewat policy, bukan cuma lewat kode aplikasi.
- **Auth:** dipakai untuk login admin panel (`@supabase/ssr`), JWT expiry 3600s dengan auto-refresh.
- **Storage:** 4 bucket untuk file upload (foto produk, PDF lab, thumbnail artikel, dll), diakses lewat URL publik `*.supabase.co/storage/v1/object/public/...`.
- **Migrasi schema:** WAJIB lewat file migrasi di `supabase/migrations/` (26 file saat ini), dijalankan dengan `npm run db:push` (= `supabase db push`). **Tidak boleh edit schema langsung lewat dashboard Supabase** — ini aturan keras di project.
- Region: Singapore (disebutkan di `ARCHITECTURE.md`).

## 8. Supaya muncul di pencarian Google (SEO teknis)

Bagian ini **sudah otomatis dari kode**, tapi cuma separuh jalan — separuh lagi manual di luar kode:

**Sudah otomatis (kode):**
- `app/robots.ts` → generate `/robots.txt` otomatis: allow semua halaman publik, disallow `/admin/*` dan `/api/*`.
- `app/sitemap.ts` → generate `/sitemap.xml` otomatis, isi: semua halaman statis + URL dinamis tiap produk aktif & artikel published (query langsung ke Supabase).
- `app/layout.tsx` → `metadataBase` untuk meta tag/OG image yang benar.

**Belum otomatis, harus dilakukan manual (langkah yang perlu saya pelajari):**
1. Domain custom (`rekaciptaindonesia.com`) harus benar-benar live dulu (lihat poin 3).
2. Daftarkan domain ke **Google Search Console**, verifikasi kepemilikan.
3. Submit URL sitemap (`https://rekaciptaindonesia.com/sitemap.xml`) di Search Console.
4. Tunggu proses crawl & index Google (bisa beberapa hari–minggu, bukan instan).
5. (Opsional lanjutan) Google Business Profile, backlink, dll — di luar scope teknis kode.

## 9. Bisa edit konten setelah live? (real-time content update)

**Ya** — tapi mekanismenya bukan "live streaming edit", melainkan **ISR (Incremental Static Regeneration) + on-demand revalidation**. Pola yang dipakai (lihat `app/actions/products.ts`, `articles.ts`, `leads.ts`, `supplier.ts`, `settings/actions.ts`):

1. Admin edit konten lewat panel `/admin/*` (misal edit produk).
2. Setelah tersimpan, sebuah **Next.js Server Action** dipanggil, misal:
   ```ts
   export async function revalidateProductRoutes(slug: string) {
     revalidatePath('/')
     revalidatePath('/produk')
     revalidatePath(`/produk/${slug}`)
     revalidatePath('/sitemap.xml')
   }
   ```
3. Ini langsung invalidate cache halaman terkait — pengunjung yang buka halaman itu berikutnya akan dapat versi terbaru, **tanpa perlu deploy ulang**.

Jadi: konten (artikel, produk, settings, dll) bisa diubah kapan saja lewat admin panel dan langsung tayang di publik dalam hitungan detik — beda dengan perubahan **kode/desain** yang tetap butuh proses deploy (push ke `main` → Vercel/Railway build ulang).

## 10. Checklist hal yang perlu saya (user) konfirmasi/cek manual

Ini daftar yang AI chat lain sebaiknya tanyakan/bimbing saya untuk cek, karena tidak bisa diverifikasi dari kode:
- [ ] Apakah domain `rekaciptaindonesia.com` sudah dibeli? Di registrar mana?
- [ ] Apakah project Vercel & Railway sudah benar-benar dibuat dan terhubung ke repo GitHub `jazilqtb/reka-cipta-webplatform`?
- [ ] Apakah semua env var di atas (poin 5 & 6) sudah diisi di dashboard masing-masing (bukan cuma di `.env.local.example`)?
- [ ] Apakah root directory Railway sudah di-set ke `/backend`?
- [ ] Apakah domain custom sudah ditambahkan di Vercel (Settings → Domains) dan DNS-nya sudah diarahkan?
- [ ] Apakah `ALLOWED_ORIGINS` di Railway sudah termasuk domain frontend yang benar (bukan cuma localhost)?
- [ ] Apakah sudah pernah setup Google Search Console untuk domain ini?

## 11. Daftar lengkap stack teknologi (untuk dokumentasi)

Diambil langsung dari `package.json` dan `backend/requirements.txt` saat ini, bukan asumsi.

**Frontend**
| Layer | Teknologi | Versi | Keterangan |
|---|---|---|---|
| Framework | Next.js | **16.2.6** (App Router) | ⚠️ `CLAUDE.md` project menyebut "Next.js 14" — kemungkinan dokumentasi belum diupdate setelah upgrade, `package.json` adalah sumber kebenaran |
| UI runtime | React | 19.2.4 | |
| Bahasa | TypeScript | ^5 | |
| Styling | Tailwind CSS | v4 | `tailwind.config.ts`/`globals.css` **FROZEN** (jangan diedit) |
| Komponen UI | shadcn/ui + Base UI, wrapper custom di `components/brand/` | | |
| Animasi | Framer Motion | ^12 | |
| Form | react-hook-form + zod + @hookform/resolvers | | |
| Rich text editor | Tiptap (react, starter-kit, extension-image/link) | ^3 | admin artikel |
| Drag & drop | @dnd-kit (core/sortable/utilities) | | CRM Kanban pipeline |
| Sanitasi HTML | isomorphic-dompurify | | render artikel aman dari XSS |
| Notifikasi UI | sonner | | toast |
| Tema | next-themes | | disiapkan, dark mode belum aktif v1 |
| Supabase client | @supabase/ssr + @supabase/supabase-js | 0.10.x / 2.107.x | |
| Error monitoring | @sentry/nextjs | ^10 | |
| Tanggal | date-fns | ^4 | |

**Backend**
| Layer | Teknologi | Versi | Keterangan |
|---|---|---|---|
| Framework | FastAPI | 0.136.3 | |
| Server | Uvicorn (+ uvloop, httptools) | 0.48.0 | dijalankan via `Procfile` |
| Bahasa | Python | required 3.11+; environment lokal saat ini 3.13.9 | |
| Validasi/schema | Pydantic v2 + pydantic-settings | | |
| Supabase client (Python) | supabase-py, postgrest, storage3, supabase-auth, realtime | 2.30.x | |
| Auth/JWT | python-jose, PyJWT, cryptography | | verifikasi token dari Supabase Auth |
| PDF generation | WeasyPrint | 69.0 | butuh system package cairo/pango — lihat `railpack.json` |
| Email | Resend SDK | | |
| AI | Anthropic SDK | 0.116.0 | AI Proposal Generator |
| Rate limiting | slowapi | | |
| Error monitoring | sentry-sdk | | |

**Database & infra layer**
- Supabase: managed PostgreSQL + Auth + Storage + Realtime, region Singapore, RLS aktif di semua tabel, 26 file migrasi.

**Hosting/platform**
- Vercel (frontend) — auto-deploy GitHub, preview per branch, image optimization & edge network bawaan.
- Railway (backend) — auto-deploy GitHub, root dir `/backend`, `railpack.json` untuk apt packages.
- GitHub `jazilqtb/reka-cipta-webplatform` — source of truth + trigger deploy (bukan GitHub Actions).

**Observability & layanan pihak ketiga**
- Sentry (error tracking frontend + backend), Resend (email transaksional), Anthropic API (AI).

**Dev tooling**
- ESLint 9, TypeScript 5, Supabase CLI ^2.105 (migration & schema diff).

## 12. Pertimbangan migrasi ke shared hosting atau VPS

Ringkasan dulu: **shared hosting classic (cPanel-style) hampir tidak realistis** untuk arsitektur project ini tanpa rombak besar. **VPS realistis secara teknis**, tapi menukar kemudahan managed platform dengan beban operasional sendiri.

### Kenapa shared hosting (cPanel dsb.) bermasalah
- Project ini pakai Next.js Server Components, Server Actions (`revalidatePath`), dan admin panel dinamis (`cache: 'no-store'`) — semua ini butuh proses Node.js yang terus hidup, bukan cuma file statis.
- Shared hosting umumnya cuma serve file statis atau PHP — tidak bisa menjalankan proses Node.js custom atau proses Python (FastAPI) long-running.
- Kalau dipaksa pakai `next export` (static export), yang **hilang**: ISR & `revalidatePath` (mekanisme "edit real-time" di poin 9), Server Actions, auth middleware admin, API routes dinamis.
- Kesimpulan: shared hosting classic bukan opsi realistis kecuali project di-redesign total jadi static-only — dan itu menghapus fitur inti (real-time edit, admin CRM, AI proposal generator).

### Kenapa VPS lebih realistis
- Next.js self-hosted (`next start` di VPS) **tetap mendukung ISR & `revalidatePath` secara native** — ini bukan fitur eksklusif Vercel, asal proses Node-nya terus berjalan.
- FastAPI + Uvicorn tinggal jalan sebagai proses biasa (persis yang Railway lakukan di baliknya), dikelola pakai systemd/pm2/supervisor untuk keep-alive & auto-restart.
- **Supabase tidak perlu ikut pindah** — ini managed service terpisah, cuma butuh koneksi network. Migrasi paling aman & minim-risiko: Vercel/Railway → VPS, Supabase tetap apa adanya.

### Yang hilang dari Vercel/Railway dan harus disiapkan manual di VPS
| Yang otomatis di Vercel/Railway | Perlu disiapkan manual di VPS |
|---|---|
| Auto HTTPS/TLS | nginx/caddy + certbot (Let's Encrypt) |
| Auto-deploy dari git push | CI/CD sendiri (GitHub Actions/webhook + script deploy) |
| Preview deployment per branch (dipakai untuk demo klien di branch `dev`, lihat poin 4) | Tidak ada bawaan — harus dibangun manual (mis. container terpisah per branch) |
| Image optimization otomatis (`next/image`) | Setup sendiri, atau nonaktifkan optimasi |
| Auto-scaling | Manual, atau load balancer + multi-VPS |
| Auto-restart kalau crash, monitoring | pm2/systemd + uptime monitoring sendiri |
| Apt packages WeasyPrint (`railpack.json`) | `apt install` manual di VPS |
| Isolasi staging vs production | 2 VPS terpisah, atau 1 VPS dengan port/subdomain berbeda |

### Faktor yang perlu dipertimbangkan sebelum memutuskan
1. **Biaya vs effort ops** — Vercel/Railway makin mahal seiring traffic naik, tapi "murah"-nya VPS semu kalau waktu maintain server (patch keamanan, perpanjang TLS, handle downtime) dihitung sebagai biaya.
2. **Siapa yang maintain** — tanpa waktu/skill DevOps rutin, VPS menambah risiko downtime tak tertangani dibanding platform managed.
3. **Kebutuhan preview branch untuk demo klien** — strategi branch project ini eksplisit pakai `dev` sebagai staging demo klien (poin 4); ini otomatis di Vercel tapi harus dibangun sendiri di VPS.
4. **Skala traffic saat ini** — kalau traffic masih kecil, biaya Vercel/Railway kemungkinan tetap lebih murah daripada waktu setup+maintain VPS. Migrasi umumnya baru masuk akal secara ekonomi di skala traffic yang lebih tinggi/predictable.
5. **Supabase independen** — apapun keputusannya, database tidak perlu ikut pindah; ini murni keputusan soal compute (frontend+backend), bukan database.

## 13. Apa yang saya ingin pelajari

Saya (pemilik project) belum paham sama sekali soal hosting/deployment, baik konsep dasarnya (apa itu domain, DNS, deploy, CI/CD, environment, dll) maupun cara menerapkannya. Tolong bimbing saya:
1. Mulai dari konsep dasar (apa itu hosting, domain vs DNS, apa bedanya deploy preview/staging/production, dll).
2. Kaitkan tiap konsep dengan kondisi nyata project ini di atas — bukan contoh generik.
3. Kalau ada langkah yang harus saya lakukan di dashboard (Vercel/Railway/registrar domain/Google Search Console), jelaskan step-by-step karena saya belum pernah melakukannya.
