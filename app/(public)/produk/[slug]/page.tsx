import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createPublic } from '@/lib/supabase/public'
import { ProductHero } from '@/components/product/ProductHero'
import { SpecTable } from '@/components/product/SpecTable'
import { IndustryList } from '@/components/product/IndustryList'
import { LabDocDownload } from '@/components/product/LabDocDownload'
import { ProductCTA } from '@/components/product/ProductCTA'
import { mapProductRow } from '@/lib/product-mapper'
import type { Product, ProductRow } from '@/types/api'

export const revalidate = 3600

// Next.js mengembalikan HTTP 200 (bukan 404) saat notFound() dipanggil di
// dalam render on-demand untuk slug yang tidak ada di generateStaticParams
// (dokumentasi: notFound() di response yang di-stream tidak bisa set status
// code lagi setelah header terkirim). dynamicParams = false menghindari ini
// sepenuhnya — slug di luar 5 yang di-generate langsung 404 di level routing,
// sebelum komponen halaman dieksekusi sama sekali.
// Trade-off: produk baru dari Epic 3B (admin panel) baru bisa diakses
// setelah redeploy yang regenerate generateStaticParams — tidak ada fallback
// on-demand. Perlu didiskusikan ulang saat build Epic 3B.
export const dynamicParams = false

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const supabase = createPublic()
  const { data } = await supabase.from('products').select('slug').eq('is_active', true)
  return (data ?? []).map((row) => ({ slug: row.slug as string }))
}

const getProduct = cache(async (slug: string): Promise<Product | null> => {
  const supabase = createPublic()
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  return data ? mapProductRow(data as ProductRow) : null
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return { title: 'Produk tidak ditemukan | CV Reka Cipta Indonesia' }
  }

  const description = product.tagline ?? product.description?.slice(0, 160) ?? ''

  return {
    title: `${product.name} - ${product.code} | CV Reka Cipta Indonesia`,
    description,
    openGraph: {
      title: product.name,
      description,
      type: 'website',
      images: product.photo_url ? [{ url: product.photo_url }] : undefined,
    },
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? product.tagline ?? '',
    image: product.photo_url ?? undefined,
    sku: product.code,
    brand: {
      '@type': 'Brand',
      name: 'CV Reka Cipta Indonesia',
    },
    category: product.category,
    manufacturer: {
      '@type': 'Organization',
      name: 'CV Reka Cipta Indonesia',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Surabaya',
        addressCountry: 'ID',
      },
    },
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductHero product={product} />
      <SpecTable specs={product.specs} />
      <IndustryList industries={product.industries} />
      <LabDocDownload url={product.lab_doc_url} productName={product.name} />
      <ProductCTA product={product} />
    </main>
  )
}
