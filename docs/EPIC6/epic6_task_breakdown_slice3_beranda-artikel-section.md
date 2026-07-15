# Epic 6 Task Breakdown — Section "Wawasan & Kabar Terbaru" di Beranda · Slice 3

**Depends on:** Epic 6 Slice 1 (Artikel & Berita — **wajib selesai duluan**: `lib/data/articles.ts` fungsi `getLatestArticles()`/`getMostViewedArticles()`, `components/blocks/ArticleCard.tsx`, `types/api.ts` tipe `Article`), Epic 2 Slice 1 (`app/(public)/page.tsx` — file homepage yang disentuh slice ini, section `StatsBar` sebagai titik sisip)

**Blocks:** Tidak ada.

**Bukan bagian slice ini:** Epic 6 Slice 2 (Kalkulator Garam) — tidak ada hubungan sama sekali dengan homepage.

**Sifat dokumen:** Ini adalah **delta patch**, bukan slice besar — hanya menambah 1 section baru ke halaman yang sudah ada (`app/(public)/page.tsx`, dibangun Epic 2 Slice 1). Mengikuti pola perubahan minor pada dokumen `epic2_task_breakdown_slice1_beranda_v1.1.md` (changelog `v1.0 → v1.1`): task baru ditambahkan, task lain di halaman itu **tidak disentuh sama sekali**.

---

## Konteks Slice

User secara eksplisit meminta section baru **tepat di bawah section Statistik** di halaman beranda, berisi artikel terbaru dan artikel terbanyak dilihat, dengan requirement fungsional spesifik:

1. Ada elemen yang bisa diklik untuk menuju halaman `/artikel` lengkap.
2. Setiap kartu artikel yang tampil bisa diklik menuju artikel lengkapnya.
3. Setiap kartu menampilkan: foto, tanggal upload, judul, dan beberapa kalimat awal.

**Requirement ini 100% sudah dipenuhi oleh komponen yang dibangun di Slice 1** — `ArticleCard` (Slice 1, `E6-S1-FE-02`) sudah punya seluruh 4 elemen di atas (thumbnail/fallback, tanggal terformat, judul `line-clamp-2`, excerpt `line-clamp-2`) dan seluruh kartu sudah dibungkus `<Link>` ke `/artikel/[slug]`. Slice 3 **tidak membuat ulang** kartu — murni komposisi: fetch data dari `lib/data/articles.ts` (Slice 1) → render `ArticleCard` (Slice 1) di dalam wrapper section baru + CTA "Lihat Semua Artikel" (baru, poin 1 di atas).

### Nama Section

Requirement asli menyebut judul default "Artikel dan Berita", dengan opsi membuat judul sendiri sesuai karakter brand. Design System (`§1 Filosofi Desain`) menetapkan dua archetype brand: **The Caretaker** (hangat, memberi ruang) dan **The Sage** (ahli, purposeful). Section ini dirancang dengan:

- **Overline** (label kecil di atas heading, `text-2xs font-semibold text-brand-teal-600 uppercase` — pola "Section label" di Design System §3.3): **`ARTIKEL & BERITA`** — tetap literal di sini supaya pengunjung instan tahu jenis konten (wayfinding, bukan tempat untuk kreativitas kata).
- **Heading (H2)**: **`Wawasan & Kabar Terbaru`** — "wawasan" merepresentasikan sisi Sage (pengetahuan/edukasi, artikel kategori `education`), "kabar" merepresentasikan sisi Caretaker (personal, seperti kabar dari kerabat, cocok untuk artikel kategori `company_news`). Lebih hangat dan spesifik daripada terjemahan literal "Artikel dan Berita" sebagai heading utama, sekaligus tetap jelas fungsinya karena overline sudah eksplisit menyebut kategori kontennya.
- **Subtitle**: `"Edukasi seputar garam industri dan kabar terbaru dari CV Reka Cipta Indonesia."`

Kalau Jazil/klien lebih suka judul literal "Artikel dan Berita" sebagai H2, cukup ganti satu string di `E6-S3-FE-01` — tidak ada dependency lain ke nama ini di tempat lain manapun di kode.

---

## Posisi di Halaman Beranda

