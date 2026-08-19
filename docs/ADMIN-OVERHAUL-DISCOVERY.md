# Perombakan Total Admin — Laporan Fase Discovery

**Tanggal:** 2026-08-19 · **Fase:** Discovery (nol baris kode ditulis)
**Chair:** senior-ui-ux-orchestrator · **Privacy:** local-first

Provenance tiap klaim ditandai `[EXTRACTED]` (dibaca dari kode/DB/HTTP),
`[INFERRED]` (kesimpulan dari bukti), `[AMBIGUOUS]` (belum bisa dipastikan).

---

## 1. CEK AKSES — hasil

| # | Akses | Status | Bukti |
|---|---|---|---|
| 1 | Supabase REST (service key) | **BISA** | `GET /rest/v1/products` → 200, `admin_users` → 200 `[EXTRACTED]` |
| 2 | Supabase CLI (migrasi) | **BISA** | `supabase --version` → 2.105.0 `[EXTRACTED]` |
| 3 | Koneksi psql langsung | **TIDAK** | wrapper ada, paket `postgresql-client-*` tidak terpasang `[EXTRACTED]` |
| 4 | Login admin — level data | **BISA** | `POST /auth/v1/token` → 200, access token diperoleh `[EXTRACTED]` |
| 5 | Audit visual `/admin` di browser | **BELUM** | 1 browser Chrome terhubung (`Browser 1`, Linux, lokal), tapi butuh Anda memilih browser + memberi izin situs `[EXTRACTED]` |

**Kesimpulan:** cukup akses untuk merancang skema DB, membaca data nyata, dan
mengaudit perilaku API. Yang belum: melihat tampilan admin dengan mata sendiri.
Nomor 3 tidak memblokir apa pun — migrasi jalan lewat CLI, kueri lewat REST.

Lihat §11 untuk apa yang perlu Anda lakukan.

---

## 2. Inventaris route admin

20 file route `[EXTRACTED — find app/admin app/(auth)]`.

| Route | Baris | Kondisi | Catatan |
|---|---|---|---|
| `(auth)/admin/login` | 267 | **Working** | throttle 5×/60s, banner `denied`, Phosphor |
| `admin/layout.tsx` | 59 | **Working** | gate allowlist `admin_users`, fail-closed |
| `admin/dashboard` | 143 | **Working, tapi tipis** | 4 kartu angka; lihat §5.3 |
| `admin/leads` | 38 | **Working** | Kanban; 3 lead total di DB |
| `admin/leads/[id]` | 36 | **Working** | detail + generator proposal |
| `admin/articles` | 70 | **Working** | list |
| `admin/articles/new` | 20 | **Working** | |
| `admin/articles/[id]/edit` | 42 | **Working** | ada field slug manual — target hapus |
| `admin/products` | 52 | **Working** | |
| `admin/products/[id]/edit` | 56 | **Working** | |
| `admin/suppliers` | 37 | **Working** | **0 baris data** |
| `admin/suppliers/[id]` | 36 | **Working** | |
| `admin/settings` | 32 | **Working** | |
| `admin/email-templates` | 29 | **Working** | |
| `admin/proposal-settings` | 37 | **Incomplete (SENGAJA)** | **JANGAN DISENTUH** |
| `admin/error.tsx` | 69 | **Working** | |
| `admin/loading.tsx` | 51 | **Working** | |
| `admin/not-found.tsx` | 40 | **Working** | |
| `admin/suppliers/error.tsx` | 21 | **Working** | satu-satunya error boundary per-segmen |

Tidak ada route `broken` `[INFERRED — semua terkompilasi di build EXIT=0]`.
Masalahnya kualitas UX dan kepadatan, bukan kerusakan.

### Kondisi data nyata `[EXTRACTED — count=exact via REST]`

| Tabel | Total | Yang tampil di dashboard |
|---|---|---|
| `rfq_leads` | 3 | **2** (status=new) |
| `supplier_registrations` | 0 | **0** (status=active) |
| `articles` | 7 | **6** (is_published) |
| `products` | 5 | **5** (is_active) |
| `lead_status_history` | 1 | — |
| `admin_users` | 1 | — |
| `company_settings` | 10 | — |

