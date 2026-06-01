# E1-UX-02 — Wireframe Global Navbar (Desktop + Mobile)

**Task:** E1-UX-02  
**Priority:** 🔴 HIGH  
**Tags:** `Design` · `Frontend`  
**Versi:** 1.0 · Mei 2026  
**Referensi Brand:** Fondasi Brand v1.0 §4 (Caretaker + Sage archetype) · PRD §5.1

---

## Prinsip Brand yang Mendasari Desain

| Prinsip | Manifestasi di Navbar |
|---|---|
| **Transparan & Trustworthy** | Logo + nama perusahaan jelas di kiri — visitor tahu langsung mereka di mana |
| **Tanggap (Responsive)** | CTA "Minta Penawaran" selalu visible dan accessible — tidak perlu scroll |
| **Caretaker Archetype** | Navigasi tidak birokratis: 7 item tertata rapi, label deskriptif bukan kode internal |
| **B2B Profesional** | Tidak ada ikon media sosial atau notifikasi — navbar fokus pada journey pengunjung industri |

---

## 1. DESKTOP NAVBAR (viewport ≥ 1024px)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  [sticky top-0 z-50 bg-white border-b border-neutral-200]                        │
│  [transition-shadow duration-200] → [shadow-sm ketika scrollY > 10]             │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  max-w-7xl mx-auto px-6 h-16 flex items-center justify-between            │  │
│  │                                                                            │  │
│  │  [KIRI — Logo Block]              [TENGAH — Nav Links]    [KANAN — CTA]   │  │
│  │                                                                            │  │
│  │  ┌─────────────────────┐          ┌─────────────────────┐  ┌───────────┐  │  │
│  │  │ 🌿 REKA CIPTA       │          │ Beranda              │  │  Minta    │  │  │
│  │  │    INDONESIA        │          │ Produk               │  │ Penawaran │  │  │
│  │  │                     │          │ Tentang Kami         │  │           │  │  │
│  │  │ [logo next/image]   │          │ Artikel              │  │ [Button   │  │  │
│  │  │ h-8 w-auto          │          │ Kalkulator           │  │  primary] │  │  │
│  │  │                     │          │ Jadi Supplier        │  │           │  │  │
│  │  └─────────────────────┘          └─────────────────────┘  └───────────┘  │  │
│  │                                                                            │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Spesifikasi Detail — Desktop

```
CONTAINER
  className: "sticky top-0 z-50 bg-white border-b border-neutral-200 transition-shadow duration-200"
  scroll-state: className tambah "shadow-sm" ketika scrollY > 10 (via useScrollY hook)

INNER WRAPPER
  className: "max-w-7xl mx-auto px-6"
  className: "h-16 flex items-center justify-between"

───────────────────────────────────────────────────────────
LOGO BLOCK (kiri)
───────────────────────────────────────────────────────────
<Link href="/">
  <div className="flex items-center gap-2.5">
    <Image
      src="/logo.svg"
      alt="CV Reka Cipta Indonesia"
      width={32}
      height={32}
    />
    <div className="flex flex-col leading-none">
      <span className="text-sm font-bold text-ink-700 tracking-tight">
        Reka Cipta
      </span>
      <span className="text-[10px] font-medium text-brand-teal-600 tracking-widest uppercase">
        Indonesia
      </span>
    </div>
  </div>
</Link>

───────────────────────────────────────────────────────────
NAV LINKS (tengah) — hidden di mobile, flex di md+
───────────────────────────────────────────────────────────
<nav aria-label="Navigasi utama">
  <ul className="hidden md:flex items-center gap-1">
    {/* Map dari /constants/navigation.ts */}

    ITEM DEFAULT:
      className: "text-sm font-medium text-neutral-600 
                  hover:text-ink-700 
                  px-3 py-2 rounded-md 
                  transition-colors duration-150"

    ITEM ACTIVE (detect via usePathname()):
      className: "text-sm font-medium text-brand-teal-600 
                  px-3 py-2 rounded-md 
                  bg-brand-teal-50"
      → border-bottom tambahan:
        "relative after:absolute after:bottom-0 after:left-3 after:right-3 
         after:h-0.5 after:bg-brand-teal-600 after:rounded-full"

    HOVER STATE:
      transition: color 150ms ease
      color: text-ink-700 (#173F3A)
      TIDAK ada underline default — hanya color shift

  </ul>
</nav>

NAV ITEMS (urutan dari kiri ke kanan):
  1. Beranda       → href: "/"
  2. Produk        → href: "/produk"
  3. Tentang Kami  → href: "/tentang-kami"
  4. Artikel       → href: "/artikel"
  5. Kalkulator    → href: "/kalkulator"
  6. Jadi Supplier → href: "/jadi-supplier"

───────────────────────────────────────────────────────────
CTA BUTTON (kanan)
───────────────────────────────────────────────────────────
<Button asChild>
  <Link href="/minta-penawaran">
    Minta Penawaran
  </Link>
</Button>

Styling:
  className: "bg-brand-teal-600 hover:bg-brand-teal-500 
              text-white font-semibold 
              text-sm px-4 py-2 
              rounded-lg
              transition-colors duration-150
              shadow-sm hover:shadow-md"

Catatan brand: "Minta Penawaran" bukan "Hubungi Kami" — 
language yang action-oriented dan low-friction sesuai 
filosofi CTA §7.3 (Fondasi Brand)
```

