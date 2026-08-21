// components/decorative/SectionDivider.tsx
//
// RONDE 2026-08-21 — GEOMETRI DIGANTI TOTAL, API DIPERTAHANKAN.
//
// Versi sebelumnya menggambar tiga <path> SVG melengkung (wave, curve,
// diagonal) setinggi 40–80px di antara section. Itu bertentangan langsung
// dengan prinsip §1.3 DESIGN-SYSTEM ("Geometri yang tegas. Sudut kecil,
// garis tipis, sisi lurus. Bahan industri tidak membulat") — dan lengkung
// setinggi 80px bukan aksen kecil, ia salah satu bentuk terbesar di
// halaman. Dipakai 21 kali di 20 berkas.
//
// PENGGANTINYA: perpindahan warna bersisi LURUS, plus garis rambut
// steel-200 ketika kedua sisi sama-sama terang. Ketika kontras kedua sisi
// sudah kuat (mis. putih -> steel-900 footer), perpindahan warnanya SENDIRI
// sudah menjadi pembatas — menambah garis di situ hanya derau.
//
// Kenapa bukan "hapus saja": pembatas ini juga membawa jarak antar-section.
// Menghapus komponennya akan membuat dua bidang warna bertumbukan tanpa
// napas. Yang dibuang lengkungannya, bukan ruangnya.
//
// Prop `variant` dan `flip` DIPERTAHANKAN supaya 21 pemanggil tidak perlu
// disentuh — keduanya kini tidak memengaruhi bentuk, hanya tinggi. Prop
// `fromClassName` (dulu `fill-*`) juga dipertahankan dan sekarang diabaikan;
// dibersihkan saat pemanggil ditata ulang di ronde berikutnya.

interface SectionDividerProps {
  /** Dipertahankan utk kompatibilitas pemanggil. Kini hanya mengatur tinggi. */
  variant: 'wave' | 'curve' | 'diagonal'
  /** Dulu kelas `fill-*`. Diabaikan sejak bentuknya tidak lagi digambar SVG. */
  fromClassName?: string
  /** Kelas `bg-*` — warna section DI BAWAH pembatas ini. */
  toClassName: string
  /** Dipertahankan utk kompatibilitas. Tidak berpengaruh pada sisi lurus. */
  flip?: boolean
  /** Garis rambut di tepi atas. Default: hanya saat kedua sisi terang. */
  hairline?: boolean
}

/** `wave` dulu paling tinggi, `diagonal` paling rendah. Tinggi relatifnya
 *  dipertahankan supaya ritme halaman tidak berubah drastis — yang hilang
 *  hanya lengkungannya. */
const HEIGHT: Record<SectionDividerProps['variant'], string> = {
  wave: 'h-10 md:h-14',
  curve: 'h-8 md:h-12',
  diagonal: 'h-6 md:h-10',
}

/** Sisi gelap tidak butuh garis: perpindahan warnanya sudah jadi pembatas. */
function isDarkSurface(cls: string): boolean {
  return /(ink|steel)-(800|900|950)/.test(cls)
}

export function SectionDivider({
  variant,
  toClassName,
  hairline,
}: SectionDividerProps) {
  const showRule = hairline ?? !isDarkSurface(toClassName)

  return (
    <div
      aria-hidden="true"
      className={[
        'w-full',
        HEIGHT[variant],
        toClassName,
        showRule ? 'border-t border-steel-200' : '',
      ].join(' ')}
    />
  )
}