Sebaran status lead: `{new: 2, deal: 1}` — hanya 2 dari ~5 kolom Kanban terisi.

---

## 3. Peta dependensi

### God nodes `[EXTRACTED — graphify + import census]`

| Node | Kenapa god node |
|---|---|
| `components/layout/AdminHeader.tsx` | 13 consumer — tiap halaman admin |
| `components/layout/AdminSidebar.tsx` | shell tunggal, memegang logout |
| `components/admin/ui/AdminPrimitives.tsx` (242) | AdminCard/StatTile/StatusPill/EmptyState/AdminButton |
| `types/api.ts` | kontrak lintas admin + public + FastAPI |
| `lib/api.ts` | `apiFetch<T>()` — satu-satunya jalur ke FastAPI |
| `constants/adminNavigation.ts` | sumber tunggal item nav |

### Shared public ↔ admin `[EXTRACTED — import census]`

Hanya primitif shadcn/ui, **bukan** komponen presentasi:

| Komponen | Public | Admin |
|---|---|---|
| `ui/button` | 2 | 2 |
| `ui/input` | 1 | 6 |
| `ui/label` | 1 | 6 |
| `ui/textarea` | 1 | 7 |
| `ui/skeletons` | 4 | 8 |

**Nol komponen `components/sections/*`, `blocks/*`, atau `forms/*` diimpor
admin** `[EXTRACTED]`. Konsekuensinya penting: **merombak admin tidak bisa
merusak portal publik**, selama `components/ui/*` tidak diedit langsung
(sesuai CLAUDE.md: extend lewat `components/brand/`).

### Admin-only

42 komponen di `components/admin/**` `[EXTRACTED]`. Terberat:
`SettingsForm` (335), `ProposalGeneratorPanel` (310), `SpecJSONBEditor` (309),
`PromptEditor` (357), `ProductEditForm` (260), `EmailTemplateEditor` (239).

### Circular / dead code

`[AMBIGUOUS]` — belum saya audit tuntas. Butuh `graphify` pass khusus dengan
budget lebih besar; ditunda ke CP1 karena tidak memblokir wireframe.

---

## 4. Design DNA dari Beranda (Source of Truth)

`[EXTRACTED — app/globals.css]`

**Koreksi faktual:** warna brand bukan *ocean-blue*, melainkan **teal /
hijau-laut dalam** — `brand-teal-600 = #0B7D6E`. Penting diluruskan sekarang
supaya arah UI admin tidak melenceng sejak awal.

### Token yang diadopsi admin

| Peran | Token | Nilai |
|---|---|---|
| Aksi primer | `brand-teal-600` → hover `brand-teal-500` | `#0B7D6E` → `#0F9E8B` |
| Sidebar / permukaan gelap | `ink-900` | `#0A1E1C` |
| Judul | `ink-700` | `#173F3A` |
| Latar aplikasi | `neutral-50` | `#F9FAFB` |
| Aksen supplier | `sand-600` | `#8A6535` |
| Angka & ID | `.mono-tech` (JetBrains Mono) | — |

### Tipografi

`--font-ui` **Space Grotesk** (label, judul section) · `--font-sans` Plus
Jakarta Sans (body) · `--font-mono` JetBrains Mono (angka/ID) ·
`--font-display` Fraunces — **khusus H1 hero publik, DILARANG di admin**.

### Yang DIWARISI vs DITINGGALKAN

| Elemen Beranda | Admin | Alasan |
|---|---|---|
| Palet teal/ink/sand | **Warisi** | satu bahasa merek |
| Space Grotesk untuk label | **Warisi** | |
| `.mono-tech` untuk angka | **Warisi** | ID lead, NaCl%, tanggal |
| `.card-hover-lift`, `.tag-pill`, `.panel-card` | **Warisi (halus)** | |
| `SectionDivider` (wave/curve/diagonal) | **Tinggalkan** | ornamen naratif; alat kerja butuh garis 1px |
| `RevealWrapper` / scroll reveal | **Tinggalkan** | menunda pembacaan data |
| `ParallaxBlob`, `Magnetic`, `.cta-hero-pulse` | **Tinggalkan** | |
| Fraunces | **Tinggalkan** | |
| Whitespace besar (`py-14 md:py-20`) | **Tinggalkan** | admin: `py-4/6` |

