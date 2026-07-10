import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import type { Product } from '@/types/api'

interface ProductCTAProps {
  product: Product
}

export function ProductCTA({ product }: ProductCTAProps) {
  const sampleHref = `/kontak?produk=${product.slug}&intent=sample`
  const quotationHref = `/minta-penawaran?produk=${product.slug}`

  return (
    <section className="bg-brand-teal-50 py-12 md:py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="mb-3 text-2xl font-semibold text-ink-700 md:text-3xl">
          Tertarik dengan {product.name}?
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-neutral-700">
          Tim kami siap membantu Anda dengan sampel produk atau penawaran harga sesuai
          kebutuhan.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={sampleHref} className={cn(buttonVariants({ variant: 'default', size: 'lg' }))}>
            Minta Sampel
          </Link>
          <Link href={quotationHref} className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
            Dapatkan Penawaran
          </Link>
        </div>
      </div>
    </section>
  )
}
