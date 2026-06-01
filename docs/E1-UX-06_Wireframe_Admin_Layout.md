# E1-UX-06 — Wireframe Admin Layout (Sidebar + Header + Content Area)

**Task:** E1-UX-06  
**Priority:** 🔴 HIGH  
**Tags:** `Design` · `Admin`  
**Versi:** 1.0 · Mei 2026  
**Referensi Brand:** Fondasi Brand v1.0 §3.4 (Bukan birokratis) · PRD §5.3 · E1-US-09

---

## Prinsip Desain Admin Layout

> Admin panel adalah alat kerja harian tim Reka Cipta (2 orang, non-teknis).
> 
> Desain harus:
> 1. **Sesederhana mungkin** — dikerjakan dari smartphone pun harus bisa
> 2. **Orientasi task, bukan fitur** — navigasi mencerminkan apa yang dilakukan, bukan arsitektur sistem
> 3. **Feedback cepat** — status selalu jelas, tidak ada ambiguitas
> 4. **Brand-consistent** — dark sidebar mencerminkan profesionalisme merek

---

## 1. LAYOUT DESKTOP PENUH (viewport ≥ 1024px)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  [flex h-screen overflow-hidden bg-neutral-50]                                       │
│                                                                                      │
│  ┌──────────────────────┐  ┌────────────────────────────────────────────────────┐   │
│  │  SIDEBAR             │  │  MAIN AREA                                         │   │
│  │  w-60 = 240px        │  │  flex-1 flex flex-col                              │   │
│  │  flex-shrink-0       │  │  overflow-hidden                                   │   │
│  │  flex flex-col       │  │                                                    │   │
│  │  bg-ink-900 h-screen │  │  ┌────────────────────────────────────────────┐   │   │
│  │  fixed left-0 top-0  │  │  │  HEADER                                    │   │   │
│  │                      │  │  │  [bg-white border-b border-neutral-200]    │   │   │
│  │  ┌──────────────────┐│  │  │  [h-16 px-6 flex items-center justify-    │   │   │
│  │  │  LOGO AREA       ││  │  │   between flex-shrink-0]                  │   │   │
│  │  │  [px-5 py-5      ││  │  │                                            │   │   │
│  │  │   border-b       ││  │  │  [KIRI]                    [KANAN]         │   │   │
│  │  │   border-ink-800]││  │  │  ┌──────────────────┐  ┌────────────────┐ │   │   │
│  │  │                  ││  │  │  │ Dashboard        │  │  [user avatar] │ │   │   │
│  │  │  🌿 Reka Cipta   ││  │  │  │ [h1 text-xl      │  │  [email abbrev]│ │   │   │
│  │  │     Indonesia    ││  │  │  │  font-bold        │  │  [dropdown ▼] │ │   │   │
│  │  │  [logo putih]    ││  │  │  │  text-ink-700]    │  │               │ │   │   │
│  │  └──────────────────┘│  │  │  │                  │  └────────────────┘ │   │   │
│  │                      │  │  │  │  [breadcrumb     │                     │   │   │
│  │  ┌──────────────────┐│  │  │  │   opsional, xs   │                     │   │   │
│  │  │  NAV MENU        ││  │  │  │   text-neutral-4]│                     │   │   │
│  │  │  [flex-1         ││  │  │  └──────────────────┘                     │   │   │
│  │  │   overflow-y-auto││  │  └────────────────────────────────────────────┘   │   │
│  │  │   py-4]          ││  │                                                    │   │
│  │  │                  ││  │  ┌────────────────────────────────────────────┐   │   │
│  │  │  ● Dashboard     ││  │  │  CONTENT AREA                              │   │   │
│  │  │  ○ Leads & RFQ   ││  │  │  [flex-1 overflow-y-auto]                 │   │   │
│  │  │  ○ Supplier      ││  │  │  [p-6]                                     │   │   │
│  │  │  ○ Artikel       ││  │  │                                            │   │   │
│  │  │  ○ Produk        ││  │  │  ┌──────────────────────────────────────┐ │   │   │
│  │  │  ○ Pengaturan    ││  │  │  │                                      │ │   │   │
│  │  └──────────────────┘│  │  │  │  {children}                          │ │   │   │
│  │                      │  │  │  │                                      │ │   │   │
│  │  ┌──────────────────┐│  │  │  │  (placeholder: Dashboard, Leads,     │ │   │   │
│  │  │  USER AREA       ││  │  │  │   Supplier, dst)                     │ │   │   │
│  │  │  [px-4 py-4      ││  │  │  │                                      │ │   │   │
│  │  │   border-t       ││  │  │  └──────────────────────────────────────┘ │   │   │
│  │  │   border-ink-800]││  │  └────────────────────────────────────────────┘   │   │
│  │  │                  ││  └────────────────────────────────────────────────┘   │
│  │  │  irwan@reka...   ││                                                        │
│  │  │  [text-xs        ││                                                        │
│  │  │   text-neutral-5]││                                                        │
│  │  │  [LOGOUT]        ││                                                        │
│  │  └──────────────────┘│                                                        │
│  └──────────────────────┘                                                         │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. SPESIFIKASI SIDEBAR (240px)

