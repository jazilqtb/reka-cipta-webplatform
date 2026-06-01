# E1-UX-04 — Wireframe Halaman 404

**Task:** E1-UX-04  
**Priority:** 🔵 LOW  
**Tags:** `Design` · `Frontend`  
**Versi:** 1.0 · Mei 2026  
**Referensi Brand:** Fondasi Brand v1.0 §4.2 (Tanggap) · §5.1 (Jelas sebelum terkesan pintar)

---

## Prinsip Brand yang Mendasari Desain

| Prinsip | Manifestasi di 404 |
|---|---|
| **Tanggap** | 404 bukan jalan buntu — satu klik kembali ke Beranda |
| **Jelas sebelum terkesan pintar** | Pesan error sederhana, Bahasa Indonesia, tidak ada jargon teknis |
| **Brand Consistency** | Visual treatment brand-consistent — bukan default browser atau Vercel default |
| **Caretaker Archetype** | Tone pesan helpful & empathetic — tidak menyalahkan user |

---

## 1. LAYOUT DESKTOP (viewport ≥ 1024px)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  [Navbar — sticky, dari root layout]                                             │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  [main — flex flex-col items-center justify-center min-h-[60vh]]                │
│  [bg-page = neutral-50]                                                          │
│                                                                                  │
│                                                                                  │
│                  ┌─────────────────────────────────────┐                        │
│                  │  flex flex-col items-center          │                        │
│                  │  text-center                         │                        │
│                  │  max-w-lg mx-auto px-6               │                        │
│                  │                                      │                        │
│                  │                                      │                        │
│                  │         ┌─────────────┐              │                        │
│                  │         │             │              │                        │
│                  │         │   [ILUSTRASI│              │                        │
│                  │         │   Sederhana]│              │                        │
│                  │         │             │              │                        │
│                  │         │  Garam yang │              │                        │
│                  │         │  tumpah /   │              │                        │
│                  │         │  karung     │              │                        │
│                  │         │  kosong     │              │                        │
│                  │         │  [SVG inline│              │                        │
│                  │         │   w-48 h-48]│              │                        │
│                  │         └─────────────┘              │                        │
│                  │                                      │                        │
│                  │         404                          │                        │
│                  │         [text-8xl font-bold          │                        │
│                  │          text-brand-teal-600         │                        │
│                  │          leading-none my-4]          │                        │
│                  │                                      │                        │
│                  │         Halaman Tidak Ditemukan      │                        │
│                  │         [text-2xl font-bold          │                        │
│                  │          text-ink-700 mb-3]          │                        │
│                  │                                      │                        │
│                  │         Halaman yang kamu cari       │                        │
│                  │         tidak ada atau sudah         │                        │
│                  │         dipindahkan. Coba kembali    │                        │
│                  │         ke beranda.                  │                        │
│                  │         [text-neutral-500 text-base  │                        │
│                  │          leading-relaxed mb-8]       │                        │
│                  │                                      │                        │
│                  │   ┌──────────────────────────────┐  │                        │
│                  │   │   ← Kembali ke Beranda        │  │                        │
│                  │   │   [Button primary, px-6 py-3] │  │                        │
│                  │   └──────────────────────────────┘  │                        │
│                  │                                      │                        │
│                  │   ──── atau cari yang kamu butuhkan ─│                        │
│                  │   [text-xs text-neutral-400 my-4]    │                        │
│                  │                                      │                        │
│                  │   ┌────────────┐  ┌───────────────┐ │                        │
│                  │   │  Produk    │  │  Kontak Kami  │ │                        │
│                  │   │  [ghost    │  │  [ghost       │ │                        │
│                  │   │   button]  │  │   button]     │ │                        │
│                  │   └────────────┘  └───────────────┘ │                        │
│                  │                                      │                        │
│                  └─────────────────────────────────────┘                        │
│                                                                                  │
│                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│  [Footer — dari root layout]                                                     │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. LAYOUT MOBILE (viewport < 768px)

