'use client'

import { useState, useMemo, useEffect, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
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

// Baca kategori dari URL via useSyncExternalStore — BUKAN useSearchParams()
// dari next/navigation. useSearchParams() bikin Next.js bailout seluruh
// subtree ke client-side-only rendering saat static generation (data-dgst
// BAILOUT_TO_CLIENT_SIDE_RENDERING), menghilangkan grid produk dari HTML
// awal (buruk untuk SEO & LCP karena /produk statis + ISR).
// useSyncExternalStore adalah cara resmi React membaca sumber eksternal yang
// beda antara server & client tanpa hydration mismatch — getServerSnapshot
// selalu null (server tidak tahu query param), lalu React otomatis koreksi
// ke nilai client sesaat setelah hydration, tanpa perlu setState di effect.
function subscribeToUrl(callback: () => void) {
  window.addEventListener('popstate', callback)
  return () => window.removeEventListener('popstate', callback)
}

function getUrlKategori(): string | null {
  return new URLSearchParams(window.location.search).get('kategori')
}

function getServerKategori(): string | null {
  return null
}

export function CategoryFilterTabs({ products }: CategoryFilterTabsProps) {
  const router = useRouter()
  const urlKategori = useSyncExternalStore(subscribeToUrl, getUrlKategori, getServerKategori)

  // overrideTab menang begitu user klik tab — supaya klik langsung responsif
  // tanpa nunggu round-trip router.replace() lalu useSyncExternalStore
  // (yang toh tidak akan refire untuk replaceState kita sendiri).
  const [overrideTab, setOverrideTab] = useState<TabValue | null>(null)
  const activeTab: TabValue = overrideTab ?? (isTabValue(urlKategori) ? urlKategori : 'all')

  // Sync URL saat tab berubah (tanpa scroll, tanpa nambah history entry).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (activeTab === 'all') {
      params.delete('kategori')
    } else {
      params.set('kategori', activeTab)
    }
    const queryString = params.toString()
    const url = queryString ? `/produk?${queryString}` : '/produk'
    router.replace(url, { scroll: false })
  }, [activeTab, router])

  const filteredProducts = useMemo(() => {
    if (activeTab === 'all') return products
    return products.filter((product) => product.category === activeTab)
  }, [products, activeTab])

  return (
    <Tabs.Root value={activeTab} onValueChange={(value) => setOverrideTab(value as TabValue)}>
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
              onClick={() => setOverrideTab('all')}
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