### Container Sidebar
```
SIDEBAR:
  className: "w-60 flex-shrink-0 
              flex flex-col 
              bg-ink-900 
              h-screen fixed left-0 top-0 
              z-40"

  ← fixed + z-40 agar tidak tergeser saat content scroll
  ← Pertimbangan: bisa juga sticky tapi fixed lebih predictable
```

### Logo Area (bagian atas sidebar)
```
LOGO AREA:
  className: "px-5 py-5 
              border-b border-ink-800 
              flex-shrink-0"

  <Link href="/admin/dashboard" className="flex items-center gap-2.5">
    <Image src="/logo-mark-white.svg" 
           alt="Reka Cipta Indonesia"
           width={28} height={28} />
    <div>
      <p className="text-white font-bold text-sm leading-none">
        Reka Cipta
      </p>
      <p className="text-brand-teal-500 text-[10px] 
                    uppercase tracking-widest mt-0.5">
        Admin Panel
      </p>
    </div>
  </Link>
```

### Nav Menu (bagian tengah sidebar — scrollable)
```
NAV MENU CONTAINER:
  className: "flex-1 overflow-y-auto py-4 px-3"
  → flex-1 agar mendorong user area ke bawah
  → overflow-y-auto untuk jaga-jaga jika item bertambah

SECTION LABEL (opsional, untuk grouping kelak):
  className: "text-xs font-semibold text-ink-500 
              uppercase tracking-widest 
              px-3 mb-2 mt-4 first:mt-0"
  Text: "Menu Utama"

NAV ITEM DEFAULT:
  className: "flex items-center gap-3 
              px-3 py-2.5 rounded-lg 
              text-sm font-medium text-neutral-400 
              hover:bg-ink-800 hover:text-neutral-200 
              transition-colors duration-150 
              mb-0.5 w-full"

NAV ITEM ACTIVE (detect via usePathname()):
  className: "flex items-center gap-3 
              px-3 py-2.5 rounded-lg 
              text-sm font-medium 
              bg-brand-teal-900 text-brand-teal-300 
              border-l-2 border-brand-teal-500
              mb-0.5 w-full"
  aria-current="page"

IKON:
  Semua icon: Heroicons 20px (solid untuk active, outline untuk default)
  className: "w-4 h-4 flex-shrink-0"

NAV ITEM BADGE (untuk leads baru — future):
  <span className="ml-auto text-xs font-medium 
                   bg-brand-teal-600 text-white 
                   px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
    3
  </span>
```

### Nav Menu Items
```
DAFTAR ITEM (urutan & ikon):

  1. Dashboard
     Icon: HomeIcon (Heroicons)
     href: /admin/dashboard
     
  2. Leads & RFQ
     Icon: InboxArrowDownIcon
     href: /admin/leads
     Badge: jumlah lead baru (implementasi di epic selanjutnya)
     
  3. Supplier
     Icon: UsersIcon
     href: /admin/supplier
     
  4. Artikel
     Icon: DocumentTextIcon
     href: /admin/articles
     
  5. Produk
     Icon: CubeIcon
     href: /admin/products
     
  6. Pengaturan
     Icon: Cog6ToothIcon
     href: /admin/settings
     Posisi: paling bawah list (bisa dipisah dengan spacer)

ACTIVE STATE LOGIC (usePathname):
  "/admin/dashboard"  → Dashboard active
  "/admin/leads"      → Leads & RFQ active
  "/admin/leads/123"  → Leads & RFQ active (startsWith match)
  dst.
```

### User Area (bagian bawah sidebar)
```
USER AREA:
  className: "flex-shrink-0 
              border-t border-ink-800 
              px-4 py-4"

  <div className="flex items-center gap-3 mb-3">
    
    AVATAR (inisial):
      className: "w-8 h-8 rounded-full 
                  bg-brand-teal-700 
                  flex items-center justify-center 
                  text-xs font-bold text-white 
                  flex-shrink-0"
      Content: inisial dari email (misal "IR" dari irwan@...)

    EMAIL DISPLAY:
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-neutral-300 
                      truncate">
          {user.email}
        </p>
        <p className="text-[10px] text-neutral-500">
          Administrator
        </p>
      </div>
  </div>

  LOGOUT BUTTON:
    className: "w-full flex items-center gap-2 
                px-3 py-2 rounded-lg 
                text-sm text-neutral-400 
                hover:bg-red-950 hover:text-red-300 
                transition-colors duration-150"
    Icon: ArrowRightOnRectangleIcon className="w-4 h-4"
    Text: "Keluar"
    onClick: async () => {
      await supabase.auth.signOut()
      router.push('/admin/login')
    }
```

