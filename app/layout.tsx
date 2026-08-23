import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { SITE_URL } from '@/lib/site-url'

export const metadata: Metadata = {
  title: {
    default: 'CV Reka Cipta Indonesia — Distributor Garam Industri Bersertifikat SNI',
    template: '%s — CV Reka Cipta Indonesia',
  },
  description:
    'Distributor garam lokal bersertifikat SNI untuk kebutuhan industri Indonesia. Menghubungkan petani garam dengan mitra industri.',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName: 'CV Reka Cipta Indonesia',
    locale: 'id_ID',
    type: 'website',
  },
  verification: {
    google: '__Oqw_lgPKu_Z7rVotBiGGKu1YCvIFiEY3-z-N7hah8',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="antialiased flex flex-col min-h-dvh">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
