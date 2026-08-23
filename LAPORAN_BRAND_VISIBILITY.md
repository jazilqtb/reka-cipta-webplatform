# Laporan: Visibilitas Nama Brand di Beranda

`/senior-ui-ux-orchestrator` — mode otonom. Selesai CP0 → CP1 → CP2 → Validasi.

## 1. CP0 — Inventaris Kemunculan "Reka Cipta Indonesia" di Beranda (sebelum revisi)

| Lokasi | Ada teks brand? | Bentuk |
|---|---|---|
| Navbar (logo) | Tidak | `<Logo>` = gambar (`<Image>`), teks brand hanya di `alt`/`aria-label`, tidak terlihat mata |
| Hero (H1/subheadline) | Tidak | Konten dari CMS (`hero_content` DB), diverifikasi live via REST — tanpa nama brand |
| Hero image `alt` | Ya | Atribut `alt`, tak terlihat visual |
| ProductsPreview | Tidak | — |
| CredibilitySection (bagian aktif — marquee mitra) | Tidak | — |
| CredibilitySection (blok trust-pillars) | Ya, tapi **disembunyikan** | `HOMEPAGE_SECTIONS.trustPillars = false` sejak 2026-08-21 |
| IndustriesGrid | Tidak | — |
| HowItWorks | Tidak | — |
| ArticlesPreview | Tidak | — |
| StagedCTASection | Ya (tidak dihitung) | Teks pre-fill link WhatsApp, baru terlihat setelah user pindah ke app WA |
| Footer — deskripsi | Tidak (nama brand tak disebut, hanya deskripsi bisnis) | `COMPANY_INFO.description` |
| Footer — copyright | **Ya** | `© 2025 CV Reka Cipta Indonesia. Hak cipta dilindungi.` — satu-satunya running text brand yang benar-benar tampak, di baris kecil paling bawah |
| `<title>` | Ya | `CV Reka Cipta Indonesia — Distributor Garam SNI...` |
| `<meta name="description">` | **Tidak** | Deskripsi tidak menyebut nama brand secara literal |
| `og:title` / `og:site_name` | Ya | — |
| JSON-LD Organization | Ya | Tak terlihat visual (schema) |

**Kesimpulan CP0**: Hipotesis terbukti — nama brand hadir di `<title>`/OG/JSON-LD, tapi **hilang dari badan visual halaman** kecuali satu baris copyright kecil di dasar footer. Logo navbar murni gambar tanpa wordmark. CP1 **dan** CP2 diperlukan.

## 2. File yang Diubah

| File | Perubahan |
|---|---|
| `components/layout/Navbar.tsx` | Tambah wordmark "Reka Cipta Indonesia" di kanan logo, menggantikan tagline lama. Visible `sm:` ke atas, disembunyikan di rentang sempit `lg:` (1024–1279px, nav+WA+CTA penuh berebut ruang), muncul lagi di `xl:` — pola sama persis dengan tagline lama yang sebelumnya di-gate `xl:`. Token dipakai ulang: `font-ui`, `text-sm md:text-base`, `font-semibold`, `text-ink-700`. |
| `components/sections/CompanyIdentitySection.tsx` | **Baru.** Section identitas singkat, antara Hero dan ProductsPreview. |
| `app/(public)/page.tsx` | Import + sisipkan `<CompanyIdentitySection />` setelah `<HeroSection>`, sebelum `<ProductsPreview>`. |

Admin (`AdminSidebar.tsx`) tidak disentuh — sudah dikonfirmasi struktur terpisah dari `Navbar.tsx` publik (route group berbeda), bukan navbar yang sama.

## 3. Bukti Anti-Duplikasi (CP2)

Konten baru: *"Resmi berbadan hukum sejak 17 November 2020, kami berkantor di Surabaya, Jawa Timur — melanjutkan usaha yang telah berjalan sejak 2019 sebagai UD Kreasi Anak Bangsa."* (fakta diverifikasi live dari tabel `about_timeline`, bukan dari ingatan/asumsi.)