---

## 3. SPESIFIKASI HEADER (top bar)

```
HEADER CONTAINER:
  className: "bg-white border-b border-neutral-200 
              h-16 px-6 
              flex items-center justify-between 
              flex-shrink-0"

KIRI — JUDUL HALAMAN:
  Props yang diterima dari page: { title: string, breadcrumb?: BreadcrumbItem[] }

  <div>
    <h1 className="text-xl font-bold text-ink-700 leading-none">
      {title}
    </h1>
    
    {breadcrumb && (
      <nav aria-label="Breadcrumb" className="mt-1">
        <ol className="flex items-center gap-1.5">
          {breadcrumb.map((item, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRightIcon className="w-3 h-3 text-neutral-400" />}
              {item.href ? (
                <Link href={item.href} 
                      className="text-xs text-neutral-400 hover:text-neutral-600">
                  {item.label}
                </Link>
              ) : (
                <span className="text-xs text-neutral-500">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    )}
  </div>

KANAN — USER QUICK ACCESS (opsional di v1):
  Cukup tampilkan email singkat atau avatar saja
  Dropdown dengan opsi Logout bisa ditambahkan di v2
  Untuk v1: cukup teks email truncated di header kanan

  className: "text-xs text-neutral-400 truncate max-w-[150px]"
  Text: {user.email}
```

---

## 4. SPESIFIKASI CONTENT AREA

```
CONTENT AREA:
  className: "flex-1 overflow-y-auto"
  → overflow-y-auto agar konten panjang bisa scroll
  → flex-1 mengisi sisa ruang setelah header

INNER PADDING:
  className: "p-6"
  Mobile: "p-4"
  Konsisten di SEMUA halaman admin — tidak boleh berbeda-beda per halaman

PAGE CONTENT PATTERN:
  Setiap halaman admin mengeluarkan struktur yang konsisten:

  ┌──────────────────────────────────────────────────────┐
  │  [HEADER BAGIAN KONTEN — opsional per halaman]      │
  │  <div className="flex items-center justify-between   │
  │                  mb-6">                              │
  │    <h2>Sub-judul (jika ada)</h2>                    │
  │    <Button>Aksi Utama</Button>                       │
  │  </div>                                              │
  │                                                      │
  │  [MAIN CONTENT]                                      │
  │  Card, Table, Form, etc.                             │
  └──────────────────────────────────────────────────────┘
```

---

## 5. LAYOUT DIAGRAM — KOMPONEN

```
/app/admin/layout.tsx (Server Component)
│
├── Reads session from Supabase server client
├── If no user → redirect('/admin/login')
│
└── Returns:
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      │
      ├── <AdminSidebar user={user} />   ← 'use client'
      │     ├── Logo area
      │     ├── Nav menu (usePathname for active)
      │     └── User area (signOut handler)
      │
      └── <main className="flex-1 flex flex-col overflow-hidden ml-60">
            │
            ├── <AdminHeader title={...} breadcrumb={...} />  ← Server Component
            │     ├── Page title (H1)
            │     └── Optional breadcrumb
            │
            └── <div className="flex-1 overflow-y-auto p-6">
                  {children}   ← konten per halaman
                </div>
```

---

## 6. PLACEHOLDER — DASHBOARD PAGE

```
UNTUK E1-ENG-32 (dashboard placeholder):

/app/admin/dashboard/page.tsx
→ Render AdminHeader dengan title="Dashboard"
→ Konten placeholder:

  <div className="max-w-4xl">
    <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
      
      <div className="w-12 h-12 bg-brand-teal-50 rounded-xl 
                      flex items-center justify-center mx-auto mb-4">
        <RocketLaunchIcon className="w-6 h-6 text-brand-teal-600" />
      </div>
      
      <h2 className="text-lg font-semibold text-ink-700 mb-2">
        Dashboard
      </h2>
      
      <p className="text-sm text-neutral-500 max-w-sm mx-auto">
        Fitur dashboard sedang dalam pengembangan. 
        Di sini akan ditampilkan ringkasan leads, 
        status pipeline, dan aktivitas terbaru.
      </p>
      
      <p className="text-xs text-neutral-400 mt-4">
        Login sebagai: {user.email}
      </p>
      
    </div>
  </div>
```

