import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "CV Reka Cipta Indonesia — Distributor Garam Industri Bersertifikat SNI",
  description:
    "Distributor garam lokal bersertifikat SNI untuk kebutuhan industri Indonesia. Menghubungkan petani garam Madura dengan mitra industri.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
