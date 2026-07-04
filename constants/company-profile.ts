// constants/company-profile.ts
// Single source of truth untuk semua data statis halaman Tentang Kami.
// Update file ini untuk mengubah konten halaman — tidak perlu edit komponen.

// ─── Timeline Sejarah ─────────────────────────────────────────────────────
export interface TimelineMilestone {
  year: number
  title: string
  description: string
}

export const COMPANY_TIMELINE: TimelineMilestone[] = [
  {
    year: 2018,
    title: 'Studi Banding di Sentra Garam Madura',
    description:
      'Tim melakukan survei langsung ke Kalianget & Sampang untuk memahami ekosistem petani garam lokal dan membuka jaringan kemitraan pertama.',
  },
  {
    year: 2019,
    title: 'Pendirian UD Kreasi Anak Bangsa',
    description:
      'Langkah awal memasuki industri distribusi garam dengan skala usaha dagang perorangan, membangun pengalaman operasional dan kepercayaan mitra pertama.',
  },
  {
    year: 2020,
    title: 'Transformasi menjadi CV Reka Cipta Indonesia',
    description:
      'Pendirian resmi badan hukum CV pada 17 November 2020, dengan legalitas penuh dari Kemenkumham. Tonggak komitmen jangka panjang dalam industri distribusi garam nasional.',
  },
]

// ─── Visi & Misi ─────────────────────────────────────────────────────────
// Sumber: Fondasi Brand v1.0
export const COMPANY_VISION =
  'Menjadi distributor garam terpercaya pilihan industri menengah Indonesia, yang dikenal karena konsistensi kualitas, transparansi dokumentasi, dan komitmen jangka panjang terhadap petani lokal.'

export interface MissionPoint {
  title: string
  description: string
}

export const COMPANY_MISSION: MissionPoint[] = [
  {
    title: 'Jaminan kualitas yang bisa diverifikasi',
    description:
      'Menyediakan portofolio garam multi-produk yang terstandarisasi SNI, lengkap dengan dokumentasi hasil uji laboratorium yang dapat diakses oleh setiap mitra kapan saja.',
  },
  {
    title: 'Kemitraan yang adil dengan petani',
    description:
      'Membangun hubungan distribusi yang konsisten dan adil dengan petani garam lokal di sentra produksi Madura dan Sampang, sebagai bentuk komitmen terhadap keberlanjutan rantai pasok domestik.',
  },
  {
    title: 'Respons yang tidak membuat menunggu',
    description:
      'Merespons setiap kebutuhan mitra — dari pertanyaan awal hingga penawaran harga — dengan standar kecepatan dan transparansi tertinggi.',
  },
  {
    title: 'Distribusi yang menjangkau',
    description:
      'Membangun jaringan distribusi yang efisien untuk menjamin ketersediaan garam berkualitas di wilayah-wilayah yang dibutuhkan mitra, tidak hanya di Surabaya dan sekitarnya.',
  },
  {
    title: 'Peningkatan standar yang berkelanjutan',
    description:
      'Terus meningkatkan standar dokumentasi, sertifikasi, dan layanan seiring pertumbuhan perusahaan — karena standar hari ini adalah minimum masa depan.',
  },
]

// ─── Struktur Organisasi ─────────────────────────────────────────────────
export interface TeamMember {
  name: string
  position: string
  photoPath: string  // relative to public/ — contoh: '/images/team/widril-fakki.jpg'
  initials: string   // fallback jika foto tidak tersedia
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Widril Fakki',
    position: 'Komisaris',
    photoPath: '/images/team/widril-fakki.png',
    initials: 'WF',
  },
  {
    name: 'Abdul Majid Abdillah',
    position: 'Direktur',
    photoPath: '/images/team/abdul-majid.png',
    initials: 'AM',
  },
  {
    name: 'Salman Al Halili',
    position: 'Manager Keuangan',
    photoPath: '/images/team/salman-al-halili.png',
    initials: 'SH',
  },
  {
    name: 'Irwan Sugianto',
    position: 'Manager Pemasaran',
    photoPath: '/images/team/irwan-sugianto.png',
    initials: 'IS',
  },
]

// ─── Dokumen Legalitas ────────────────────────────────────────────────────
export interface LegalDocument {
  id: string           // unique key, dipakai sebagai filename di bucket
  title: string        // nama tampil di UI
  subtitle?: string    // nomor dokumen jika ada
  filename: string     // nama file di Supabase Storage bucket 'legal-docs'
  thumbnailPath?: string  // path ke thumbnail di public/ (opsional)
}

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: 'akta-notaris',
    title: 'Akta Notaris',
    subtitle: 'Pendirian CV',
    filename: 'akta-notaris.pdf',
    thumbnailPath: '/images/legal-thumbnails/akta-notaris.png',
  },
  {
    id: 'nib',
    title: 'NIB',
    subtitle: 'No. 0280010102479',
    filename: 'nib.pdf',
    thumbnailPath: '/images/legal-thumbnails/nib.png',
  },
  {
    id: 'npwp',
    title: 'NPWP Perusahaan',
    subtitle: '96.674.473.2-609.000',
    filename: 'npwp.pdf',
    thumbnailPath: '/images/legal-thumbnails/npwp.png',
  },
  {
    id: 'kemenkumham',
    title: 'Status Hukum Kemenkumham',
    subtitle: 'Legalitas Penuh',
    filename: 'kemenkumham.pdf',
    thumbnailPath: '/images/legal-thumbnails/kemenkumham.png',
  },
]
