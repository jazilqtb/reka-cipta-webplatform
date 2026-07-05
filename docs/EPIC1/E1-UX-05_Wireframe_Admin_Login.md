# E1-UX-05 — Wireframe Admin Login Page (`/admin/login`)

**Task:** E1-UX-05  
**Priority:** 🔴 HIGH  
**Tags:** `Design` · `Auth` · `Admin`  
**Versi:** 1.0 · Mei 2026  
**Referensi Brand:** Fondasi Brand v1.0 §4.2 (Transparan) · PRD §5.3 · E1-US-01, E1-US-02

---

## Prinsip Desain Halaman Login

> Halaman ini adalah **satu-satunya pintu masuk** ke Admin Panel.
> 
> Desain harus:
> 1. **Sederhana** — tidak ada distraksi, satu tujuan: masuk
> 2. **Aman** — tidak memberikan informasi berguna kepada penyerang
> 3. **Brand-consistent** — meski halaman internal, tetap mencerminkan identitas Reka Cipta
> 4. **Independent** — tidak menggunakan root layout publik (tanpa Navbar/Footer)

---

## 1. LAYOUT FULL — DESKTOP (viewport ≥ 1024px)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  [body / root div]                                                               │
│  [min-h-screen bg-ink-950]  ← #050F0E — paling gelap, serious tone             │
│  [flex items-center justify-center]                                              │
│                                                                                  │
│  ┌───────────────────────────────┐     ┌────────────────────────────────────┐   │
│  │  DECORATIVE PANEL (kiri)     │     │  LOGIN CARD (kanan)                │   │
│  │  [hidden lg:flex]            │     │                                    │   │
│  │  [w-1/2 h-screen]            │     │  [w-full max-w-md]                 │   │
│  │  [bg-ink-900 flex flex-col   │     │                                    │   │
│  │   items-center justify-center│     │  ┌──────────────────────────────┐  │   │
│  │   p-12]                      │     │  │  px-8 py-10                  │  │   │
│  │                               │     │  │                              │  │   │
│  │  ┌───────────────────────┐   │     │  │  ┌────────────────────────┐  │  │   │
│  │  │  🌿 REKA CIPTA        │   │     │  │  │  🌿 [logo]             │  │  │   │
│  │  │     INDONESIA         │   │     │  │  │  CV Reka Cipta Indonesia│  │  │   │
│  │  │  [logo putih, large]  │   │     │  │  │  [logo berwarna        │  │  │   │
│  │  │  w-20 h-20            │   │     │  │  │   text-white]          │  │  │   │
│  │  └───────────────────────┘   │     │  │  │  [mb-8 text-center]    │  │  │   │
│  │                               │     │  │  └────────────────────────┘  │  │   │
│  │  "Garam Lokal,               │     │  │                              │  │   │
│  │   Standar Industri."          │     │  │  Admin Panel                 │  │   │
│  │  [italic text-sand-400]       │     │  │  [text-xl font-bold         │  │   │
│  │                               │     │  │   text-white mb-1]          │  │   │
│  │  [decorative: abstract        │     │  │                              │  │   │
│  │   dots/wave pattern           │     │  │  Masukkan kredensial Anda    │  │   │
│  │   opacity-10 brand-teal]      │     │  │  untuk mengakses sistem.     │  │   │
│  │                               │     │  │  [text-sm text-neutral-400   │  │   │
│  │  ── Sistem Manajemen ──       │     │  │   mb-8]                     │  │   │
│  │  Leads & RFQ                  │     │  │                              │  │   │
│  │  Supplier                     │     │  │  ┌────────────────────────┐  │  │   │
│  │  Konten Website               │     │  │  │  EMAIL                 │  │  │   │
│  │  [text-xs text-ink-500        │     │  │  │  [label text-xs        │  │  │   │
│  │   space-y-1 mt-8]             │     │  │  │   text-neutral-400     │  │  │   │
│  │                               │     │  │  │   uppercase tracking]  │  │  │   │
│  └───────────────────────────────┘     │  │  │                        │  │  │   │
│                                        │  │  │  [input type="email"   │  │  │   │
│                                        │  │  │   bg-ink-800           │  │  │   │
│                                        │  │  │   border-ink-600       │  │  │   │
│                                        │  │  │   text-white           │  │  │   │
│                                        │  │  │   placeholder=         │  │  │   │
│                                        │  │  │   "admin@reka..."]     │  │  │   │
│                                        │  │  └────────────────────────┘  │  │   │
│                                        │  │                              │  │   │
│                                        │  │  ┌────────────────────────┐  │  │   │
│                                        │  │  │  PASSWORD              │  │  │   │
│                                        │  │  │  [label + input        │  │  │   │
│                                        │  │  │   type="password"      │  │  │   │
│                                        │  │  │   same styling]        │  │  │   │
│                                        │  │  └────────────────────────┘  │  │   │
│                                        │  │                              │  │   │
│                                        │  │  ┌────────────────────────┐  │  │   │
│                                        │  │  │  [MASUK]               │  │  │   │
│                                        │  │  │  full-width button     │  │  │   │
│                                        │  │  │  [bg-brand-teal-600]   │  │  │   │
│                                        │  │  │  [py-3 font-semibold]  │  │  │   │
│                                        │  │  └────────────────────────┘  │  │   │
│                                        │  │                              │  │   │
│                                        │  └──────────────────────────────┘  │   │
│                                        └────────────────────────────────────┘   │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. LAYOUT — MOBILE (viewport < 768px)

