import Image from 'next/image'
import type { Product } from '@/types/api'

interface ProductHeroProps {
  product: Product
}

export function ProductHero({ product }: ProductHeroProps) {
  const paragraphs = product.description?.split('\n\n') ?? []

  return (
    <section className="container mx-auto grid gap-8 px-4 py-8 md:grid-cols-12 md:py-12">
      <div className="md:col-span-5">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-50">
          {product.photo_url ? (
            <Image
              src={product.photo_url}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400">
              Tidak ada foto
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 md:col-span-7">
        {product.is_sni && (
          <span className="inline-flex w-fit items-center rounded bg-brand-teal-50 px-3 py-1 text-sm font-medium text-brand-teal-700">
            Bersertifikat SNI
          </span>
        )}

        <h1 className="text-3xl font-bold text-ink-700 md:text-4xl">{product.name}</h1>
        <p className="font-mono text-lg text-neutral-500">{product.code}</p>

        {paragraphs.length > 0 && (
          <div className="space-y-3">
            {paragraphs.map((paragraph, i) => (
              <p key={i} className="text-base leading-relaxed text-neutral-700">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
