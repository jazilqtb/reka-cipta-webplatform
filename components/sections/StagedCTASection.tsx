// components/sections/StagedCTASection.tsx
// RONDE 5 (2026-08) — restrukturasi homepage (senior-ui-ux-orchestrator),
// mandat klien: "rancang ulang hierarki informasi & komponen dari nol,
// fokus discoverability & konversi", brand foundation WAJIB dipatuhi.
//
// Mengganti CTASection.tsx (satu CTA generik "Minta Penawaran" +
// "Hubungi Kami" untuk SEMUA pengunjung) dengan filosofi CTA staged-funnel
// dari Fondasi Brand v1.0 §7.3 — pengunjung B2B datang dalam tahap
// kesiapan yang sangat berbeda, dan CTA seragam untuk semua tahap justru
// menaikkan friction, bukan menurunkannya.
//
// 4 kartu = 4 tahap pengunjung, persis urutan & filosofi §7.3:
//   1. Baru & belum yakin      → Unduh Spesifikasi Teknis (zero-friction, tanpa form)
//   2. Tertarik, belum siap    → Minta Sampel Produk (komitmen rendah)
//   3. Siap bernegosiasi       → Dapatkan Penawaran Sekarang
//   4. Ingin bicara langsung   → Chat via WhatsApp (template siap kirim)
//
// Kartu 2 & 3 sama-sama mengarah ke /minta-penawaran — satu-satunya form
// yang tersedia (field "Keterangan Tambahan", PRD §5.2.1, menampung
// permintaan sampel). Ini transparan di copy, bukan berpura-pura dua
// jalur berbeda — sesuai Nilai 1 Fondasi Brand (Kepercayaan Melalui
// Transparansi): tidak ada trik yang disembunyikan dari mitra.
//
// Strip terpisah di bawah 4 kartu untuk persona supplier/petani — Fondasi
// Brand §7.5: "Jangan campurkan pesan untuk mitra pembeli dan mitra
// supplier dalam satu halaman yang sama tanpa pemisahan yang jelas."
// Dibedakan lewat sand-600, token yang di CLAUDE.md sudah didedikasikan
// untuk "Accent (supplier sections)" — bukan warna baru yang dikarang.
//
// Data: tidak ada fetch baru. Nomor WA & template pesan dari
// constants/navigation.ts + lib/wa-link.ts yang sudah ada (pola sama
// dengan Footer.tsx) — murni presentasi, tidak menyentuh layer data.

import Link from 'next/link'
import {
  DownloadSimpleIcon, FlaskIcon, HandshakeIcon, ChatCircleIcon,
  PlantIcon, ArrowRightIcon,
} from '@phosphor-icons/react/ssr'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { RevealWrapper } from '@/components/animations/RevealWrapper'
import { SectionDivider } from '@/components/decorative/SectionDivider'
import { generateWALink } from '@/lib/wa-link'
import { COMPANY_INFO } from '@/constants/navigation'

interface FunnelStage {
  stage: string
  title: string
  desc: string
  cta: string
  href: string
  icon: PhosphorIcon
  external?: boolean
}

const STAGES: FunnelStage[] = [
  {
    stage: 'Baru Mengenal Kami',
    title: 'Unduh Spesifikasi Teknis',
    desc: 'Lihat hasil uji laboratorium dan spesifikasi lengkap tiap produk — bisa diunduh langsung, tanpa isi form.',
    cta: 'Lihat 5 Produk',
    href: '/produk',
    icon: DownloadSimpleIcon,
  },
  {
    stage: 'Tertarik, Belum Siap Deal',
    title: 'Minta Sampel Produk',
    desc: 'Tulis kebutuhan sampel di kolom keterangan form penawaran — kami kirim untuk Anda uji sendiri.',
    cta: 'Minta Sampel',
    href: '/minta-penawaran',
    icon: FlaskIcon,
  },
  {
    stage: 'Siap Bernegosiasi',
    title: 'Dapatkan Penawaran Sekarang',
    desc: 'Isi volume dan jenis garam yang Anda butuhkan. Penawaran masuk ke email dalam 1×24 jam kerja.',
    cta: 'Minta Penawaran',
    href: '/minta-penawaran',
    icon: HandshakeIcon,
  },
  {
    stage: 'Ingin Bicara Langsung',
    title: 'Chat via WhatsApp',
    desc: 'Punya pertanyaan spesifik? Chat langsung dengan tim kami — direspons dalam 1×24 jam.',
    cta: 'Buka WhatsApp',
    href: generateWALink(
      COMPANY_INFO.contacts.wa1.display,
      'Halo, saya ingin bertanya tentang produk garam Reka Cipta Indonesia.'
    ),
    icon: ChatCircleIcon,
    external: true,
  },
]