**Prinsip:** admin mewarisi *palet dan tipografi*, bukan *retorika visual*.
Beranda membujuk; admin harus dikerjakan delapan jam sehari.

---

## 5. Wireframe baru

Semua ASCII, belum kode.

### 5.1 Shell global — sidebar collapsible + grid padat

```
DESKTOP ≥1280px — sidebar mengembang (256px)
┌────────────────┬──────────────────────────────────────────────────────┐
│ ◧ REKA CIPTA   │  Leads / RFQ            [⌘K cari]  [🔔]  [AV ▾]      │ 56px
│                ├──────────────────────────────────────────────────────┤
│ ◫ Dashboard    │ ┌──────────────────────────┬───────────────────────┐ │
│ ▣ Leads     2  │ │                          │                       │ │
│ ◈ Supplier     │ │   KOLOM KERJA UTAMA      │   PANEL KONTEKS       │ │
│ ▤ Artikel      │ │   (fleksibel)            │   (360px, sticky)     │ │
│ ▦ Produk       │ │                          │                       │ │
│ ✉ Template     │ │                          │                       │ │
│ ⚙ Pengaturan   │ └──────────────────────────┴───────────────────────┘ │
│ ⧉ Proposal     │                                                      │
│ ─────────────  │                                                      │
│ « Kecilkan     │                                                      │
└────────────────┴──────────────────────────────────────────────────────┘

DESKTOP — sidebar mengecil (64px, hanya ikon + tooltip)
┌────┬────────────────────────────────────────────────────────────────┐
│ ◧  │  Leads / RFQ                      [⌘K]  [🔔]  [AV ▾]           │
│ ◫  ├────────────────────────────────────────────────────────────────┤
│ ▣2 │  ← +192px lebar untuk data                                     │
│ ◈  │                                                                │
│ »  │                                                                │
└────┴────────────────────────────────────────────────────────────────┘

TABLET 768–1279px ("desktop setengah") — sidebar default MENGECIL,
panel konteks jadi drawer kanan yang dipanggil, bukan kolom tetap.

MOBILE <768px — sidebar jadi drawer penuh (pola Navbar publik yang sudah
ada), panel konteks jadi bottom-sheet.
```

Keadaan sidebar disimpan di `localStorage` + dikirim sebagai cookie supaya
render server tidak berkedip `[INFERRED — pola umum, perlu diputuskan CP1]`.

### 5.2 `/admin/leads` — rombak total

Masalah sekarang: Kanban 5 kolom untuk **3 lead**, 2 kolom terisi. Kanban
adalah pilihan yang salah pada volume ini — 90% layar kosong, dan tiap lead
hanya menampilkan potongan kecil informasi. `[EXTRACTED — data + kode]`