```
┌──────────────────────────────────────────────────┐
│  [min-h-screen bg-ink-950]                       │
│  [flex items-center justify-center p-5]          │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  w-full max-w-sm mx-auto                  │  │
│  │  bg-ink-900 rounded-2xl                   │  │
│  │  px-6 py-10                               │  │
│  │                                            │  │
│  │  ┌──────────────────────────────────────┐ │  │
│  │  │  🌿 [logo]                           │ │  │
│  │  │  CV Reka Cipta Indonesia             │ │  │
│  │  │  [text-center mb-6]                  │ │  │
│  │  └──────────────────────────────────────┘ │  │
│  │                                            │  │
│  │  Admin Panel                              │  │
│  │  [text-lg font-bold text-white mb-1]      │  │
│  │                                            │  │
│  │  Masukkan kredensial Anda.                │  │
│  │  [text-sm text-neutral-400 mb-6]          │  │
│  │                                            │  │
│  │  ┌──────────────────────────────────────┐ │  │
│  │  │  EMAIL                               │ │  │
│  │  │  [input email]                       │ │  │
│  │  └──────────────────────────────────────┘ │  │
│  │                                            │  │
│  │  ┌──────────────────────────────────────┐ │  │
│  │  │  PASSWORD                            │ │  │
│  │  │  [input password]                    │ │  │
│  │  └──────────────────────────────────────┘ │  │
│  │                                            │  │
│  │  ┌──────────────────────────────────────┐ │  │
│  │  │  MASUK (full-width)                  │ │  │
│  │  └──────────────────────────────────────┘ │  │
│  │                                            │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## 3. STATE: ERROR STATE

```
                             SETELAH SUBMIT GAGAL

┌──────────────────────────────────────────────────┐
│                                                  │
│  EMAIL                                           │
│  ┌────────────────────────────────────────────┐  │
│  │  admin@rekaciptaindonesia.com              │  │  ← email TETAP terisi
│  │  [border-border-default — tidak merah]     │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  PASSWORD                                        │
│  ┌────────────────────────────────────────────┐  │
│  │                                            │  │  ← password di-CLEAR
│  │  [border-border-default — tidak merah]     │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  ⚠ Kredensial tidak valid.                │  │  ← ERROR MESSAGE
│  │    Silakan coba lagi.                      │  │
│  │  [bg-danger-light border border-danger     │  │
│  │   rounded-lg px-4 py-3 text-sm            │  │
│  │   text-danger flex items-start gap-2]      │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  [MASUK] ← kembali aktif                   │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
└──────────────────────────────────────────────────┘

PENTING — SECURITY:
  - Pesan error IDENTIK untuk email salah vs password salah
  - TIDAK boleh: "Email tidak ditemukan" atau "Password salah"
  - HARUS: "Kredensial tidak valid. Silakan coba lagi."
  - Tidak ada petunjuk yang membantu penyerang
```

---

## 4. STATE: LOADING STATE (saat submit)

```
                          SAAT MENUNGGU RESPONSE API

