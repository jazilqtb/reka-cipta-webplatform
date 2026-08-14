// components/seo/StructuredData.tsx
// RONDE 5 (2026-08) — restrukturasi homepage, mandat klien Langkah 2:
// "discoverability (SEO/LLM-readable)".
//
// Homepage sebelumnya tidak punya structured data sama sekali — mesin
// pencari & LLM crawler (AEO/GEO: ChatGPT, Perplexity, Gemini, dll.)
// harus menyimpulkan sendiri dari teks visual bahwa Reka Cipta adalah
// distributor, di mana lokasinya, dan produk apa saja yang dijual. JSON-LD
// membuat fakta-fakta ini eksplisit & mesin-terbaca, tanpa mengubah
// tampilan sama sekali.
//
// Constraint arsitektur: KOMPONEN INI TIDAK MELAKUKAN FETCH APAPUN. Semua
// data diterima sebagai props dari app/(public)/page.tsx, yang sudah
// mengambilnya lewat getCompanySettings()/getProductsPreview() (fungsi
// data-fetching itu sendiri TIDAK disentuh oleh Ronde 5 — lihat catatan
// proteksi backend). Murni presentasi/metadata, sama seperti <Metadata>
// Next.js — bukan layer data baru.
//
// Skema yang dipakai:
// - Organization: identitas legal (nama resmi, alamat, kontak) — dari
//   constants/navigation.ts COMPANY_INFO (data statis yang sudah dipakai
//   Footer.tsx), BUKAN data yang dikarang baru.
// - ItemList of Product: 5 produk dari props `products` (fallback ke
//   FALLBACK_PRODUCTS kalau kosong, sinkron dengan ProductsPreview.tsx)
//   — nama, tagline, kode, URL kanonik per produk, spesifikasi NaCl kalau
//   tersedia. TIDAK menyertakan skema Offer/harga — Reka Cipta B2B
//   quote-based, tidak ada harga publik, jadi tidak boleh mengarang
//   skema harga yang tidak ada.
import { COMPANY_INFO } from '@/constants/navigation'
import type { CompanySettingsMap, Product } from '@/types/api'

const SITE_URL = 'https://rekaciptaindonesia.com'

interface StructuredDataProps {
  settings: CompanySettingsMap
  products: Product[]
}

export function StructuredData({ settings, products }: StructuredDataProps) {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: COMPANY_INFO.name,
    legalName: COMPANY_INFO.name,
    url: SITE_URL,
    description: COMPANY_INFO.description,
    // Distributor, bukan produsen — Fondasi Brand v1.0 §7.4: konsistensi
    // ini wajib di seluruh website, termasuk data terstruktur.
    additionalType: 'https://schema.org/Distributor',
    address: {
      '@type': 'PostalAddress',
      streetAddress: COMPANY_INFO.address.street,
      addressLocality: 'Surabaya',
      addressRegion: 'Jawa Timur',
      addressCountry: 'ID',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        telephone: `+${COMPANY_INFO.contacts.wa1.display.replace(/^0/, '62')}`,
        email: COMPANY_INFO.contacts.email,
        areaServed: 'ID',
        availableLanguage: ['id'],
      },
    ],
    ...(settings.partner_count && {
      knowsAbout: 'Distribusi garam industri bersertifikasi SNI',
    }),
  }

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE_URL}/#produk`,
    name: 'Produk Garam CV Reka Cipta Indonesia',
    itemListElement: products.slice(0, 5).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        '@id': `${SITE_URL}/produk/${p.slug}`,
        name: p.name,
        sku: p.code,
        description: p.tagline ?? p.description ?? undefined,
        url: `${SITE_URL}/produk/${p.slug}`,
        category: p.category,
        brand: { '@type': 'Organization', name: COMPANY_INFO.name },
        ...(p.is_sni && { award: 'Bersertifikasi SNI' }),
        ...(p.specs?.nacl_pct !== undefined && {
          additionalProperty: {
            '@type': 'PropertyValue',
            name: 'Kadar NaCl',
            value: `${p.specs.nacl_pct}%`,
          },
        }),
      },
    })),
  }

  return (
    <>
      {/* JSON-LD murni statis dari props terkontrol (bukan HTML pengguna) —
          pola standar Next.js untuk structured data, bukan XSS risk. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      {products.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
        />
      )}
    </>
  )
}