Urutan render section homepage **sebelum** slice ini (`app/(public)/page.tsx:116-126`, dibangun Epic 2 Slice 1):
```tsx
<HeroSection />
<StatsBar settings={settings} />
<ProductsPreview products={products} />
<HowItWorks />
<IndustriesGrid />
<CredibilitySection />
<CTASection />
```

Urutan **setelah** slice ini (satu baris disisipkan, tidak ada baris lain yang berubah):
```tsx
<HeroSection />
<StatsBar settings={settings} />
<ArticlesPreview latestArticles={latestArticles} mostViewedArticles={mostViewedArticles} />  {/* BARU */}
<ProductsPreview products={products} />
<HowItWorks />
<IndustriesGrid />
<CredibilitySection />
<CTASection />
```

**Catatan penempatan:** posisi ini (antara Statistik dan Preview Produk) adalah instruksi eksplisit dari user, bukan keputusan desain bebas — section konten/edukasi tampil sebelum section produk inti secara narasi tidak lazim untuk halaman beranda B2B (biasanya produk didahulukan untuk jalur konversi tercepat), tapi ini permintaan langsung, dieksekusi sesuai instruksi.

**Styling container:** `ArticlesPreview` pakai `max-w-7xl` (bukan `max-w-5xl` seperti `StatsBar` tepat di atasnya) — konsisten dengan `ProductsPreview` tepat di bawahnya, karena keduanya sama-sama grid kartu. `StatsBar` sengaja lebih sempit (`max-w-5xl`) karena isinya cuma 4 angka, bukan pola yang perlu ditiru section kartu.

**Dampak ke Epic 2 Slice 1:** perubahan ini menambah 1 section ke homepage yang sudah dibangun Epic 2 Slice 1. `epic2_task_breakdown_slice1_beranda_v1.1.md` (§`E2-S1-QA-06` — Definition of Done checklist homepage) berisi daftar section final homepage yang **tidak lagi lengkap** setelah slice ini — dokumen itu sendiri **tidak diedit** (di luar scope dan wewenang slice ini untuk mengubah dokumen epic lain), tapi dicatat di sini secara eksplisit: siapa pun yang re-run DoD checklist Epic 2 Slice 1 setelah slice ini harus tahu ada 1 section tambahan yang sah, bukan penyimpangan yang tidak terduga.

---

## Keputusan Arsitektur Slice

### AR-01 — Reuse Penuh, Zero Duplikasi dari Slice 1

`ArticleCard`, `getLatestArticles()`, `getMostViewedArticles()`, tipe `Article` — semua diimpor langsung dari lokasi yang dibangun Slice 1, **tidak ada versi "homepage" terpisah**. Ini konsisten dengan disiplin R-53 (Epic 5 Admin) — dilarang duplicate component/logic yang sudah generic hanya karena dipakai di context baru.

### AR-02 — Dua Data Set Di-fetch Sekali di Server Component, Toggle di Client Tanpa Fetch Ulang

Section menampilkan 2 "tab": Terbaru dan Terbanyak Dilihat. Alih-alih fetch ulang saat user klik tab (butuh Client Component fetch atau route handler tambahan), **kedua array (masing-masing 3 artikel) di-fetch sekali di Server Component induk** (`ArticlesPreview`, Server Component) dan diteruskan sebagai props ke Client Component kecil yang cuma menangani toggle visual (`ArticlesPreviewTabs`). Total data yang di-fetch kecil (maks 6 artikel, sudah kena `revalidate` cache page-level) — tidak ada alasan menambah kompleksitas client-side fetching untuk kasus sekecil ini.

### AR-03 — Section Disembunyikan Total Kalau 0 Artikel Published

Karena Epic 6 Admin Panel (CRUD) belum tentu sudah shipped bersamaan dengan slice ini, ada kemungkinan homepage di-deploy dengan 0 artikel published di database. **Section `ArticlesPreview` return `null` sepenuhnya** (bukan render grid kosong atau pesan "belum ada artikel") kalau kedua array (`latestArticles` dan `mostViewedArticles`) kosong — progressive enhancement, homepage tetap terlihat lengkap dan sengaja tanpa section yang terasa "kosong/rusak" untuk pengunjung publik. Ini beda dengan halaman `/artikel` sendiri (Slice 1) yang **tetap** menampilkan empty state eksplisit — karena di sana pengunjung datang dengan intent spesifik untuk melihat artikel, sedang di homepage section ini murni tambahan, tidak masalah kalau tidak ada sama sekali.

