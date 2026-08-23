# LAPORAN RONDE 5 — 5 Poin Revisi

Ringkas, tabel. Prosa panjang sengaja dihindari (batasan hemat token).

## 1. Ran / Skipped / Planned / Manual

| Poin | CP | Isi | Status | Bukti |
|---|---|---|---|---|
| 2 | CP0 | Bug blokir tambah anggota tim | **Ran** | `saveAboutRows` diperbaiki; tambah/ubah/hapus diuji langsung di `/admin/tentang-kami` (data live), diverifikasi persist lewat reload halaman |
| 1 | CP1 | Kolom volume/satuan tumpang tindih | **Ran** | Root cause direproduksi di browser (`sak (25 kg)` melebar ke kolom Tanggal), diperbaiki, diverifikasi ulang di kedua tab (Pengiriman & Komitmen) dengan angka 6-digit `123456.78` |
| 3 | CP2-A | Hitungan tim statis | **Ran** | Diukur di `/tentang-kami`: 2 → 3 → 5 anggota, angka ikut berubah tanpa refresh cache basi (dev, tapi `revalidatePath` sudah ada di server action untuk prod) |
| 4 | CP2-B | Grid tim tidak center | **Ran** | Diuji visual dengan 2, 3, 5 (ganjil >4) anggota — semua center. 1 anggota **tidak diuji interaktif** (lihat §6), disimpulkan dari mekanisme flex yang sama |
| 5 | CP3 | Motif garis & kedalaman latar | **Ran** | 7 permukaan diverifikasi (lihat §3); kontras diukur nyata via DOM (bukan diperkirakan): 6,44–11,01:1, jauh di atas AA 4,5:1 |
| — | — | Viewport 414/720/1024/1440 | **Skipped (lingkungan)** | `resize_window` melapor berhasil tapi viewport CSS tidak bergerak (terkunci ~1568px kali ini, beda dari ~960px ronde sebelumnya) — batasan lingkungan yang sama, bukan diabaikan. Diuji nyata di ~1568px (mencakup ≥1440) dan diaudit statis untuk lebar sempit |

## 2. Diagnosis akar CP0

**BUKAN skema.** Migrasi `20260821100000_about_content.sql` sudah punya `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` sejak awal — diverifikasi langsung dari berkas migrasi, bukan diasumsikan.

**Kode jalur simpan**, di `saveAboutRows()` (`app/actions/about.ts`), dipakai bersama oleh timeline/misi/tim. Saat menambah entri baru sementara entri lama (yang sudah punya `id`) ikut dikirim dalam satu array `upsert()`, PostgREST menyatukan bentuk seluruh baris dalam satu batch — baris yang TIDAK punya `id` mendapat `id: null` eksplisit, yang menabrak `NOT NULL` walau kolomnya punya `DEFAULT`. `about_team` selalu punya ≥1 entri lama, jadi setiap penambahan langsung kena. Diperbaiki dengan menghasilkan `crypto.randomUUID()` di sisi kode untuk baris baru, sehingga bentuk baris dalam batch selalu seragam.

**Bug sekelas ini ADA di timeline & misi juga** (fungsi sama persis) — belum pernah dilaporkan kemungkinan karena belum ada yang mencoba menambah entri baru ke daftar yang sudah terisi. Satu perbaikan menutup ketiganya.

## 3. Berkas yang diubah per checkpoint

**CP0** — `app/actions/about.ts`

**CP1** — `components/admin/distribution/DistributionEntryForms.tsx`

**CP2** — `components/sections/AboutHero.tsx` · `app/(public)/tentang-kami/page.tsx` · `components/sections/OrgStructure.tsx`

**CP3** — `app/globals.css` (token `--color-hairline-grid-bright` + kelas `.surface-depth.line-motif-deep`) · `components/sections/AboutHero.tsx` · `components/product/ProductCatalogHero.tsx` · `components/product/ProductHero.tsx` · `components/sections/ContactHero.tsx` · `components/sections/PageHero.tsx` · `components/sections/ThankYouPanel.tsx` · `components/calculator/CalculatorResult.tsx`

**Sengaja TIDAK disentuh** (dikecualikan eksplisit): `components/sections/HowItWorks.tsx` (Alur Kerja, tetap `.surface-depth` polos) · `components/sections/IndustriesGrid.tsx` (kartu sektor, `.card-depth` tidak pernah punya motif garis).

## 4. Perubahan skema DB

**Nol.** Tidak ada migrasi baru — bug CP0 murni kode, bukan DB.

## 5. ACTION REQUIRED

Baru dari ronde ini:
- [ ] Tambah entri baru di `about_timeline` dan `about_mission` (bukan hanya `about_team`) untuk memverifikasi ulang perbaikan CP0 mencakup keduanya — sudah diperbaiki di kode, belum diuji end-to-end per tabel
- [ ] `constants/company-profile.ts` (`TEAM_MEMBERS`) — sudah tidak dipakai `AboutHero.tsx` lagi setelah CP2-A; cek apakah masih dipakai berkas lain sebelum dihapus (di luar cakupan ronde ini, tidak disentuh)

Menggantung dari ronde sebelumnya (digabung, belum berubah):
- [ ] Deploy backend ke Railway (perbaikan CP0 ronde 4 baru berlaku setelah deploy)
- [ ] Restart uvicorn produksi dengan `--reload` off / build baru
- [ ] Signup publik Supabase — tinjau apakah masih perlu aktif
- [ ] Rotasi `ADMIN_TEST_PASSWORD`
- [ ] Klaim asal Madura di database (data produk/perusahaan) — tinjau akurasi
- [ ] `meta_description` artikel Rembang — belum ditulis/ditinjau
- [ ] Istilah "ciba" — tindak lanjut belum jelas asalnya, perlu klarifikasi Jazil
- [ ] Lead uji tersisa di `/admin/leads` — cek dan bersihkan
- [ ] Logo final — placeholder masih terpasang
- [ ] Cold start Railway — pantau latensi permintaan pertama setelah idle
- [ ] `rfq_leads.status` vs `rfqs.status` berselisih (dicatat CP1 ronde 4) — statistik "deal" di beranda publik masih memakai `rfqs` yang belum sinkron

## 6. Yang TIDAK diverifikasi

- Grid tim dengan **1 anggota** — tidak diuji interaktif (menghapus salah satu dari 2 anggota real untuk turun ke 1 dianggap terlalu berisiko terhadap data produksi); disimpulkan aman dari mekanisme CSS yang sama (flex + justify-center) yang sudah terbukti benar untuk 2, 3, dan 5.
- Panel hasil kalkulator (`CalculatorResult.tsx`) dan halaman terima kasih RFQ tidak diverifikasi visual langsung untuk CP3 — motif garis dipasang lewat kelas yang identik dengan 5 permukaan lain yang SUDAH diverifikasi visual (termasuk `ThankYouPanel.tsx`, sepupu terdekat `CalculatorResult.tsx`), tapi belum di-screenshot sendiri.
- Viewport 414/720/1024 — lingkungan otomasi browser terkunci pada lebar CSS tertentu (resize_window tidak benar-benar mengubah viewport). Diuji nyata hanya di lebar besar (≈1568px). Perlu pengecekan manual oleh Jazil di perangkat sungguhan, terutama untuk grid tim `w-[calc(50%-0.75rem)]` di breakpoint sempit.
- Tidak ada API key/kredensial baru dipakai atau dicatat di sesi ini.