---

## 2. MOBILE NAVBAR — Closed State (viewport < 768px)

```
┌──────────────────────────────────────────────────────────┐
│  [sticky top-0 z-50 bg-white border-b border-neutral-200] │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  px-4 h-14 flex items-center justify-between    │   │
│  │                                                  │   │
│  │  ┌──────────────────┐          ┌───────────────┐ │   │
│  │  │ 🌿 Reka Cipta    │          │  ☰ (Buka menu)│ │   │
│  │  │    Indonesia     │          │ [hamburger btn]│ │   │
│  │  │ [logo + wordmark]│          │ w-10 h-10     │ │   │
│  │  └──────────────────┘          └───────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [Semua nav links TERSEMBUNYI — tidak di DOM saat closed] │
└──────────────────────────────────────────────────────────┘
```

### Spesifikasi Hamburger Button

```
HAMBURGER BUTTON:
  <button
    onClick={() => setIsOpen(true)}
    aria-label="Buka menu"          ← WAJIB untuk aksesibilitas
    aria-expanded={isOpen}          ← state announcement ke screen reader
    aria-controls="mobile-menu"
    className="md:hidden 
               w-10 h-10 
               flex items-center justify-center 
               rounded-lg
               text-neutral-700 
               hover:text-ink-700 
               hover:bg-neutral-100
               transition-colors duration-150
               focus:outline-none focus:ring-2 focus:ring-brand-teal-600"
  >
    {isOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
  </button>

Saat menu OPEN: icon berubah ☰ → ✕ (tanpa animasi kompleks)
```

---

## 3. MOBILE NAVBAR — Open State (drawer/dropdown)

```
┌──────────────────────────────────────────────────────────┐
│  [sticky top-0 z-50 bg-white border-b border-neutral-200] │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  px-4 h-14 flex items-center justify-between    │   │
│  │  🌿 Reka Cipta Indonesia          ✕ (Tutup menu) │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  id="mobile-menu"                                │   │
│  │  [border-t border-neutral-100 bg-white]          │   │
│  │  [py-3 px-4 flex flex-col gap-1]                 │   │
│  │                                                  │   │
│  │  ┌──────────────────────────────────────────┐   │   │
│  │  │  Beranda                                 │   │   │
│  │  │  [py-3 px-3 text-sm font-medium rounded] │   │   │
│  │  ├──────────────────────────────────────────┤   │   │
│  │  │  Produk                                  │   │   │
│  │  ├──────────────────────────────────────────┤   │   │
│  │  │  Tentang Kami                            │   │   │
│  │  ├──────────────────────────────────────────┤   │   │
│  │  │  Artikel                                 │   │   │
│  │  ├──────────────────────────────────────────┤   │   │
│  │  │  Kalkulator                              │   │   │
│  │  ├──────────────────────────────────────────┤   │   │
│  │  │  Jadi Supplier                           │   │   │
│  │  ├──────────────────────────────────────────┤   │   │
│  │  │                                          │   │   │
│  │  │  [MINTA PENAWARAN]  ← full-width button  │   │   │
│  │  │  [bg-brand-teal-600 text-white]          │   │   │
│  │  │  [mt-2 rounded-lg py-3 font-semibold]    │   │   │
│  │  │                                          │   │   │
│  │  └──────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### Spesifikasi Mobile Menu Open State

```
MOBILE MENU CONTAINER:
  id="mobile-menu"
  className: "md:hidden border-t border-neutral-100 
              bg-white py-3 px-4 flex flex-col gap-1
              animate-in slide-in-from-top-2 duration-200"
  role="menu"