### AR-04 — CTA "Lihat Semua Artikel" — Pemakaian Pertama Pola `.link-arrow`

Riset kode menemukan tidak ada satu pun contoh existing pattern "text link ke halaman list lengkap" di seluruh codebase (`ProductsPreview` sengaja **menghapus** CTA "Lihat Semua Produk" karena katalog cuma 5 produk — komentar eksplisit di `ProductsPreview.tsx`). Design System §11.3 sudah mendefinisikan `.link-arrow` (arrow icon slide on hover) tapi class ini **belum pernah dipakai di komponen manapun**. Slice ini adalah pemakaian pertamanya — konsisten dengan sistem desain yang sudah didefinisikan, tanpa perlu menciptakan pola baru.

---

## Ringkasan Task per Layer

| Layer | Jumlah Task | Prefix |
|---|---|---|
| UX | 1 | `E6-S3-UX` |
| User Stories | 1 | `E6-S3-US` |
| Frontend Public | 3 | `E6-S3-FE` |
| QA | 3 | `E6-S3-QA` |
| **Total** | **8** | |

---

## Layer 1 — UX Tasks

### E6-S3-UX-01 — Wireframe Section "Wawasan & Kabar Terbaru"

**Priority:** P0 · **Tags:** `wireframe` `public`

**Deliverable:** `docs/wireframes/Epic6_slice3_beranda-artikel-section.md`

```
├─────────────────────────────────────────────────┤ ← tepat setelah </StatsBar>
│  <ArticlesPreview>                                │
│    ARTIKEL & BERITA                               │  ← overline, brand-teal-600, uppercase
│    Wawasan & Kabar Terbaru                        │  ← H2, ink-700
│    Edukasi seputar garam industri dan kabar        │  ← subtitle, neutral-600
│    terbaru dari CV Reka Cipta Indonesia.           │
│                                                    │
│    [ Terbaru ]  [ Terbanyak Dilihat ]              │  ← tabs, underline slide §10.6
│    ┌───────────┐ ┌───────────┐ ┌───────────┐      │
│    │[thumbnail]│ │[thumbnail]│ │[thumbnail]│      │  ← ArticleCard × 3 (reuse Slice 1)
│    │[Edukasi]  │ │[Berita]   │ │[Edukasi]  │      │
│    │Judul...   │ │Judul...   │ │Judul...   │      │
│    │12 Jul 2026│ │10 Jul 2026│ │08 Jul 2026│      │
│    │Preview... │ │Preview... │ │Preview... │      │
│    └───────────┘ └───────────┘ └───────────┘      │
│                                                    │
│              Lihat Semua Artikel →                 │  ← link-arrow, centered
│  </ArticlesPreview>                                │
├─────────────────────────────────────────────────┤ ← tepat sebelum <ProductsPreview>
```

**Empty state:** section tidak render sama sekali (AR-03) — tidak ada wireframe untuk state ini karena secara visual section-nya memang tidak ada.

**Responsive:**
- Desktop (≥1024px): grid 3 kolom, gap 24px, container `max-w-7xl px-4`
- Mobile (<768px): grid 1 kolom, tabs tetap horizontal (2 opsi cukup ringkas, tidak perlu scroll)
- Padding vertikal section: `py-16 md:py-24` (`section-lg` per Design System §4)

**Verifikasi:** Wireframe committed.

---

## Layer 2 — User Stories

### E6-S3-US-01 — Pengunjung Homepage Menemukan Konten Edukasi Tanpa Navigasi Terpisah

**As** pengunjung yang baru pertama kali ke situs CV Reka Cipta,
**I want** melihat cuplikan artikel edukasi dan berita terbaru langsung dari halaman utama,
**So that** saya bisa menilai kredibilitas dan kedalaman pengetahuan perusahaan ini tanpa harus mencari menu Artikel secara aktif.

**Acceptance:**
- Section muncul otomatis di homepage (tanpa interaksi user), tepat di bawah section Statistik
- Toggle "Terbaru" / "Terbanyak Dilihat" berfungsi tanpa reload halaman
- Klik kartu artikel manapun → langsung ke halaman detail artikel lengkap
- Klik "Lihat Semua Artikel" → ke `/artikel`
- Kalau belum ada artikel published sama sekali, homepage tetap terlihat rapi (section tidak muncul, bukan kosong/rusak)