```
USULAN: Split-view (daftar padat kiri + detail kanan), Kanban jadi TAB opsional

┌─────────────────────────────────────────────────────────────────────────┐
│ Leads / RFQ                                          [+ Lead Manual]    │
│ ┌────────┬────────┬────────┬────────┐   [Semua ▾][Sumber ▾][Tanggal ▾] │
│ │ Baru 2 │ Proses │ Deal 1 │ Batal  │   ← chip filter, BUKAN kolom      │
│ └────────┴────────┴────────┴────────┘   [▤ Daftar] [▦ Kanban]          │
├──────────────────────────────┬──────────────────────────────────────────┤
│ ○ PT Samudra Jaya      BARU  │  PT Samudra Jaya          [Baru ▾]      │
│   Garam Halus · 20 ton       │  ────────────────────────────────────    │
│   2 jam lalu      #RFQ-0031  │  📞 0812-xxxx   ✉ ops@…   📍 Surabaya   │
│ ─────────────────────────────│                                          │
│ ● CV Mitra Pangan      DEAL  │  ┌─ Kebutuhan ─────────────────────┐    │
│   Garam Kasar · 5 ton        │  │ Produk   Garam Halus Beryodium  │    │
│   1 hari lalu     #RFQ-0030  │  │ Volume   20 ton/bulan           │    │
│ ─────────────────────────────│  │ Kirim    Surabaya               │    │
│ ○ UD Berkah            BARU  │  └─────────────────────────────────┘    │
│   Garam Kasar · 2 ton        │                                          │
│                              │  ┌─ Aksi ──────────────────────────┐    │
│                              │  │ [Buat Proposal] [WhatsApp] [✉]  │    │
│                              │  └─────────────────────────────────┘    │
│                              │  ┌─ Catatan internal ──────────────┐    │
│                              │  ┌─ Riwayat status ────────────────┐    │
└──────────────────────────────┴──────────────────────────────────────────┘
     380px, virtualized                    fleksibel
```

Keuntungan: satu lead terbaca **tanpa pindah halaman**; kolom kiri tetap
padat pada 3 maupun 300 lead; Kanban tetap tersedia bagi yang menyukainya.

Mobile: daftar penuh → ketuk → detail sebagai halaman penuh (pola master-detail).

### 5.3 `/admin/dashboard`

Diagnosis: bukan rusak — metrik **sudah dibangun** di Checkpoint 4
`[EXTRACTED — app/admin/dashboard/page.tsx:44-56]`. Sepinya karena datanya
memang sedikit: 2 lead baru, 0 supplier, 6 artikel, 5 produk.

**Rekomendasi: JANGAN memperkaya dashboard sekarang.** Menambah grafik di
atas 3 baris data menghasilkan teater, bukan informasi.

```
USULAN: dashboard jadi "Beranda Kerja", bukan papan analitik

┌─────────────────────────────────────────────────────────────────────────┐
│ Selamat pagi, Jazil                        Senin, 19 Agustus 2026       │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─ PERLU TINDAKAN ANDA ──────────────────────────────────────────────┐ │
│ │ ▸ 2 lead baru belum direspons        [Buka →]                      │ │
│ │ ▸ 1 artikel masih draf               [Lanjutkan →]                 │ │
│ │ ▸ Belum ada supplier terdaftar       [Bagikan tautan →]            │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─ Lead ───────┬─ Supplier ───┬─ Artikel ────┬─ Produk ──────────────┐ │
│ │  2 baru      │  0 aktif     │  6 terbit    │  5 aktif              │ │
│ │  3 total     │              │  1 draf      │                       │ │
│ └──────────────┴──────────────┴──────────────┴───────────────────────┘ │
│                                                                         │
│ ┌─ Aktivitas terakhir ───────────────┬─ Pintasan ────────────────────┐ │
│ │ 14:20 Lead #RFQ-0031 masuk         │ [+ Artikel] [+ Produk]        │ │
│ │ 09:05 Artikel "SNI" diterbitkan    │ [Template WA] [Pengaturan]    │ │
│ └────────────────────────────────────┴───────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

Alternatif yang juga saya usulkan: **gabungkan dashboard ke `/admin/leads`**
dan jadikan Leads halaman pendaratan. Hemat satu klik untuk pekerjaan yang
paling sering dilakukan. Keputusan Anda — lihat §9.

### 5.4 Editor artikel

Masalah sekarang: field slug manual (`ArticleForm.tsx:103-108`) dan area
konten sempit `[EXTRACTED]`.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Artikel          Draf · tersimpan 14:32      [Pratinjau] [Terbitkan]  │
├──────────────────────────────────────────────┬──────────────────────────┤
│                                              │ ⚙ PENGATURAN             │
│  Judul artikel di sini…                      │ ┌──────────────────────┐ │
│  ══════════════════════════════════          │ │ URL                  │ │
│                                              │ │ /artikel/standar-sni │ │
│  [B] [I] [H2] [H3] [•] [1.] [🔗] [🖼]        │ │ [Ubah]  ← jarang     │ │
│  ─────────────────────────────────────       │ ├──────────────────────┤ │
│                                              │ │ Kategori    [▾]      │ │
│  Tulis di sini. Lebar baca ±68ch,            │ │ Thumbnail   [⬆]      │ │
│  tipografi SAMA dengan .prose-brand           │ ├──────────────────────┤ │
│  di halaman publik — apa yang Anda            │ │ SEO            ▾    │ │
│  lihat di sini persis yang terbit.            │ │ Meta title …/60     │ │
│                                              │ │ Meta desc  …/160     │ │
│                                              │ │ OG image    [⬆]      │ │
│                                              │ │ Canonical  (kosong)  │ │
│                                              │ └──────────────────────┘ │
└──────────────────────────────────────────────┴──────────────────────────┘
        fleksibel, min 640px                            320px
```

