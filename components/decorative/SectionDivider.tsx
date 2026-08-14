// components/decorative/SectionDivider.tsx
// RONDE 7 (2026-08) — pembatas antar-section homepage. Keluhan klien:
// pemisah antar-section yang cuma garis lurus flat terkesan basic,
// terutama di titik transisi warna kontras tinggi (terang↔gelap).
//
// Teknik: elemen ini adalah <div> ber-background warna section DI BAWAH,
// berisi <svg><path> terisi warna section DI ATAS yang "menjorok turun"
// membentuk kurva — sehingga terlihat sbg tepi section atas yang
// melengkung/miring, bukan potongan lurus. Murni dekoratif (aria-hidden),
// tidak menyentuh data/layout section manapun — disisipkan sbg elemen
// sibling independen di antara section di app/(public)/page.tsx.
//
// 3 variant BERBEDA (bukan 1 bentuk diulang — permintaan eksplisit klien
// "jangan statis, bervariasi sesuai konteks"), tiap variant juga bisa
// di-flip supaya pemakaian ulang (mis. wave dipakai 2×) tetap terasa beda.
//
// RONDE Tahap 5 (2026-08) — perbaikan "seam"/garis tempelan yg dilaporkan
// klien di /produk. Root cause SEBENARNYA di kasus itu adalah warna fill
// yg tidak match section gradient di atasnya (lihat catatan di
// ProductCatalogHero.tsx) — TAPI selain itu, teknik shape-divider ini
// juga rentan celah sub-pixel rendering murni (svg discretize/antialias
// beda 1 nilai dgn box induknya, terutama saat browser di-zoom atau di
// breakpoint non-integer). Sbg lapisan pengaman KEDUA (bukan pengganti
// fix warna, tambahan): svg digeser -1px ke atas + ditinggikan +1px,
// overlap sedikit ke section DI ATAS — aman selama warna fill sudah
// benar-benar cocok (kalau tidak cocok, overlap ini malah memperlebar
// pita warna salah 1px, makanya fix warna di section pemanggil tetap
// wajib jadi prioritas utama, ini murni jaring pengaman tambahan).

interface SectionDividerProps {
  variant: 'wave' | 'curve' | 'diagonal'
  /** Kelas `fill-*` — warna section DI ATAS pembatas ini */
  fromClassName: string
  /** Kelas `bg-*` — warna section DI BAWAH (jadi latar elemen ini) */
  toClassName: string
  /** Mirror horizontal — variasi tambahan tanpa nambah path baru */
  flip?: boolean
}

const PATHS: Record<SectionDividerProps['variant'], string> = {
  // Gelombang dua-lengkung halus.
  wave: 'M0,0H1440V40C1200,90 960,90 720,50C480,10 240,10 0,60Z',
  // Satu kurva besar asimetris.
  curve: 'M0,0H1440V15C1000,100 440,100 0,25Z',
  // Miring tegas dengan sedikit lengkung — kesan lebih dinamis/tajam.
  diagonal: 'M0,0H1440V10C900,0 600,85 0,65Z',
}

export function SectionDivider({ variant, fromClassName, toClassName, flip }: SectionDividerProps) {
  return (
    <div
      className={`relative h-10 w-full overflow-hidden sm:h-16 md:h-20 ${toClassName}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className={`absolute -top-px inset-x-0 h-[calc(100%+1px)] w-full ${flip ? '-scale-x-100' : ''}`}
      >
        <path d={PATHS[variant]} className={fromClassName} />
      </svg>
    </div>
  )
}