```
┌──────────────────────────────────────────────┐
│  [Navbar]                                    │
├──────────────────────────────────────────────┤
│                                              │
│  [main — py-16 px-5]                        │
│  [flex flex-col items-center text-center]    │
│                                              │
│         ┌─────────────┐                     │
│         │  [ilustrasi │                     │
│         │   SVG       │                     │
│         │   w-32 h-32 │                     │
│         │   mx-auto]  │                     │
│         └─────────────┘                     │
│                                              │
│         404                                 │
│         [text-7xl font-bold                 │
│          text-brand-teal-600                │
│          leading-none my-3]                 │
│                                              │
│         Halaman Tidak Ditemukan             │
│         [text-xl font-bold text-ink-700     │
│          mb-2]                              │
│                                              │
│         Halaman yang kamu cari              │
│         tidak ada atau sudah dipindahkan.   │
│         [text-sm text-neutral-500           │
│          leading-relaxed mb-6]              │
│                                              │
│   ┌──────────────────────────────────────┐  │
│   │   ← Kembali ke Beranda               │  │
│   │   [Button primary full-width]        │  │
│   └──────────────────────────────────────┘  │
│                                              │
│   ─── atau cari yang kamu butuhkan ───      │
│   [text-xs text-neutral-400 my-3]           │
│                                              │
│   ┌─────────────────┐  ┌─────────────────┐  │
│   │  Lihat Produk   │  │  Kontak Kami    │  │
│   │  [ghost button] │  │  [ghost button] │  │
│   └─────────────────┘  └─────────────────┘  │
│                                              │
├──────────────────────────────────────────────┤
│  [Footer]                                   │
└──────────────────────────────────────────────┘
```

---

## 3. SPESIFIKASI DETAIL

### Page Container
```
NEXT.JS FILE: /app/not-found.tsx
HTTP STATUS: Otomatis 404 oleh Next.js (bukan 200)

OUTER:
  className: "flex flex-col items-center justify-center 
              min-h-[calc(100vh-64px-300px)]"  
  ← min-h diperhitungkan dari tinggi Navbar + Footer
  className tambah: "bg-neutral-50 py-16 px-4"

INNER CARD (konten terpusat):
  className: "flex flex-col items-center text-center 
              max-w-md mx-auto"
```

### Ilustrasi SVG
```
REKOMENDASI ILUSTRASI:
  Motif: Karung garam kosong atau kristal garam 
         yang jatuh berserakan — on-brand, unik, 
         tidak generic ("halaman hilang")
  
  Teknis:
    className: "w-44 h-44 mb-6 opacity-80"
    File: /public/illustrations/404-garam.svg
    
  Fallback jika ilustrasi belum tersedia:
    Gunakan emoji besar atau karakter sederhana
    className: "text-8xl mb-4"
    Text: "🧂"   ← salt shaker emoji

  Style SVG:
    - Warna dominan: brand-teal-100, brand-teal-200
    - Aksen: sand-300, sand-400
    - Tidak terlalu detailed — flat illustration style
```

### Kode Error "404"
```
<p className="text-8xl font-extrabold 
              text-brand-teal-600 
              leading-none 
              my-4
              tabular-nums
              select-none">
  404
</p>

Mobile: "text-7xl"
Catatan: angka 404 adalah focal point visual halaman
```

### Heading & Body Text
```
HEADING:
  <h1 className="text-2xl font-bold text-ink-700 mb-3">
    Halaman Tidak Ditemukan
  </h1>
  Mobile: "text-xl"

BODY TEXT:
  <p className="text-neutral-500 text-base leading-relaxed mb-8">
    Halaman yang kamu cari tidak ada atau sudah dipindahkan. 
    Coba kembali ke beranda atau pilih halaman di bawah.
  </p>
  Mobile: "text-sm mb-6"

TONE CHECK:
  ✅ "kamu" bukan "Anda" — casual but respectful
  ✅ Tidak ada jargon teknis ("server error", "path not found")
  ✅ Empathetic — menawarkan solusi, bukan hanya menyatakan error
  ✅ Bahasa Indonesia murni — sesuai §7.5 Fondasi Brand
```

