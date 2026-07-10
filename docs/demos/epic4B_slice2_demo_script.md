# Demo Script — Epic 4B Slice 2 (AI Proposal Generator)

**Audiens:** Irwan Sugianto (klien)
**Prasyarat sebelum demo ini boleh dijalankan:**
- Gate 1 (Docker/Railway deploy WeasyPrint) clear
- Gate 2 (Prompt Quality Sign-off — 5 proposal sample approved Jazil) clear
- Gate 3 (Visual QA + E2E + regresi Slice 1) clear
- `dev` sudah di-merge ke `main`, production stable
- Minimal 1 lead test/non-sensitif tersedia untuk live demo (jangan pakai data customer nyata yang sedang aktif ditangani)

Referensi: `CLAUDE_CODE_GUIDE_epic4B_slice2_proposal-generator.md` — STOP GATE 4.

---

## 1. Konteks (±1 menit)

- "Ini fitur AI Proposal Generator. Dari halaman detail lead, Anda bisa generate proposal
  penawaran dalam ±15 detik, tanpa perlu menulis manual."
- **Set ekspektasi cost:** "Setiap generate = sekitar $0.02 (~Rp 320). Untuk 100 proposal/bulan,
  totalnya sekitar $2 (~Rp 32rb). Regenerate kalau kurang puas, cost-nya sama seperti generate awal."

## 2. Live Generate — Klien Sendiri yang Trigger (±5 menit)

- Serahkan kontrol ke Irwan.
- Klien buka `/admin/leads`, pilih 1 lead test, buka detail.
- Klien klik **"Generate Proposal (Quick Mode)"** sendiri.
- Tunggu bersama ±10-15 detik sambil preview muncul di iframe.
- Klien baca hasilnya — perhatikan reaksi: apakah kesan pertama positif?

## 3. Preview + Download + Kirim (±3 menit)

- Klien scroll preview iframe, baca isi proposal (5 section: pembukaan, tentang perusahaan,
  rekomendasi produk, term penawaran, penutup).
- Klien klik **"Download PDF"** — cek file muncul di folder Download, buka, verifikasi konten
  match preview dan styling (heading teal, tabel rapi).
- **Kalau klien approve isi:** klik **"Kirim ke Customer"**
  - Dialog konfirmasi muncul ("Proposal akan dikirim sebagai PDF ke {email}. Aksi ini tidak bisa
    dibatalkan.")
  - Klien konfirmasi.
  - Verifikasi email masuk ke inbox test dengan PDF attachment, subject & body sesuai.

## 4. Demo Regenerate (±1 menit)

- "Kalau kurang puas dengan versi pertama, klik **Regenerate** — dapat versi baru dalam ~15 detik."
- Klien klik Regenerate, bandingkan v1 vs v2 (isi akan berbeda karena LLM non-deterministik,
  tapi struktur & tone harus tetap konsisten).
- Catatan: versi lama tidak disimpan (no version history di MVP Slice 2) — jelaskan ini ke klien.

## 5. Handover & Cost Reminder

- Sampaikan dokumentasi cara pakai (kalau ada screencast/tertulis).
- **Reminder cost:** "Sebaiknya review preview dulu sebelum kirim ke customer — regenerate cost-nya
  sama dengan generate pertama."
- **Set ekspektasi spending:** "Kalau usage bulanan naik di atas $10, kita review lagi budget-nya."
- Sampaikan roadmap: "Kalau nanti butuh ubah gaya bahasa/prompt AI, atau custom header/logo di PDF,
  itu ada di roadmap Slice 3 — tapi kita tunggu dulu Anda pakai fitur ini 1-2 bulan supaya tahu
  persis apa yang perlu di-customize."

---

## Sinyal Masalah Saat Demo

- **Klien komplain kualitas proposal:** catat feedback detail (bagian mana yang bermasalah),
  bawa balik untuk iterasi prompt lanjutan — bukan alasan untuk skip fitur.
- **Klien struggle dengan flow generate/preview/kirim:** catat sebagai kandidat perbaikan UX
  (post-MVP), bukan blocker sign-off kalau fungsi intinya tetap jalan.
- **Klien tanya soal kustomisasi prompt/template:** jawab sesuai roadmap Slice 3, tapi tegaskan
  itu di-trigger oleh kebutuhan nyata setelah pemakaian, bukan langsung dikerjakan sekarang.

## Setelah Demo

- Kalau klien sign-off: **Epic 4 MVP dianggap complete** (Slice 1 CRM Pipeline + Slice 2 Proposal
  Generator keduanya live dan diterima klien).
- Update `docs/EPIC4/` atau tracker internal dengan tanggal sign-off + catatan feedback klien.