---

## 7. MOBILE CONSIDERATION (v1 → v2)

```
KEPUTUSAN v1:
  Mobile sidebar: SKIP untuk v1 (catat sebagai v2 improvement)
  
  Alasan:
  - Admin panel primarily digunakan di desktop/laptop
  - 2-orang tim: bisa disepakati untuk akses admin via desktop saja
  - Implementasi mobile drawer menambah kompleksitas signifikan di Epic 1
  - Fokus Epic 1: foundation yang benar, bukan feature complete

PERILAKU v1 DI MOBILE (≤ 768px):
  Sidebar tetap tampil tapi tidak ada hamburger toggle
  Layout akan overflow secara horizontal di mobile
  User yang akses di mobile mendapat tampilan "kurang optimal" — acceptable di v1
  
  Atau: tambahkan min-width constraint
    className: "hidden md:flex" pada seluruh admin layout
    Tampilkan pesan di mobile: "Gunakan layar lebih besar untuk mengakses Admin Panel"

PERENCANAAN v2 MOBILE:
  - Sidebar collapse menjadi icon-only (240px → 64px)
  - Atau: drawer yang bisa dibuka via hamburger di header
  - Atau: bottom navigation untuk mobile admin
```

---

## 8. STATE DIAGRAM — ACTIVE NAV DETECTION

```
usePathname() returns current path

/admin/dashboard          → "Dashboard" active
/admin/leads              → "Leads & RFQ" active
/admin/leads/[id]         → "Leads & RFQ" active (prefix match)
/admin/supplier           → "Supplier" active
/admin/supplier/[id]      → "Supplier" active
/admin/articles           → "Artikel" active
/admin/articles/new       → "Artikel" active
/admin/articles/[id]/edit → "Artikel" active
/admin/products           → "Produk" active
/admin/settings           → "Pengaturan" active

LOGIC:
  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }
```

---

## 9. COLOR DECISIONS — SIDEBAR

| Element | Token | Hex | Alasan |
|---|---|---|---|
| Sidebar BG | `ink-900` | `#0A1E1C` | Deep dark — fokus ke konten, bukan sidebar |
| Logo area border | `ink-800` | `#102E2B` | Subtle separator |
| Nav item default | `neutral-400` | `#9CA3AF` | Tertiary — tidak mengalihkan perhatian |
| Nav item hover | `neutral-200` | `#E5E7EB` | Visible highlight |
| Nav item active BG | `brand-teal-900` | *approx* | Dark teal tint — active tanpa terlalu kontras |
| Nav item active text | `brand-teal-300` | `#52D6C4` | Bright teal pada dark bg |
| Active left border | `brand-teal-500` | `#0F9E8B` | Visual cue yang kuat |
| User area border | `ink-800` | `#102E2B` | Consistent separator |
| User email | `neutral-300` | `#D1D5DB` | Readable tapi secondary |
| Logout hover BG | `red-950` | — | Warning signal — aksi destructive |
| Logout hover text | `red-300` | — | Visible warning |

---

## 10. ACCESSIBILITY

| Requirement | Implementasi |
|---|---|
| Nav landmark | `<nav aria-label="Admin navigation">` |
| Active item | `aria-current="page"` pada item aktif |
| Logout button | `aria-label="Keluar dari Admin Panel"` |
| Focus ring | `focus-visible:ring-2 focus-visible:ring-brand-teal-400` |
| Heading hierarchy | H1 di AdminHeader, H2 untuk sub-section konten |
| Skip link | Optional: "Langsung ke konten" link tersembunyi di awal |
| Color contrast | Active item: brand-teal-300 pada ink-900 memenuhi WCAG AA |

---

## 11. CATATAN IMPLEMENTASI

1. **Files:**
   - `/app/admin/layout.tsx` — Server Component (auth check + layout wrapper)
   - `/components/layout/AdminSidebar.tsx` — `'use client'` (logout + usePathname)
   - `/components/layout/AdminHeader.tsx` — Server Component (terima props title + breadcrumb)
   - `/constants/adminNavigation.ts` — array nav items dengan icon
2. **ml-60 di main:** Karena sidebar `fixed`, main area perlu `ml-60` (= 240px) agar tidak tertimpa sidebar
3. **overflow-hidden pada wrapper:** Mencegah double scrollbar — hanya content area yang scroll
4. **User email prop:** `AdminSidebar` menerima `user: User` dari layout.tsx via server-side session
5. **Font:** Gunakan `Plus Jakarta Sans` sesuai design system — konsisten dengan halaman publik

---

*Wireframe E1-UX-06 · CV Reka Cipta Indonesia · Mei 2026*
