// components/sections/CredibilitySection.tsx
// Epic 2 Slice 1 (E2-S1-FE-07) — Wireframe v1.0 §6.
// RONDE 6 (2026-08) — evaluasi & eksekusi 3 keluhan klien atas section ini:
//
// (a) "Terlalu banyak ruang, 'Bukti 01' kaku, ikon+frame tidak menyatu"
//     — DISETUJUI semua. Pilar diubah dari kartu kotak 4-kolom (dgn
//     .icon-hex badge + label "Bukti NN") jadi baris bullet 2-kolom TANPA
//     kartu/border/frame — ikon polos berwarna langsung di sebelah teks,
//     lebih ringkas & terasa custom, bukan modul template berulang.
// (b) BUG WAJIB: fade-mask marquee tidak flush ke pinggir layar (agak ke
//     tengah). Root cause: fade + track sebelumnya jadi children dari
//     `<div className="mx-auto max-w-7xl px-4">` — jadi "left-0/right-0"
//     merujuk ke tepi KOLOM 1280px yang di-center (ada margin kosong di
//     kanan-kirinya di layar lebar), bukan tepi SECTION/viewport asli.
//     FIX: blok marquee dipindah jadi sibling penuh-lebar di luar wrapper
//     max-w-7xl, langsung di dalam <section> (yang tanpa padding
//     horizontal) — fade sekarang benar-benar nempel di tepi section.
// (c) "Mitra butuh logo, bukan ikon" — DISETUJUI. constants/clients.ts
//     ditambah field opsional `logoUrl`. Ada file asli → tampilkan
//     <Image>. Belum ada → fallback wordmark tipografis (nama perusahaan
//     sbg teks besar), BUKAN ikon+keterangan industri seperti sebelumnya
//     (logo wall asli tidak pernah pakai ikon generik + caption).
//
// Server Component. Marquee infinite scroll via CSS keyframes
// (globals.css .marquee-track). A11y: marquee dekoratif (role region +
// aria-hidden), <ul className="sr-only"> berisi daftar statis yg sama.
// Reduced motion: globals.css nonaktifkan animasi, flex jadi wrap.

import Image from 'next/image'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { SealCheckIcon, ShieldCheckIcon, PlantIcon, LightningIcon } from '@phosphor-icons/react/ssr'
import { ACTIVE_CLIENTS } from '@/constants/clients'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

// Duplicate array → seamless loop (CSS translateX(-50%) bekerja
// karena konten = 2× isi aslinya, transisi balik tidak terlihat)
// MARQUEE_ITEMS (daftar mitra digandakan supaya loop terlihat mulus)
// dihapus bersama animasinya di CP0. Tanpa gerak, salinan kedua hanya
// mengulang nama yang sama persis di layar — persis keluhan "teks
// berulang" yang jadi pokok CP2.

// Pilar kepercayaan — proof points langsung dari Fondasi Brand v1.0
// §2.4 (Nilai 1 Transparansi, Nilai 2 Keandalan) & §6.3 (Proof Points).
// Klaim selalu spesifik, tidak pernah "kualitas terbaik" tanpa bukti.
interface Pillar {
  icon: PhosphorIcon
  title: string
  proof: string
}

const PILLARS: Pillar[] = [
  {
    icon: SealCheckIcon,
    title: 'Tersertifikasi SNI',
    proof: 'Kadar NaCl, air, KIO3, dan zat tak larut diuji dengan metode SNI 3556:2016.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Legalitas Lengkap',
    proof: 'Akta Notaris, NIB, dan NPWP dapat diverifikasi di halaman Tentang Kami.',
  },
  {
    icon: PlantIcon,
    title: 'Mitra Petani Langsung',
    proof: 'Bermitra dengan sentra produksi Madura, Sampang, dan Sumenep sejak 2018.',
  },
  {
    icon: LightningIcon,
    title: 'Respons Terjadwal',
    // (needs data dari Jazil) — versi sebelumnya menjanjikan "hitungan
    // menit" sementara HowItWorks, RFQForm, dan halaman terima kasih
    // menjanjikan 1×24 jam pada halaman yang sama. Dipakai angka yang
    // konservatif sampai waktu kirim penawaran yang sebenarnya diukur.
    proof: 'Setiap permintaan dijawab dalam 1×24 jam kerja, lengkap dengan harga dan ketersediaan stok.',
  },
]