---

## Layer 3 — Frontend Public

### E6-S3-FE-01 — `components/sections/ArticlesPreview.tsx`

**Priority:** P0 · **Tags:** `component` `public` `server`

**File:** `components/sections/ArticlesPreview.tsx` (folder `components/sections/` — konsisten lokasi `StatsBar`, `ProductsPreview`, dan section homepage lain)

```tsx
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ArticlesPreviewTabs } from './ArticlesPreviewTabs'
import type { Article } from '@/types/api'

interface Props {
  latestArticles: Article[]
  mostViewedArticles: Article[]
}

export function ArticlesPreview({ latestArticles, mostViewedArticles }: Props) {
  if (latestArticles.length === 0 && mostViewedArticles.length === 0) {
    return null // AR-03 — sembunyikan total kalau belum ada artikel published
  }

  return (
    <section className="bg-white py-16 md:py-24" aria-label="Artikel dan berita terbaru">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-2xs font-semibold uppercase tracking-wide text-brand-teal-600">
            Artikel &amp; Berita
          </p>
          <h2 className="mt-2 text-3xl font-bold text-ink-700">Wawasan &amp; Kabar Terbaru</h2>
          <p className="mt-3 text-base text-neutral-600">
            Edukasi seputar garam industri dan kabar terbaru dari CV Reka Cipta Indonesia.
          </p>
        </div>

        <div className="mt-10">
          <ArticlesPreviewTabs latestArticles={latestArticles} mostViewedArticles={mostViewedArticles} />
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/artikel"
            className="link-arrow inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal-600 hover:text-brand-teal-700"
          >
            Lihat Semua Artikel
            <ArrowRight className="arrow-icon h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
```

**Verifikasi:** Render dengan data dari kedua array terisi → section tampil lengkap. Render dengan kedua array kosong → tidak ada elemen `<section aria-label="Artikel dan berita terbaru">` sama sekali di DOM.

---

### E6-S3-FE-02 — `components/sections/ArticlesPreviewTabs.tsx`

**Priority:** P0 · **Tags:** `component` `public` `client`

```tsx
'use client'

import { useState } from 'react'
import { ArticleCard } from '@/components/blocks/ArticleCard'
import type { Article } from '@/types/api'

interface Props {
  latestArticles: Article[]
  mostViewedArticles: Article[]
}

type TabValue = 'latest' | 'most_viewed'

export function ArticlesPreviewTabs({ latestArticles, mostViewedArticles }: Props) {
  const [activeTab, setActiveTab] = useState<TabValue>('latest')
  const articles = activeTab === 'latest' ? latestArticles : mostViewedArticles

  return (
    <div>
      <div className="relative flex justify-center gap-6 border-b border-neutral-200">
        <TabButton label="Terbaru" isActive={activeTab === 'latest'} onClick={() => setActiveTab('latest')} />
        <TabButton
          label="Terbanyak Dilihat"
          isActive={activeTab === 'most_viewed'}
          onClick={() => setActiveTab('most_viewed')}
        />
      </div>

      {articles.length === 0 ? (
        <p className="py-10 text-center text-sm text-neutral-500">
          Belum ada data untuk kategori ini.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}

function TabButton({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative pb-3 text-sm font-medium transition-colors ${
        isActive ? 'text-brand-teal-700' : 'text-neutral-500 hover:text-neutral-700'
      }`}
    >
      {label}
      {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-teal-600" />}
    </button>
  )
}
```

**Catatan:** pola tab-underline identik `CategoryTabs` (Slice 1) — sengaja **tidak diekstrak jadi shared component generic** di slice ini, karena `CategoryTabs` sinkron dengan URL (`useSearchParams`, filter halaman `/artikel`) sedangkan `ArticlesPreviewTabs` murni state lokal tanpa URL sync (toggle di homepage tidak perlu shareable link per tab). Dua kebutuhan berbeda meski visual mirip — duplikasi kecil di sini lebih baik daripada memaksakan abstraksi generic yang harus menangani dua mode sekaligus (URL-synced vs local-state) untuk kasus pakai yang cuma 2 tempat (YAGNI, konsisten prinsip yang sama dengan R-54 Epic 5 Admin: jangan bikin helper generic prematur sebelum ada 3+ pemakaian nyata).

**Verifikasi:** Klik "Terbanyak Dilihat" → grid ganti ke 3 artikel dengan `view_count` tertinggi (dari seed data Slice 1: `cara-memilih-garam-water-treatment` dengan `view_count=200` harus muncul pertama). Klik "Terbaru" → kembali ke 3 artikel ter-published paling baru.

---

### E6-S3-FE-03 — Update `app/(public)/page.tsx`: Sisip `ArticlesPreview` + Fetch Data

**Priority:** P0 · **Tags:** `page` `public` `cross-epic-touch`

**File:** `app/(public)/page.tsx` (file Epic 2 Slice 1 — perubahan aditif, baris lain **tidak disentuh**)

**Tambahan fetch function** (pola identik `getProductsPreview`/`getCompanySettings` yang sudah ada di file yang sama):
```typescript
import { getLatestArticles, getMostViewedArticles } from '@/lib/data/articles'
import { ArticlesPreview } from '@/components/sections/ArticlesPreview'

