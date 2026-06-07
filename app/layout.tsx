import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'CV Reka Cipta Indonesia — Distributor Garam Industri Bersertifikat SNI',
    template: '%s — CV Reka Cipta Indonesia',
  },
  description:
    'Distributor garam lokal bersertifikat SNI untuk kebutuhan industri Indonesia. Menghubungkan petani garam Madura dengan mitra industri.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rekaciptaindonesia.com'
  ),
  openGraph: {
    siteName: 'CV Reka Cipta Indonesia',
    locale: 'id_ID',
    type: 'website',
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
      </body>
    </html>
  )
}
