import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createPublic } from '@/lib/supabase/public'
import { ProductCatalogHero } from '@/components/product/ProductCatalogHero'
import { CategoryFilterTabs } from '@/components/product/CategoryFilterTabs'
import { CardSkeleton } from '@/components/ui/skeletons'
import { mapProductRow } from '@/lib/product-mapper'
import type { ProductRow } from '@/types/api'

// ISR: revalidate setiap 1 jam
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Katalog Produk | CV Reka Cipta Indonesia',
  description:
    'Portofolio produk garam industri CV Reka Cipta Indonesia. 5 varian garam untuk industri makanan, farmasi, kimia, peternakan, dan lainnya. Bersertifikat SNI.',
  openGraph: {
    title: 'Katalog Produk Garam Industri',
    description: '5 varian garam berkualitas dari CV Reka Cipta Indonesia',
    type: 'website',
  },
}

export default async function ProdukPage() {
  const supabase = createPublic()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`)
  }

  const products = ((data ?? []) as ProductRow[]).map(mapProductRow)

  return (
    <main>
      <ProductCatalogHero />
      {/* RONDE Tahap 5: .bg-salt-grain (kisi garis diagonal tipis) DICABUT
          — klien eksplisit tidak suka motif garis apa pun di /produk,
          sekalipun versi terang & sangat halus yg sebelumnya dianggap
          "bukan stripes yg dimaksud". Diganti gradasi solid sangat halus
          (salt-50→white, vertikal) — bersih, tidak mendistraksi kartu
          produk, tetap terasa 1 keluarga visual dgn Beranda tanpa motif
          bertekstur. Titik AWAL gradient (salt-50) tetap match persis
          dgn `toClassName` SectionDivider di ProductCatalogHero.tsx. */}
      <section className="bg-gradient-to-b from-salt-50 to-white px-4 py-12 md:py-16">
        <div className="mx-auto max-w-7xl">
          <Suspense
            fallback={
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} lines={3} />
                ))}
              </div>
            }
          >
            <CategoryFilterTabs products={products} />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