// ... di dalam BerandaPage, sejajar Promise.all yang sudah ada:
const [settings, products, latestArticles, mostViewedArticles] = await Promise.all([
  getCompanySettings(),
  getProductsPreview(),
  getLatestArticles(3),
  getMostViewedArticles(3),
])
```

**Perubahan render (satu baris disisipkan):**
```diff
   <HeroSection />
   <StatsBar settings={settings} />
+  <ArticlesPreview latestArticles={latestArticles} mostViewedArticles={mostViewedArticles} />
   <ProductsPreview products={products} />
   <HowItWorks />
   <IndustriesGrid />
   <CredibilitySection />
   <CTASection />
```

**Catatan:** `getLatestArticles`/`getMostViewedArticles` sudah punya try/catch internal dengan fallback `[]` (dibangun di Slice 1, `E6-S1-DA-01`) — kalau fetch gagal (mis. Supabase down), `Promise.all` tidak throw, homepage tetap render dengan `ArticlesPreview` yang otomatis `return null` (AR-03). **Kegagalan fetch artikel tidak boleh membuat seluruh homepage error** — konsisten dengan pola resiliency yang sudah ada di file ini untuk `products`/`settings`.

**Verifikasi:** `export const revalidate = 3600` di file ini (sudah ada dari Epic 2 Slice 1) **tidak diubah** — section baru ikut cache window yang sama dengan section lain di homepage, tidak perlu revalidate terpisah.

---

## Layer 4 — QA Tasks

### E6-S3-QA-01 — Fungsional Section & Tabs

**Steps:**
1. Buka `/` → scroll ke bawah section Statistik → verify `ArticlesPreview` muncul tepat di sana, sebelum `ProductsPreview`
2. Verify tab "Terbaru" aktif secara default, 3 kartu artikel terbaru tampil
3. Klik tab "Terbanyak Dilihat" → 3 kartu berganti ke artikel dengan `view_count` tertinggi
4. Klik salah satu kartu → landing di `/artikel/{slug}` artikel yang benar
5. Klik "Lihat Semua Artikel" → landing di `/artikel`

**Verifikasi:** Semua langkah sesuai expected.

---

### E6-S3-QA-02 — Kelengkapan Elemen Kartu (Requirement Eksplisit User)

**Steps:** Untuk setiap kartu yang tampil di section ini, verify 4 elemen berikut ada dan benar:

| Elemen | Verifikasi |
|---|---|
| Foto | Thumbnail tampil jika `thumbnail_url` ada; fallback gradient+ikon jika `null` |
| Tanggal upload | Format `d MMMM yyyy` locale Indonesia (mis. "12 Juli 2026") |
| Judul berita | Teks lengkap atau terpotong rapi (`line-clamp-2`), tidak overflow |
| Beberapa kalimat awal | `meta_description` atau fallback excerpt dari `content`, `line-clamp-2` |

**Verifikasi:** Semua 4 elemen terverifikasi ada di setiap kartu, baik tab "Terbaru" maupun "Terbanyak Dilihat".

---

### E6-S3-QA-03 — Empty State & Resiliency

**Steps:**
1. Set semua artikel `is_published = FALSE` sementara (via SQL, sama seperti `E6-S1-QA-05`)
2. Reload `/` → verify section `ArticlesPreview` **tidak muncul sama sekali** (bukan grid kosong, bukan pesan error), homepage lanjut langsung dari Statistik ke Preview Produk
3. Rollback: set kembali `is_published = TRUE` untuk artikel seed yang relevan
4. Reload `/` → section muncul kembali normal

**Verifikasi:** Homepage tetap terlihat solid dan lengkap di kedua state (dengan dan tanpa artikel published) — tidak ada elemen visual yang terasa "patah".

---

## Definition of Done — Slice 3

- [ ] Section "Wawasan & Kabar Terbaru" muncul tepat di bawah section Statistik, sebelum Preview Produk
- [ ] Tab "Terbaru" dan "Terbanyak Dilihat" berfungsi, masing-masing menampilkan 3 kartu artikel yang benar
- [ ] Setiap kartu menampilkan foto (atau fallback), tanggal, judul, dan cuplikan teks — sesuai requirement eksplisit
- [ ] Setiap kartu bisa diklik menuju artikel lengkap
- [ ] "Lihat Semua Artikel" mengarah ke `/artikel`
- [ ] Section tidak render sama sekali kalau 0 artikel published (bukan empty state kosong)
- [ ] `app/(public)/page.tsx` (Epic 2 Slice 1) hanya berubah aditif — tidak ada section lain yang terpengaruh
- [ ] `npx tsc --noEmit` dan `npm run lint` clean
- [ ] QA-01, QA-02, QA-03 pass

**Demo ke klien:**
- [ ] Sign-off dari Jazil/klien: buka homepage → lihat section baru → toggle tab → klik kartu → klik "Lihat Semua Artikel" → seluruh alur mulus

---

## Catatan Penutup

**1. Slice ini murni komposisi, bukan fitur baru** — nilai tambahnya adalah menyusun ulang komponen yang sudah ada (Slice 1) ke context homepage dengan disiplin: tidak duplikasi (`ArticleCard` dipakai apa adanya), tidak premature-abstract (`ArticlesPreviewTabs` sengaja tidak disatukan dengan `CategoryTabs` meski mirip visual — kebutuhan sync-URL berbeda), dan resilient terhadap keadaan data kosong (AR-03).

**2. Slice ini WAJIB dikerjakan setelah Slice 1 stabil**, bukan paralel — berbeda dengan Slice 2 (Kalkulator) yang independen penuh. Kalau `getLatestArticles`/`getMostViewedArticles`/`ArticleCard` masih berubah-ubah signature-nya saat Slice 3 dikerjakan, akan ada rework. Urutan pengerjaan yang disarankan: **Slice 1 → (Slice 2 paralel atau setelahnya, bebas) → Slice 3 terakhir.**

**3. Placement section (di bawah Statistik) adalah instruksi eksplisit, bukan rekomendasi UX independen** — dicatat di dokumen ini secara transparan supaya keputusan ini bisa ditinjau ulang di masa depan kalau data funnel/conversion menunjukkan section ini mengganggu jalur ke Preview Produk. Kalau nanti ingin dipindah (mis. ke bawah CredibilitySection, sebelum CTASection penutup), perubahannya sesederhana memindah satu baris JSX di `app/(public)/page.tsx` — tidak ada dependency struktural yang mengunci posisi ini.

---

**File:** `docs/EPIC6/epic6_task_breakdown_slice3_beranda-artikel-section.md`
**Versi:** 1.0
**Berdasarkan:** `Epic_Doc2_Epics4-6_RekaCirciptaIndonesia.md` (requirement section baru di luar Epic Doc 2 asli — permintaan langsung user), `DESIGN_SYSTEM_RekaCirciptaIndonesia_v2.md` v2.0 (§1 Filosofi Desain, §3.3 Tipografi, §10.6 Tabs, §11.3 Link Hover), `epic6_task_breakdown_slice1_artikel-berita.md` (dependency utama), verifikasi langsung kode `app/(public)/page.tsx` dan `components/sections/StatsBar.tsx`, `components/blocks/ProductCard.tsx` (Epic 2/3 CF)