### CTA Buttons
```
PRIMARY CTA — KEMBALI KE BERANDA:
  <Button asChild>
    <Link href="/">
      <ArrowLeftIcon className="w-4 h-4 mr-2" />
      Kembali ke Beranda
    </Link>
  </Button>
  className: "bg-brand-teal-600 hover:bg-brand-teal-500 
              text-white font-semibold 
              px-6 py-3 rounded-lg 
              text-sm"
  Mobile: "w-full justify-center"

SEPARATOR TEXT:
  <p className="text-xs text-neutral-400 my-4">
    atau cari yang kamu butuhkan
  </p>

SECONDARY CTAs — GHOST BUTTONS (berdampingan):
  Pilihan yang ditampilkan: "Lihat Produk" + "Kontak Kami"
  Alasan: Dua entry point paling relevan bagi visitor yang nyasar

  className each: "border border-neutral-300 
                   text-neutral-600 
                   hover:border-brand-teal-400 
                   hover:text-brand-teal-600
                   px-4 py-2 rounded-lg 
                   text-sm font-medium
                   transition-colors duration-150"

  Container: "flex gap-3"
  Mobile: "flex gap-2 w-full"
  Mobile each: "flex-1 justify-center"
```

---

## 4. VISUAL HIERARCHY

```
LEVEL 1 — Focal Point:
  Ilustrasi SVG (emosional, visual hook)

LEVEL 2 — Kode Error:
  "404" — besar, brand-teal-600
  Visitor langsung tahu: halaman tidak ada

LEVEL 3 — Penjelasan:
  Heading + body text — in plain Bahasa Indonesia
  
LEVEL 4 — Action:
  Primary CTA → kembali ke beranda
  Secondary CTAs → opsi alternatif

SPACING RHYTHM:
  SVG → mb-6
  404 → my-4
  Heading → mb-3
  Body → mb-8 (atau mb-6 mobile)
  Separator → my-4
```

---

## 5. METADATA & SEO

```
// Di /app/not-found.tsx

export const metadata = {
  title: 'Halaman Tidak Ditemukan — CV Reka Cipta Indonesia',
  description: 'Halaman yang kamu cari tidak ditemukan. Kembali ke beranda.',
  robots: 'noindex',   // Halaman 404 tidak perlu diindeks Google
}

// Next.js secara otomatis akan return HTTP 404 
// dari /app/not-found.tsx — tidak perlu config tambahan
```

---

## 6. ACCESSIBILITY

| Requirement | Implementasi |
|---|---|
| HTTP status | Next.js `not-found.tsx` otomatis return 404, bukan 200 |
| Heading H1 | "Halaman Tidak Ditemukan" = H1 pada halaman ini |
| CTA label | "Kembali ke Beranda" — deskriptif, bukan "Klik di sini" |
| Ilustrasi alt | `alt="Ilustrasi halaman tidak ditemukan"` atau `alt=""` jika dekoratif |
| Focus order | Ilustrasi → 404 text → Heading → Body → Primary CTA → Secondary CTAs |
| Keyboard | Semua buttons accessible via Tab dan Enter |

---

## 7. CATATAN IMPLEMENTASI

1. **Next.js convention:** `/app/not-found.tsx` — bukan `/app/404/page.tsx`
2. **Root layout wrap:** Navbar dan Footer otomatis tampil karena `/app/layout.tsx` wraps semua
3. **HTTP 404:** Next.js otomatis mengembalikan status 404 dari `not-found.tsx` — tidak perlu `notFound()` call di sini
4. **Ilustrasi:** Bisa dibuat setelah MVP — gunakan emoji 🧂 sebagai placeholder yang masih on-brand
5. **Brand tone:** Gunakan "kamu" (informal-friendly) sesuai tone website publik Reka Cipta

---

*Wireframe E1-UX-04 · CV Reka Cipta Indonesia · Mei 2026*