export function CredibilitySection() {
  return (
    <section
      // RONDE Tahap 3: padding bawah dipangkas — jarak ke section Sektor
      // Industri (sama-sama bg-white, tanpa divider di antaranya) masih
      // dinilai klien terlalu lebar (poin 5).
      className="relative overflow-hidden bg-white pt-14 pb-8 md:pt-20 md:pb-10"
      aria-labelledby="credibility-heading"
    >
      <div className="mx-auto max-w-7xl px-4">
        {/* Heading */}
        <RevealWrapper>
          <div className="mx-auto mb-8 max-w-2xl text-center md:mb-12">
            <p className="rule-index font-ui justify-center text-brand-teal-600">
              Bukti &amp; Dokumentasi
            </p>
            <h2
              id="credibility-heading"
              className="mt-3 text-balance font-ui text-2xl md:text-3xl font-semibold leading-tight text-ink-700"
            >
              Kenapa Mitra <span className="font-medium text-brand-teal-600">Mempercayai</span> Reka Cipta
            </h2>
          </div>
        </RevealWrapper>

        {/* Pilar kepercayaan — baris bullet 2-kolom, TANPA kartu/border/
            frame ikon & TANPA label "Bukti NN" (RONDE 6). Lebih ringkas
            secara vertikal, ikon polos besar langsung membawa karakter. */}
        <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
          {PILLARS.map((pillar, index) => {
            const Icon = pillar.icon
            return (
              <RevealWrapper key={pillar.title} variant="reveal-up" delay={index * 70}>
                {/* RONDE 7: group-hover scale pada ikon — konsisten dgn
                    micro-interaction ikon Sektor Industri. */}
                <div className="group flex items-start gap-4">
                  <Icon
                    size={24}
                    weight="duotone"
                    className="mt-0.5 shrink-0 text-brand-teal-600 transition-transform duration-300 group-hover:scale-110"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-ui text-base font-bold text-ink-700">{pillar.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">{pillar.proof}</p>
                  </div>
                </div>
              </RevealWrapper>
            )
          })}
        </div>

        {/* Divider ke showcase mitra */}
        <div className="mx-auto mb-6 mt-8 flex max-w-md items-center gap-4 md:mt-10" aria-hidden="true">
          <span className="h-px flex-1 bg-ink-900/10" />
          <PlantIcon size={20} weight="duotone" className="text-sand-600" aria-hidden="true" />
          <span className="h-px flex-1 bg-ink-900/10" />
        </div>

        {/* RONDE 7: reveal-scale (bukan reveal-up default) — sedikit lebih
            dinamis utk heading section Mitra sesuai permintaan klien.
            heading (poin UMUM "Background Kreatif" + "tipografi Mitra
            lebih dinamis") — blob teal lembut, bergerak halus saat
            scroll, tidak mengganggu keterbacaan (opacity rendah + blur
            berat, z-index di bawah teks). */}
        <div className="relative">
          <RevealWrapper variant="reveal-scale" className="relative">
            <div className="mb-6 text-center md:mb-8">
              <p className="rule-index font-ui justify-center text-brand-teal-600">Dipercaya Oleh</p>
              <h3 className="mt-3 font-ui text-2xl font-bold text-ink-700 md:text-3xl">
                Mitra Distribusi <span className="font-medium text-brand-teal-600">Aktif</span> Kami
              </h3>
            </div>
          </RevealWrapper>
        </div>

        {/* Daftar accessible utk screen reader — disembunyikan visual */}
        <ul className="sr-only">
          <li>Perusahaan-perusahaan yang menjadi mitra distribusi aktif:</li>
          {ACTIVE_CLIENTS.map((c) => (
            <li key={c.name}>
              {c.name} — {c.industry}
            </li>
          ))}
        </ul>
      </div>

      {/* Dinding logo statis. Dulu marquee bergerak dengan dua salinan
          daftar + dua mask gradient di tepi. Setelah geraknya dicabut
          (motion policy §7), mask itu hanya menutupi nama mitra yang diam,
          dan salinan kedua hanya mengulanginya. Keduanya dihapus: daftar
          membungkus dan seluruh mitra terbaca sekaligus, juga di ponsel.
          Tetap aria-hidden — <ul className="sr-only"> di atas sudah
          menyampaikan daftar yang sama ke pembaca layar. */}
      <div className="mx-auto max-w-5xl px-4" aria-hidden="true">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 md:gap-x-12">
          {ACTIVE_CLIENTS.map((client) => (
            <div key={client.name} className="flex h-12 items-center justify-center">
              {client.logoUrl ? (
                <Image
                  src={client.logoUrl}
                  alt={client.name}
                  width={140}
                  height={48}
                  className="h-9 w-auto object-contain grayscale transition-all duration-150 hover:grayscale-0"
                />
              ) : (
                <span className="font-ui whitespace-nowrap text-base font-semibold tracking-tight text-ink-900/35 transition-colors duration-150 hover:text-ink-900/70">
                  {client.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4">
        {/* Kalimat penutup */}
        <p className="mt-6 text-center text-sm text-neutral-700 md:mt-8">
          {ACTIVE_CLIENTS.length}+ mitra industri mempercayakan pasokan garam mereka
          kepada kami — bergabunglah sebagai berikutnya.
        </p>
      </div>
    </section>
  )
}
