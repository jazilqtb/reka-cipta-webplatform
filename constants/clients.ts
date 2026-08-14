// constants/clients.ts
// Epic 2 Slice 1 (E2-S1-CONST-01)
//
// Data klien aktif untuk marquee CredibilitySection (Beranda).
// Sumber: Fondasi Brand v1.0 §5.2 + konfirmasi klien (Fase 0:
// daftar boleh ditampilkan di website publik).
//
// SINKRONISASI: nama di sini harus konsisten dengan
// company_settings.client_list di DB (referensi admin).
// Update keduanya jika ada klien baru.
//
// Dipakai oleh: components/sections/CredibilitySection.tsx (FE-07)

export interface ClientEntry {
  /** Nama resmi perusahaan — tampil sebagai teks utama di kotak marquee */
  name: string
  /** Jenis industri — tampil sebagai teks sekunder di bawah nama */
  industry: string
  /** Volume referensi internal — TIDAK ditampilkan di publik */
  volumePerMonth?: string
  /**
   * RONDE 6 (2026-08) — path logo resmi klien (mis. /images/clients/{slug}.png),
   * PNG/SVG latar transparan. Kalau kosong, marquee CredibilitySection.tsx
   * fallback ke wordmark tipografis (nama perusahaan sebagai teks besar),
   * BUKAN ikon generik + keterangan industri seperti sebelumnya — logo
   * asli baru bisa dipasang setelah klien menyediakan filenya (lihat
   * catatan aset di laporan akhir Ronde 6).
   */
  logoUrl?: string
}

export const ACTIVE_CLIENTS: ClientEntry[] = [
  {
    name: 'PT. Surabaya Mekabox',
    industry: 'Industri Pengemasan',
    volumePerMonth: '20 ton/bulan',
  },
  {
    name: 'PT. Sejati Tritunggal Indah',
    industry: 'Water Treatment',
    volumePerMonth: '10 ton/bulan',
  },
  {
    name: 'PT. Cakrawala Cemerlang Box',
    industry: 'Industri Pengemasan',
    volumePerMonth: '1.5 ton/bulan',
  },
  {
    name: 'Unit Pengolahan Garam KKP',
    industry: 'Pengolahan Garam',
    volumePerMonth: '30 ton/bulan',
  },
  {
    name: 'Perusahaan Pengolah Limbah',
    industry: 'Water Treatment / Limbah',
    volumePerMonth: '20 ton/bulan',
  },
]

// Catatan untuk FE-07 (marquee seamless loop):
// duplicate array di komponen → const items = [...ACTIVE_CLIENTS, ...ACTIVE_CLIENTS]
// CSS translateX(-50%) bekerja karena konten persis 2x lipat.
