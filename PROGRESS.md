# PROGRESS — Ronde 3 (14 poin revisi)

Branch: `feature/R3-dark-hero-crm`. Ditulis ulang setiap checkpoint.

| CP | Isi | Status |
|---|---|---|
| CP0 | Tema gelap + pembersihan hijau + sembunyikan pilar (4, 6, 5) | **SELESAI** |
| CP1 | Model data Company/Contact (12) | belum |
| CP2 | RFQ volume per produk + satuan + bug navigasi (1) | belum |
| CP3 | Dashboard operasi & distribusi (2, 14) | belum |
| CP4 | Tugas & follow-up (13) | belum |
| CP5 | Admin: foto tim, kompresi, mitra, email, jadwal artikel (7,3,8,9,11) | belum |
| CP6 | Performa admin (10) | belum |

## CP0 — SELESAI

**B. "Gradien hijau" — PENYEBAB DITEMUKAN.** Bukan warna dasarnya. Tiap
permukaan gelap punya dua *mesh gradient* radial dengan **rgba hijau lama
yang ditulis LITERAL**: `rgba(15,158,139)`, `rgba(27,191,170)`,
`rgba(4,43,38)`. Karena literal, retune token ronde lalu tidak
menyentuhnya, dan sapuan verifikasi saya waktu itu hanya mencari hex +
`rgba(11,125,110)` sehingga ketiganya lolos. 18 nilai di 10 berkas.
Seluruh mesh dicabut; permukaan jadi solid `.surface-dark`.
Bundle CSS: nol sisa dari 8 pola hijau lama yang diperiksa.

**A. Hero beranda gelap.** `.surface-dark` (steel-900). Overlay foto
dibalik putih→gelap, 55%→68%. Panel kaca putih khusus ponsel dicabut
(tugasnya menjamin kontras teks gelap; tidak relevan lagi).
Navbar TIDAK diubah: ia bar putih opak di atas hero, bukan menumpang
transparan — diverifikasi visual.

**KONTRAS — alat ukur saya sendiri sempat rusak.** Versi pertama mem-parse
`getComputedStyle().color` dengan regex angka; Tailwind v4 mengeluarkan
`oklab(...)` untuk warna beropacity, jadi regex mengambil L/a/b sebagai RGB
dan melaporkan 1,11:1 pada teks yang baik-baik saja. Diperbaiki memakai
canvas. Hasil sesudah perbaikan alat: **1 kegagalan nyata** — kata aksen
hero `marine-600` = 2,39:1 (butuh 3:1). Dipindah ke `marine-200` (10,2:1).
Pratinjau hero di admin ikut dijadikan gelap, karena ia mengklaim
"seperti yang dilihat pengunjung".
Sesudah: **0 kegagalan** di 6 halaman × 414/1440.

**C. Pilar kepercayaan disembunyikan** lewat `constants/homepage-sections.ts`
(satu titik kendali).
**TEMUAN PENTING:** `CredibilitySection.tsx` memuat DUA hal — pilar
kepercayaan DAN marquee mitra. Mematikan seluruh komponen akan ikut
mematikan marquee yang justru diminta dikembalikan ronde lalu. Hanya blok
pilar yang digerbangi; marquee terverifikasi masih tampil.
**KEHILANGAN KLAIM (terukur):** beranda kini TIDAK LAGI memuat "SNI
3556:2016" maupun "Akta Notaris, NIB, NPWP" di mana pun.

DESIGN-SYSTEM: §4.9 permukaan gelap, anti-pattern #16 (literal rgba).

## CP1 — SELESAI (model data Company -> Contact -> RFQ)

**EXPAND** (`20260821110000`): 6 tabel + 3 fungsi normalisasi. ADDITIVE murni.
`companies` · `contacts` · `rfqs` · `rfq_items` · `company_merge_candidates`
· `company_merges`. RLS: TIDAK ada akses publik — ini daftar pelanggan.

**MIGRATE** (`20260821110100`): idempoten lewat `rfqs.legacy_lead_id` UNIQUE.
4 rfq_leads -> 4 rfqs / 4 companies / 4 contacts / 12 rfq_items.
**NOL baris hilang. rfq_leads TETAP UTUH.**
Statistik hero: deal lama=0 baru=0, kota unik lama=0 baru=0 — TIDAK bergeser.

**KEPUTUSAN TERPENTING DI MIGRASI:** rfq_items hasil migrasi TIDAK punya
kuantitas. Baris lama menyimpan SATU volume untuk SEMUA jenis yang dicentang.
Menyalin 90 ton ke 4 jenis = 360 ton (mengarang); membagi rata = mengarang
angka yang tak pernah dikatakan siapa pun. Totalnya disimpan apa adanya di
`rfqs.legacy_total_qty_kg`; itemnya hanya mencatat JENIS.

**CONTRACT**: `supabase/pending-approval/CONTRACT_20260821_drop_rfq_leads.sql`
— TIDAK dijalankan, di luar folder migrations. Blast radius + sabuk pengaman
tertulis di dalamnya. **ROLLBACK** juga disediakan.

**DEDUPLIKASI — ambang disetel dari PENGUKURAN, bukan tebakan.**
Ambang awal 0,72 melewatkan justru kasus yang diminta: `maju jaya` vs
`maju jya` = 0,583. Diukur 7 pasangan; jurang antara salah-ketik (0,58–0,86)
dan benar-benar-beda (<=0,28) lebar, jadi ambang turun ke 0,50.
Empat sinyal berbobot: domain email kerja 0,95 > nama identik 0,85 >
telepon sama + nama berkerabat 0,80 > kemiripan nama >=0,50.
Penyedia email gratis DISARING — 2 lead ber-@gmail.com terbukti TIDAK
tergabung.
**Penggabungan otomatis TIDAK ADA di jalur kode mana pun.** Fungsi hanya
mengusulkan; `merge_companies()` menuntut is_admin() dan mencatat snapshot
supaya bisa dibatalkan lewat `undo_company_merge()`.

**BUKTI END-TO-END:** RFQ dikirim lewat endpoint sungguhan dengan nama
"PT. Mitracomm Ekasarana" (titik berbeda dari yang sudah ada) -> ditempatkan
di perusahaan yang SUDAH ADA (rfq=2), bukan membuat perusahaan kelima.
Satuan terkonversi: 40 ton -> 40.000 kg; 200 sak_50 -> 10.000 kg.

**Halaman baru** `/admin/perusahaan`: daftar perusahaan + jumlah RFQ,
tinjauan duplikat, riwayat penggabungan + tombol batalkan.

DESIGN-SYSTEM: §4.10 satuan & kuantitas, §4.3 diperluas.
