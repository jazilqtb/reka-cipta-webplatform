import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface ProductBreadcrumbProps {
  productName: string
}

export function ProductBreadcrumb({ productName }: ProductBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="container mx-auto px-4 pt-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
        <li>
          <Link href="/" className="hover:text-brand-teal-600">
            Beranda
          </Link>
        </li>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <li>
          <Link href="/produk" className="hover:text-brand-teal-600">
            Produk
          </Link>
        </li>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <li aria-current="page" className="font-medium text-ink-700">
          {productName}
        </li>
      </ol>
    </nav>
  )
}
