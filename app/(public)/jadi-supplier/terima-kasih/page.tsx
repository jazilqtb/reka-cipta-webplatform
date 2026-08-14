// app/(public)/jadi-supplier/terima-kasih/page.tsx — Halaman konfirmasi
// setelah submit pendaftaran supplier.
// Epic 5 Customer-Facing (E5-CF-FE-07)
//
// Rendering : Static full — tidak ada data fetch, revalidate = false.
// Access    : Accept direct URL access (AR-04, sama pola dengan
//             /minta-penawaran/terima-kasih) — halaman ini tidak leak
//             data apapun, cuma static content, jadi TIDAK ada access
//             control (sessionStorage/cookie/referrer check). robots
//             noindex supaya tidak muncul di Google search.
//
// RONDE Tahap 11 (2026-08) — Design System Rollout (T5): diganti
// <ThankYouPanel> bersama dgn /minta-penawaran/terima-kasih. Copy &
// langkah berbeda (alur supplier: verifikasi 2-3 hari kerja, bukan
// penawaran 1x24 jam) — komponennya sama, isinya spesifik per alur.

import type { Metadata } from 'next'
import { ThankYouPanel, type NextStep } from '@/components/sections/ThankYouPanel'

export const revalidate = false

export const metadata: Metadata = {
  title: 'Pendaftaran Berhasil | CV Reka Cipta Indonesia',
  robots: { index: false, follow: false },
}

const STEPS: NextStep[] = [
  {
    title: 'Pendaftaran Diterima',
    desc: 'Data usaha garam Anda sudah masuk dan akan ditinjau oleh tim kemitraan kami.',
  },
  {
    title: 'Proses Verifikasi',
    desc: 'Kami memeriksa kesesuaian kapasitas produksi dan jenis garam dengan kebutuhan distribusi.',
  },
  {
    title: 'Tim Menghubungi Anda',
    desc: 'Hasil verifikasi disampaikan via WhatsApp dalam 2–3 hari kerja, beserta langkah kerja sama.',
  },
]

export default function TerimaKasihSupplierPage() {
  return (
    <ThankYouPanel
      eyebrow="Pendaftaran Terkirim"
      title="Pendaftaran Mitra Supplier"
      titleAccent="Berhasil Dikirim"
      subtitle="Terima kasih atas ketertarikan Anda menjadi mitra supplier CV Reka Cipta Indonesia."
      steps={STEPS}
      primaryCta={{ label: 'Kenali Perusahaan Kami', href: '/tentang-kami' }}
      secondaryCta={{ label: 'Kembali ke Beranda', href: '/' }}
    />
  )
}