Kunci: **tanpa field slug di alur utama.** Slug muncul sebagai URL siap-pakai
dengan tombol "Ubah" yang jarang disentuh. Editor memakai `.prose-brand`
supaya WYSIWYG betulan.

Mobile: panel pengaturan jadi bottom-sheet; toolbar menempel di atas keyboard.

---

## 6. Review design-critic

| Risiko | Mitigasi |
|---|---|
| **Kanban sebagai kargo-kultus** | Sudah ditangkap: Kanban diturunkan jadi tab opsional, bukan tampilan utama |
| **Dashboard teater** | Ditolak eksplisit di §5.3 — angka kecil disajikan apa adanya |
| **Admin jadi "Beranda dengan tabel"** | Divider/parallax/reveal dibuang eksplisit di §4 |
| **Sidebar collapsible tanpa alasan** | Dibenarkan angka: +192px lebar data pada tabel lead |
| **Split-view mubazir di 3 lead** | Kolom kiri tetap masuk akal pada volume kecil; Kanban 5-kolom tidak |
| **Slop generik (kartu abu-abu seragam)** | Hierarki dibawa `ink-700` vs `neutral-600` + `.mono-tech` untuk angka |

Satu keberatan yang saya catat: **panel konteks 360px pada tablet berisiko
sempit**. Karena itu di 768–1279px ia jadi drawer, bukan kolom tetap.

---

## 7. Keputusan #1 — Strategi URL/slug artikel

Kondisi sekarang: kolom `slug` unik, diisi manual, **auto-regenerate dari
judul saat mode create**, dan ada peringatan `slugChangedOnPublished`
`[EXTRACTED — ArticleForm.tsx:38,60-66]`. Artinya mengubah judul artikel yang
sudah terbit **bisa merusak URL** — link dan peringkat SEO ikut hilang.

**Usulan: slug dibekukan saat publish pertama + tabel riwayat + redirect 301.**

- Draf: slug ikut judul (bebas berubah, belum ada yang menaut)
- Publish pertama: slug **dibekukan**, tidak pernah auto-regenerate lagi
- Admin boleh mengubah manual (tombol "Ubah") → slug lama masuk
  `article_slug_history`, `/artikel/<slug-lama>` → **301** ke slug baru

Migrasi (ADDITIVE, aman — **belum dieksekusi**):

```sql
CREATE TABLE public.article_slug_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id  UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    old_slug    TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_article_slug_history_slug ON public.article_slug_history(old_slug);
```

Tidak ada perubahan destruktif. Kolom `articles.slug` tetap apa adanya.

## 8. Keputusan #2 — Library rich-text

**Temuan penting: TipTap SUDAH terpasang dan dipakai** — `@tiptap/react`,
`starter-kit`, `extension-image`, `extension-link` v3.28
`[EXTRACTED — package.json + RichTextEditor.tsx]`. Jadi ini keputusan
*lanjut atau ganti*, bukan mulai dari nol.