// RONDE 6: bg ink-900 gelap → gradient teal cerah. Keluhan klien:
// "Background CTA hampir menyatu dengan Footer" — sebelumnya
// StagedCTASection & Footer sama-sama ink-900, tidak ada kontras di
// titik transisinya. Sekaligus menjawab keluhan umum "kusam/kurang
// cerah" (poin 1) tanpa mengubah warna primer brand-teal-600 itu
// sendiri (token itu tetap sama, dipakai di semua halaman/tombol —
// di luar wewenang refactor beranda). Footer (ink-900, gelap) di
// bawahnya sekarang kontras tegas terhadap gradient teal ini.
// RONDE 7: .bg-salt-texture (motif garis silang) dihapus dari sini —
// dinilai tidak profesional. Diganti radial glow sangat lembut
// (gradasi cahaya, bukan garis), masih relevan dgn motif kristal
// tapi tanpa hatching yang terkesan berisik. <SectionDivider> ditambah
// sbg penutup — Footer dirender di layout.tsx (dipakai semua halaman),
// jadi pembatas StagedCTA→Footer harus jadi bagian dari komponen ini
// sendiri, bukan disisipkan dari page.tsx.
//
// RONDE Tahap 8 (2026-08) — root-cause bug seam divider yg dilaporkan
// klien lagi ("garis lurus terlihat seperti tempelan"): gradient di
// sini masih `bg-gradient-to-br` (DIAGONAL) sementara <SectionDivider>
// di bawah adalah fill FLAT (fill-brand-teal-800). Fill flat cuma cocok
// di SATU titik gradient diagonal — persis pelajaran yg sudah
// dipecahkan utk ProductCatalogHero/ProductHero/AboutHero (lihat
// catatan panjang di sana). Fix: gradient jadi VERTIKAL murni
// (bg-gradient-to-b) — tepi bawah = brand-teal-800 konstan di seluruh
// lebar, match 1:1 dgn fill-brand-teal-800. Blob glow kedua yg tadinya
// nangkring PERSIS di "92% 100%" (pojok kanan-BAWAH — bersinggungan
// langsung dgn tepi divider!) dipindah ke area atas, pola sama dgn
// mesh-gradient Hero lain (diklaster di atas, tidak pernah menyentuh
// tepi bawah yg harus tetap flat).
export function StagedCTASection() {
  return (
    <>
    <section
      className="relative overflow-hidden bg-gradient-to-b from-brand-teal-600 via-brand-teal-700 to-brand-teal-800 px-4 py-14 md:py-20"
      aria-labelledby="next-step-heading"
    >
      {/* BUG (ditemukan & diperbaiki saat QA visual Ronde 7): glow
          sebelumnya ditaruh via inline `style.backgroundImage` LANGSUNG
          di elemen yang sama dengan class `bg-gradient-to-br` Tailwind —
          keduanya sama-sama set CSS `background-image`, inline style
          MENIMPA TOTAL gradient teal Tailwind (bukan menumpuk di atasnya),
          bikin section jadi putih polos & teks putih tak terbaca. Fix:
          glow jadi overlay <div> terpisah, radius FIXED (px, bukan %) —
          radial-gradient dgn stop persen di section selebar viewport bisa
          membengkak jadi ratusan px dan "mencuci" konten. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle 260px at 12% 0%, rgba(255,255,255,0.12), transparent), radial-gradient(circle 300px at 90% 6%, rgba(95,225,203,0.14), transparent)',
        }}
        aria-hidden="true"
      />
      {/* RONDE Tahap 3: satu blob parallax TAMBAHAN di atas glow statis
          di atas — bergerak halus mengikuti scroll (bukan diam), poin
          UMUM "Parallax & Background Kreatif". Diblur berat + opacity
          rendah supaya tetap dekoratif, tidak mengganggu keterbacaan
          teks kartu di atasnya. */}
      <div className="relative mx-auto max-w-7xl">
        <RevealWrapper>
          <div className="mx-auto max-w-2xl text-center">
            <p className="rule-index font-ui justify-center text-brand-teal-300">
              Mulai Kerja Sama
            </p>
            <h2
              id="next-step-heading"
              className="mt-3 text-balance font-ui text-2xl md:text-3xl font-semibold leading-tight text-white"
            >
              Pilih Langkah Sesuai <span className="font-medium text-brand-teal-200">Kesiapan</span> Anda
            </h2>
            {/* REDUNDANSI (CP2): kartu di bawah sudah berlabel tahap
                ("Baru Mengenal Kami", "Siap Bernegosiasi", …). */}
          </div>
        </RevealWrapper>

        {/* RONDE Tahap 3 (poin 4): 4 kartu stack 1-kolom di mobile
            memakan scroll vertikal panjang — diganti horizontal swipe,
            grid normal tetap mulai sm ke atas (tidak berubah). */}
        <div className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 md:mt-10 lg:grid-cols-4">
          {STAGES.map((s, i) => {
            const Icon = s.icon
            const inner = (
              <>
                {/* RONDE 7: badge .icon-hex dihapus — ikon berdiri sendiri
                    + hover zoom, konsisten dgn pola Sektor Industri. */}
                <Icon
                  size={24}
                  weight="duotone"
                  className="text-brand-teal-300 transition-transform duration-300 group-hover:scale-110"
                  aria-hidden="true"
                />
                <p className="font-ui mt-4 text-xs font-bold uppercase tracking-wide text-white/40">
                  {s.stage}
                </p>
                <h3 className="font-ui mt-1.5 text-lg font-semibold text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-white/65">
                  {s.desc}
                </p>
                <span className="link-arrow font-ui mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal-300 group-hover:text-brand-teal-200">
                  {s.cta}
                  <ArrowRightIcon weight="bold" className="arrow-icon h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </>
            )
            // RONDE 7: kartu terlalu transparan (panel-card-dark ~3% putih)
            // di atas gradient teal terasa lemah/tidak tegas — diganti
            // panel solid ink-900/85 (kontras kuat & "kokoh"), hover pakai
            // shadow+lift lembut (bukan border menyala, konsisten dgn
            // filosofi hover Katalog Produk).
            const className = 'group flex h-full flex-col rounded-2xl border border-white/10 bg-ink-900/85 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-xl hover:shadow-ink-950/40'

            return (
              <RevealWrapper
                key={s.title}
                variant="reveal-up"
                delay={i * 80}
                className="w-[78vw] shrink-0 snap-start sm:w-auto sm:shrink"
              >
                {s.external ? (
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.cta} — ${s.title}`}
                    className={className}
                  >
                    {inner}
                  </a>
                ) : (
                  <Link href={s.href} aria-label={`${s.cta} — ${s.title}`} className={className}>
                    {inner}
                  </Link>
                )}
              </RevealWrapper>
            )
          })}
        </div>

        {/* Strip supplier — persona berbeda (petani/produsen), sengaja
            dipisah visual dari 4 kartu mitra-pembeli di atas (§7.5).
            Aksen sand-600 (CLAUDE.md — "Accent (supplier sections)"). */}
        <RevealWrapper variant="reveal-up" delay={340}>
          <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-sand-600/25 bg-sand-600/10 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex flex-col items-center gap-3.5 sm:flex-row">
              <PlantIcon size={24} weight="duotone" className="shrink-0 text-sand-300" aria-hidden="true" />
              <div>
                <p className="font-ui text-sm font-semibold text-white">
                  Anda petani atau produsen garam lokal?
                </p>
                <p className="mt-0.5 text-sm text-white/60">
                  Kami aktif mencari mitra supplier dari sentra produksi Madura, Sampang, dan Sumenep.
                </p>
              </div>
            </div>
            <Link
              href="/jadi-supplier"
              aria-label="Daftarkan usaha garam Anda sebagai mitra supplier"
              className="font-ui rounded-xl inline-flex shrink-0 items-center gap-2 bg-sand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sand-500 focus-visible:outline-none focus-visible:shadow-focus-dark"
            >
              Daftarkan Usaha Garam Anda
              <ArrowRightIcon weight="bold" className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </RevealWrapper>
      </div>
    </section>
    <SectionDivider variant="wave" fromClassName="fill-brand-teal-800" toClassName="bg-ink-900" flip />
    </>
  )
}
