// app/(public)/minta-penawaran/terima-kasih/page.tsx
// Epic 4 Customer-Facing (E4-CF-FE-05) — Halaman konfirmasi setelah submit RFQ.
//
// Rendering : Static full — tidak ada data fetch, revalidate = false.
// Access    : Accept direct URL access (AR-04/R-21). Halaman ini tidak
//             leak data apapun — cuma static content — jadi TIDAK ada
//             access control (sessionStorage/cookie/referrer check).
//             robots noindex supaya tidak muncul di Google search.
//
// RONDE Tahap 11 (2026-08) — Design System Rollout (T8): <main> putih
// polos + ikon Lucide statis diganti <ThankYouPanel> (Hero gelap +
// checkmark beranimasi + Next Steps eksplisit). Rendering/robots/access
// policy di atas TIDAK berubah.

import type { Metadata } from 'next'
import { ThankYouPanel, type NextStep } from '@/components/sections/ThankYouPanel'

export const revalidate = false

export const metadata: Metadata = {
  title: 'Terima Kasih | CV Reka Cipta Indonesia',
  robots: { index: false, follow: false },
}

// Langkah nyata sesuai alur RFQ yang ada (bukan janji yang dikarang):
// submit → tim menyiapkan proposal → dihubungi via WA 1x24 jam.
const STEPS: NextStep[] = [
  {
    title: 'Permintaan Diterima',
    desc: 'Detail kebutuhan Anda sudah masuk ke sistem kami dan diteruskan ke tim penawaran.',
  },
  {
    title: 'Proposal Disiapkan',
    desc: 'Tim menyusun penawaran harga sesuai jenis garam dan volume yang Anda cantumkan.',
  },
  {
    title: 'Kami Menghubungi Anda',
    desc: 'Penawaran dikirim via WhatsApp dalam 1×24 jam. Konfirmasi juga masuk ke email Anda.',
  },
]

export default function TerimaKasihPage() {
  return (
    <ThankYouPanel
      eyebrow="Permintaan Terkirim"
      title="Permintaan Penawaran Anda"
      titleAccent="Berhasil Dikirim"
      subtitle="Terima kasih. Tim kami sedang menyiapkan penawaran yang sesuai dengan kebutuhan Anda."
      steps={STEPS}
      primaryCta={{ label: 'Lihat Katalog Produk', href: '/produk' }}
      secondaryCta={{ label: 'Kembali ke Beranda', href: '/' }}
    />
  )
}