| Kandidat | Untung | Rugi | Penilaian |
|---|---|---|---|
| **TipTap** (terpasang) | sudah jalan, headless, ekstensi lengkap, kontrol penuh atas markup | toolbar "ala Medium" (bubble/slash) harus dirakit sendiri | **Rekomendasi** — nol biaya migrasi, cukup ditingkatkan |
| **Plate** (Slate) | komponen siap pakai gaya Notion | migrasi total, bundle besar, Slate sering breaking | Tidak sepadan |
| **Lexical** (Meta) | ringan, performa bagus | ekosistem upload gambar belum matang, perlu banyak kode sendiri | Tidak sepadan |

Semua kandidat berjalan lokal — **nol SaaS eksternal**, sesuai batasan Anda.

⚠️ **Catatan penting:** `isomorphic-dompurify` yang menyanitasi keluaran
editor inilah sumber bug produksi `/artikel` kemarin. Keputusan `sanitize-html`
(§11) berkaitan langsung dengan pilihan editor ini.

## 9. Keputusan #3 — SEO artikel

Kolom yang **sudah ada**: `meta_title`, `meta_description`, `og_image_path`,
`canonical_url` `[EXTRACTED — REST /articles]`. Yang belum: **UI admin untuk
mengisinya** — tiga dari empat kolom itu tidak bisa disentuh dari panel admin.

Rencana (detail di CP3, dikerjakan bersama `seo-llm-site-architect`):
JSON-LD `Article`, fallback `meta_title→title`, `og_image→thumbnail`,
`canonical→/artikel/{slug}`, dan validasi panjang 60/160 karakter di form.

---

## 10. Rencana checkpoint

| CP | Isi | Bergantung pada |
|---|---|---|
| **CP0** | Perbaikan jsdom (`sanitize-html`) — memblokir CP3 | Persetujuan Anda |
| **CP1** | Design system admin + shell: sidebar collapsible, grid multi-kolom, breakpoint tablet/mobile, audit dead-code | — |
| **CP2** | `/admin/leads` split-view + filter chip + Kanban jadi tab | CP1 |
| **CP3** | Editor artikel + slug-history + redirect 301 + form SEO | CP0, CP1, migrasi §7 |
| **CP4** | Dashboard "Beranda Kerja" (atau digabung ke Leads) | CP1, keputusan §5.3 |
| **CP5** | Produk, Supplier, Pengaturan, Template, error/loading/not-found | CP1 |

`/admin/proposal-settings` **dikecualikan di semua CP.**

Tiap CP: laporan tersendiri, tidak one-shot.

---

## 11. Yang perlu Jazil lakukan

### Wajib sebelum koding

1. **Putuskan perbaikan jsdom** (`sanitize-html`). `/artikel/<slug-baru>` masih
   500 di produksi — memblokir CP3 dan publikasi artikel baru.
2. **Putuskan §5.3**: dashboard tetap terpisah, atau digabung ke `/admin/leads`?
3. **Setujui skema `article_slug_history`** (§7) — additive, aman, belum dieksekusi.
4. **Konfirmasi TipTap dipertahankan** (§8).

### Untuk membuka audit visual (opsional tapi berharga)

Chrome Anda sudah terhubung (`Browser 1`). Yang kurang hanya izin:

1. Buka ekstensi Claude in Chrome
2. Beri izin untuk domain `reka-cipta-webplatform.vercel.app` **dan**
   `localhost:3001`
3. Bilang ke saya "silakan audit visual" — saya akan minta Anda memilih
   browser lebih dulu, lalu login memakai `ADMIN_TEST_EMAIL` /
   `ADMIN_TEST_PASSWORD` dari `.env.local` (nilainya tidak akan saya cetak)

Tanpa ini saya tetap bisa lanjut — wireframe dan rencana di atas tidak
bergantung padanya. Yang hilang hanya kemampuan memergoki masalah tampilan
yang tidak terbaca dari kode.

### Keamanan — masih terbuka dari audit sebelumnya

- Matikan signup publik di Supabase
- Rotasi `ADMIN_TEST_PASSWORD`
- Hapus `app/api/debug-runtime` setelah CP0 selesai