┌──────────────────────────────────────────────────┐
│                                                  │
│  EMAIL                                           │
│  ┌────────────────────────────────────────────┐  │
│  │  admin@rekaciptaindonesia.com              │  │  ← disabled, opacity-50
│  └────────────────────────────────────────────┘  │
│                                                  │
│  PASSWORD                                        │
│  ┌────────────────────────────────────────────┐  │
│  │  ••••••••••••••                            │  │  ← disabled, opacity-50
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │   ⟳  Memeriksa...                          │  │  ← LOADING STATE
│  │  [bg-brand-teal-700 disabled cursor-wait]  │  │  ← button dinonaktifkan
│  └────────────────────────────────────────────┘  │
│                                                  │
└──────────────────────────────────────────────────┘

BUTTON LOADING:
  disabled={true}
  className: "opacity-70 cursor-not-allowed"
  Content: <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> Memeriksa...
```

---

## 5. SPESIFIKASI DETAIL

### Layout & Background
```
NEXT.JS FILE: 
  /app/admin/login/page.tsx     ← halaman login
  /app/admin/login/layout.tsx   ← layout TERSENDIRI (tanpa Navbar/Footer)

LAYOUT (admin/login/layout.tsx):
  <html>
    <body className="min-h-screen bg-ink-950">
      {children}
    </body>
  </html>

  Tidak import Navbar atau Footer
  Tidak menggunakan root /app/layout.tsx

WRAPPER:
  className: "min-h-screen bg-ink-950 
              flex items-center justify-center
              p-4"
```

### Decorative Panel (Desktop Only)
```
PANEL KIRI [hidden lg:flex]:
  className: "hidden lg:flex flex-col items-center justify-center 
              w-1/2 h-screen bg-ink-900 
              p-12 relative overflow-hidden"

  [LOGO BESAR]:
    className: "mb-8"
    <Image src="/logo-white.svg" alt="CV Reka Cipta Indonesia" 
           width={80} height={80} />

  [TAGLINE]:
    className: "text-sand-400 italic text-lg font-medium 
                text-center mb-10 leading-relaxed"
    Text: "Garam Lokal,\nStandar Industri."

  [FEATURE LIST] — apa yang bisa dikelola di panel ini:
    className: "space-y-2 text-center"
    Items (text-xs text-ink-400):
      • Leads & RFQ
      • Manajemen Supplier  
      • Konten Website
      • Laporan Aktivitas

  [DEKORATIF]:
    Dot grid pattern (dari globals.css — .dot-grid)
    className: "absolute inset-0 opacity-5 pointer-events-none"
```

### Login Card
```
CARD CONTAINER:
  Desktop: className: "w-full max-w-md bg-ink-900 rounded-2xl shadow-2xl"
  Mobile:  className: "w-full max-w-sm bg-ink-900 rounded-2xl shadow-2xl"

  INNER PADDING: "px-8 py-10" (desktop) / "px-6 py-8" (mobile)

LOGO (dalam card):
  className: "flex flex-col items-center mb-8"
  <Image src="/logo-teal.svg" alt="CV Reka Cipta Indonesia" 
         width={40} height={40} className="mb-2" />
  <span className="text-white font-bold text-sm tracking-tight">
    CV Reka Cipta Indonesia
  </span>

HEADING:
  <h1 className="text-xl font-bold text-white mb-1">
    Admin Panel
  </h1>
  Mobile: "text-lg"

SUBHEADING:
  <p className="text-sm text-neutral-400 mb-8">
    Masukkan kredensial Anda untuk mengakses sistem.
  </p>
```

### Form Fields
```
FORM TAG: Gunakan <form onSubmit={handleSubmit(onSubmit)}> 
          (react-hook-form) atau <form action={...} (Server Actions)

FIELD WRAPPER (per field):
  className: "space-y-1.5 mb-5"

LABEL:
  className: "block text-xs font-semibold text-neutral-400 
              uppercase tracking-widest"

INPUT DEFAULT:
  className: "w-full px-4 py-3 rounded-lg 
              bg-ink-800 border border-ink-600 
              text-white text-sm 
              placeholder:text-ink-400
              focus:outline-none 
              focus:border-brand-teal-500 
              focus:ring-1 focus:ring-brand-teal-500
              transition-colors duration-150"

