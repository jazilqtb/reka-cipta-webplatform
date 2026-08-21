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
