// constants/homepage-sections.ts
// SATU titik kendali untuk section beranda yang dimatikan sementara.
//
// Kenapa berkas sendiri, bukan komentar di tempat: section yang dimatikan
// lewat komentar tersebar hanya bisa ditemukan kembali lewat arkeologi git.
// Di sini statusnya terbaca sekali lihat, dan menyalakannya kembali cukup
// mengubah satu nilai.

export const HOMEPAGE_SECTIONS = {
  /** "Kenapa Mitra Mempercayai Reka Cipta" — empat pilar kepercayaan.
   *
   *  DIMATIKAN 2026-08-21 atas permintaan Jazil.
   *
   *  PERINGATAN SEBELUM DIBIARKAN MATI PERMANEN: blok ini adalah
   *  SATU-SATUNYA tempat di beranda yang menyebut dua hal berikut —
   *    · metode uji "SNI 3556:2016"
   *    · "Akta Notaris, NIB, dan NPWP"
   *  Keduanya masih ada di /tentang-kami, tapi TIDAK LAGI di beranda.
   *  Untuk pembeli procurement yang hanya membuka halaman depan, dua
   *  klaim kredibilitas itu kini tidak terlihat sama sekali. Lihat
   *  laporan CP0 ronde 3.
   */
  trustPillars: false,
} as const