INPUT ERROR STATE:
  className: "... border-danger-600 focus:border-danger-600 
              focus:ring-danger-600"
  ← tidak dipakai di halaman ini (error tidak per-field)
  ← semua field tetap neutral saat error (security by design)

EMAIL FIELD:
  type="email"
  name="email"
  autoComplete="email"
  placeholder="admin@rekaciptaindonesia.com"

PASSWORD FIELD:
  type="password"
  name="password"  
  autoComplete="current-password"
  placeholder="••••••••"
```

### Submit Button
```
BUTTON — DEFAULT STATE:
  className: "w-full bg-brand-teal-600 hover:bg-brand-teal-500
              text-white font-semibold 
              py-3 px-4 rounded-lg
              text-sm
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-brand-teal-400 
              focus:ring-offset-2 focus:ring-offset-ink-900"
  Text: "Masuk"

BUTTON — LOADING STATE:
  disabled={true}
  className: "... opacity-70 cursor-not-allowed"
  Content:
    <Loader2Icon className="w-4 h-4 mr-2 animate-spin inline" />
    Memeriksa...

BUTTON — SETELAH ERROR:
  disabled={false}  ← kembali aktif
  Text: kembali "Masuk"
```

### Error Message Block
```
ERROR CONTAINER (hanya muncul saat ada error):
  <div role="alert" className="flex items-start gap-2 
                                bg-red-950 border border-red-800
                                rounded-lg px-4 py-3 mb-4">
    <ExclamationTriangleIcon className="w-4 h-4 text-red-400 
                                         flex-shrink-0 mt-0.5" />
    <p className="text-sm text-red-300">
      Kredensial tidak valid. Silakan coba lagi.
    </p>
  </div>

ACCESSIBILITY:
  role="alert" — screen reader mengumumkan error secara otomatis
  aria-live="polite" pada container atau gunakan role="alert"
```

### Security Constraints
```
TIDAK ADA:
  ✗ Link "Lupa Password"
  ✗ Link "Daftar Akun"
  ✗ Link ke halaman publik
  ✗ Informasi apapun di luar form (tidak ada footer, tidak ada nav)
  ✗ Pesan error yang membedakan email vs password

ADA:
  ✓ Rate limiting di backend (E1-ENG-39): max 5 request/menit per IP
  ✓ Error message generic
  ✓ Loading state mencegah double-submit
  ✓ httpOnly cookie (dikelola Supabase Auth)
```

---

## 6. STATE FLOW DIAGRAM

```
  [Buka /admin/login]
          │
          ▼
  ┌────────────────┐
  │  DEFAULT STATE  │
  │  Form kosong    │
  │  Button "Masuk" │
  └───────┬────────┘
          │ Isi email + password → klik Masuk
          ▼
  ┌────────────────┐
  │  LOADING STATE  │
  │  Button disabled│
  │  "Memeriksa..." │
  └───────┬────────┘
          │
    ┌─────┴──────┐
    ▼            ▼
  Sukses       Gagal
    │            │
    ▼            ▼
  redirect    ┌─────────────────┐
  /admin/     │   ERROR STATE    │
  dashboard   │  Pesan generic   │
              │  Email tetap isi │
              │  Password clear  │
              │  Button aktif    │
              └────────┬────────┘
                       │ Coba lagi
                       ▼
               [LOADING STATE] → ...

  [Setelah 5x gagal dalam 1 menit]
  → Backend return 429
  → Error message: "Terlalu banyak percobaan. 
                    Coba lagi dalam 1 menit."
```

---

## 7. CATATAN IMPLEMENTASI

1. **File structure:**
   - `/app/admin/login/page.tsx` — `'use client'` (react-hook-form + state)
   - `/app/admin/login/layout.tsx` — layout terpisah tanpa Navbar/Footer
2. **Auth method:** `supabase.auth.signInWithPassword({ email, password })`
3. **Success redirect:** `router.push('/admin/dashboard')` via `next/navigation`
4. **Form library:** react-hook-form + zod schema validation
5. **Dark mode vars:** Halaman ini sudah inherently dark — tidak butuh `.dark` class toggle
6. **Brand note:** Meski halaman internal, logo dan brand color tetap hadir = konsistensi merek

---

*Wireframe E1-UX-05 · CV Reka Cipta Indonesia · Mei 2026*
