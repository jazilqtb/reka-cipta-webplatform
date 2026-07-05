'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs } from '@base-ui/react/tabs'
import { ProductGrid } from './ProductGrid'
import type { Product, ProductCategory } from '@/types/api'

interface CategoryFilterTabsProps {
  products: Product[]
}

type TabValue = 'all' | ProductCategory

const TAB_LABELS: Record<TabValue, string> = {
  all: 'Semua',
  halus: 'Garam Halus',
  kasar: 'Garam Kasar',
  industri: 'Garam Industri',
}

const TAB_VALUES = Object.keys(TAB_LABELS) as TabValue[]

function isTabValue(value: string | null): value is TabValue {
  return value !== null && (TAB_VALUES as string[]).includes(value)
}

export function CategoryFilterTabs({ products }: CategoryFilterTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabValue>(() => {
    const kategori = searchParams.get('kategori')
    return isTabValue(kategori) ? kategori : 'all'
  })

  // Sync URL saat tab berubah (tanpa scroll, tanpa nambah history entry)
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    if (activeTab === 'all') {
      params.delete('kategori')
    } else {
      params.set('kategori', activeTab)
    }
    const queryString = params.toString()
    const url = queryString ? `/produk?${queryString}` : '/produk'
    router.replace(url, { scroll: false })
  }, [activeTab, router, searchParams])

  const filteredProducts = useMemo(() => {
    if (activeTab === 'all') return products
    return products.filter((product) => product.category === activeTab)
  }, [products, activeTab])

  return (
    <Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
      <Tabs.List className="mb-8 flex gap-2 overflow-x-auto border-b border-neutral-200">
        {TAB_VALUES.map((value) => (
          <Tabs.Tab
            key={value}
            value={value}
            className="whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutral-600 transition-colors hover:text-ink-700 data-[active]:border-brand-teal-600 data-[active]:font-semibold data-[active]:text-brand-teal-700"
          >
            {TAB_LABELS[value]}
          </Tabs.Tab>
        ))}
      </Tabs.List>

      <Tabs.Panel value={activeTab}>
        {filteredProducts.length === 0 && activeTab !== 'all' ? (
          <div className="py-16 text-center">
            <p className="mb-4 text-neutral-600">Belum ada produk di kategori ini.</p>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className="text-sm font-medium text-brand-teal-600 underline-offset-4 hover:underline"
            >
              Lihat semua produk
            </button>
          </div>
        ) : (
          <ProductGrid products={filteredProducts} />
        )}
      </Tabs.Panel>
    </Tabs.Root>
  )
}
