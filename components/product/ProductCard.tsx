import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import type { Product } from '@/types/api'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-50">
        {product.photo_url ? (
          <Image
            src={product.photo_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            Tidak ada foto
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {product.is_sni && (
          <span className="inline-flex w-fit items-center rounded bg-brand-teal-50 px-2 py-0.5 text-xs font-medium text-brand-teal-700">
            SNI
          </span>
        )}

        <div>
          <h3 className="text-lg font-semibold text-ink-700">{product.name}</h3>
          <p className="font-mono text-sm text-neutral-500">{product.code}</p>
        </div>

        {product.tagline && (
          <p className="line-clamp-2 text-sm text-neutral-600">{product.tagline}</p>
        )}

        <Link
          href={`/produk/${product.slug}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-auto w-full')}
        >
          Lihat Detail →
        </Link>
      </div>
    </article>
  )
}
