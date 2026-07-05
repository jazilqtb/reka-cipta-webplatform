import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createPublic } from '@/lib/supabase/public'
import { InnerPageHero } from '@/components/sections/InnerPageHero'
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
      <InnerPageHero
        title="Katalog Produk"
        subtitle="Portfolio garam industri berbasis data uji laboratorium"
        breadcrumb={[{ label: 'Beranda', href: '/' }, { label: 'Produk' }]}
      />
      <section className="container mx-auto px-4 py-12 md:py-16">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <CardSkeleton key={i} lines={3} />
              ))}
            </div>
          }
        >
          <CategoryFilterTabs products={products} />
        </Suspense>
      </section>
    </main>
  )
}