| Section dibandingkan | Isi section itu | Kenapa tidak tumpang tindih |
|---|---|---|
| Hero | Klaim mutu produk ("konsisten"), CTA | Beda topik total (produk vs identitas legal) |
| CredibilitySection (aktif) | Bukti sosial — logo mitra distribusi | Angle kredibilitas-via-mitra, bukan sejarah/legalitas |
| CredibilitySection (hidden trust-pillars) | SNI, legalitas dokumen, mitra petani | Tetap disembunyikan, tidak dibangkitkan kembali — section baru sengaja TIDAK menyebut SNI/legalitas dagang supaya tidak mendahului konten section itu bila diaktifkan kembali |
| IndustriesGrid | 6 sektor yang dilayani | Section baru tidak menyebut sektor sama sekali |
| HowItWorks | Alur kerja/proses transaksi | Tidak disinggung di section baru |
| Footer (`COMPANY_INFO.description`) | "Distributor garam lokal bersertifikat SNI... menghubungkan petani dengan mitra industri di seluruh Nusantara" | Section baru sengaja **tidak** memakai framing distributor/SNI/rantai-pasok ini — dipakai framing berbeda: tanggal pendirian badan hukum + nama badan usaha pendahulu |
| StagedCTASection ("Baru Mengenal Kami") | Label tahap funnel CTA, bukan pernyataan identitas | Diverifikasi di HTML hasil build — beda makna (nama tahap vs kalimat profil) |

Tidak ada kalimat baru yang mengulang makna section lain dengan kata berbeda.

## 4. TINDAKAN DIPERLUKAN

- Tidak ada item `(needs data dari Jazil)` pada task ini — seluruh fakta di section baru diverifikasi live dari DB (`about_timeline`), bukan tebakan.
- **Meta description beranda tidak memuat nama brand secara literal** (baru ditemukan saat verifikasi task ini) — di luar cakupan task ini untuk diubah (task fokus badan visual, bukan meta), tapi dicatat sebagai temuan baru untuk ronde SEO berikutnya.
- Utang dari ronde sebelumnya, belum diselesaikan (dibawa maju, bukan diulang di sini):
  - Typo "ciba" pada tagline salah satu produk (`ProductsPreview`) — terlihat lagi saat scroll verifikasi visual, belum diperbaiki.
  - `NEXT_PUBLIC_BASE_URL` belum di-set di Vercel dashboard.
  - `rekaciptaindonesia.com` sudah dikodekan tapi belum dikonfirmasi tersambung ke Vercel.
  - Drift status `rfq_leads` vs `rfqs`, lead dummy yang diarsip belum dipurge.
  - Fix `revalidatePath(path, 'page')` dari ronde SEO belum diverifikasi di production Vercel sungguhan (baru diverifikasi lokal).

## 5. Yang TIDAK Diverifikasi

- Pengujian interaktif sungguhan di lebar 414/720/1024/1440px — environment browser automation ini viewport-nya terkunci (~1568px, `resize_window` tidak menyebabkan reflow nyata, sudah dikonfirmasi ulang di task ini). Kelayakan breakpoint navbar (`sm:`/`lg:`/`xl:`) diverifikasi lewat perhitungan CSS statis + pola presenden dari tagline lama, **bukan** lewat render nyata di lebar tersebut.
- Rendering di browser mobile sungguhan (Safari/Chrome Android) di luar Chromium automation ini.
- `tsc --noEmit` dan `next build` dijalankan ulang setelah semua perubahan CP1+CP2 → **keduanya EXIT=0**, rute `/` tetap statis (`○`).
- Kontras WCAG dihitung manual (relative luminance), bukan lewat axe/Lighthouse: wordmark navbar (`ink-700`/`#242A31` atas putih) ≈14.5:1; teks section baru — heading `ink-700` ≈14.5:1, body `neutral-700`/`#3A414B` ≈10.3:1, eyebrow/aksen `brand-teal-600`/`#125A8C` ≈7.3:1, link `brand-teal-700`/`#0C3F63` ≈11.0:1 — semua jauh di atas AA (4.5:1). Navbar transparan-atas-hero tidak berlaku di codebase ini (header selalu `bg-white/97`), jadi poin itu N/A.