MOBILE NAV ITEM DEFAULT:
  className: "text-sm font-medium text-neutral-700 
              px-3 py-3 
              rounded-lg 
              hover:bg-neutral-50 hover:text-ink-700
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-brand-teal-600"
  onClick: () => setIsOpen(false)   ← tutup menu setelah navigate

MOBILE NAV ITEM ACTIVE:
  className: "text-sm font-medium text-brand-teal-600 
              px-3 py-3 
              rounded-lg 
              bg-brand-teal-50"

MOBILE CTA BUTTON (bawah, full-width):
  className: "mt-2 w-full 
              bg-brand-teal-600 hover:bg-brand-teal-500
              text-white font-semibold 
              text-sm py-3 
              rounded-lg
              transition-colors duration-150"
  onClick: () => { router.push('/minta-penawaran'); setIsOpen(false) }

CLOSE ON OUTSIDE CLICK:
  useEffect(() => {
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
```

---

## 4. STATE DIAGRAM

```
                    ┌────────────────┐
                    │  DEFAULT STATE  │
                    │  scrollY ≤ 10  │
                    │  no shadow     │
                    └───────┬────────┘
                            │ scrollY > 10
                            ▼
                    ┌────────────────┐
                    │  SCROLLED STATE │
                    │  + shadow-sm   │
                    │  transition    │
                    └───────┬────────┘
                            │ scrollY ≤ 10
                            ▲ (kembali ke DEFAULT)

MOBILE MENU:

  [☰ icon]
      │ onClick
      ▼
  [OPEN STATE — drawer visible]
      │
      ├─ onClick nav item → navigate + close
      ├─ onClick CTA → navigate + close
      ├─ onClick outside → close
      └─ onClick ✕ → close
```

---

## 5. KONSTANTA NAVIGASI (`/constants/navigation.ts`)

```typescript
// /constants/navigation.ts

export interface NavItem {
  label: string
  href: string
  isExternal?: boolean
  isCTA?: boolean     // khusus untuk "Minta Penawaran" di desktop
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Beranda',       href: '/' },
  { label: 'Produk',        href: '/produk' },
  { label: 'Tentang Kami',  href: '/tentang-kami' },
  { label: 'Artikel',       href: '/artikel' },
  { label: 'Kalkulator',    href: '/kalkulator' },
  { label: 'Jadi Supplier', href: '/jadi-supplier' },
]

// Item CTA dipisah — di desktop jadi button, di mobile jadi baris terakhir menu
export const NAV_CTA: NavItem = {
  label: 'Minta Penawaran',
  href: '/minta-penawaran',
  isCTA: true,
}
```

---

## 6. ACCESSIBILITY CHECKLIST

| Requirement | Implementasi |
|---|---|
| Nav landmark | `<nav aria-label="Navigasi utama">` |
| Hamburger label | `aria-label="Buka menu"` / `aria-label="Tutup menu"` |
| Expanded state | `aria-expanded={isOpen}` pada button |
| Menu control | `aria-controls="mobile-menu"` |
| Focus ring | `focus:outline-none focus:ring-2 focus:ring-brand-teal-600` |
| Keyboard nav | Semua item accessible via Tab, hamburger via Enter/Space |
| Active indicator | Bukan hanya warna — ada background bg-brand-teal-50 (contrast) |
| Skip link | `<a href="#main-content">Langsung ke konten</a>` (dipasang di root layout) |

---

## 7. CATATAN IMPLEMENTASI

1. **Component location:** `/components/layout/Navbar.tsx`
2. **Directive:** `'use client'` — diperlukan untuk `useState`, `usePathname`, `useScrollY`
3. **Logo asset:** Simpan di `/public/logo.svg` dan `/public/logo-mark.svg` (icon-only untuk favicon)
4. **Font consistency:** Gunakan `Plus Jakarta Sans` sesuai `globals.css` — bukan Inter default Next.js
5. **Brand alignment:** CTA "Minta Penawaran" = low-friction entry point sesuai §7.3 Fondasi Brand
6. **Mobile priority:** Desain mobile-first — navbar mobile dikerjakan dulu, desktop sebagai enhancement

---

*Wireframe E1-UX-02 · CV Reka Cipta Indonesia · Mei 2026*
