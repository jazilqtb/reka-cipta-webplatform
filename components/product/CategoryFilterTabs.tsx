'use client'

import { useState, useMemo, useEffect, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs } from '@base-ui/react/tabs'
import { motion } from 'framer-motion'
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

  // RONDE Tahap 4: jumlah per kategori — sentuhan mono-tech kecil yang
  // sama bahasanya dgn angka statistik di seluruh beranda (mono-tech,
  // tabular-nums), bukan cuma label teks polos.
  const counts = useMemo(() => {
    const map: Record<TabValue, number> = { all: products.length, halus: 0, kasar: 0, industri: 0 }
    for (const p of products) map[p.category]++
    return map
  }, [products])

  return (
    <Tabs.Root value={activeTab} onValueChange={(value) => setOverrideTab(value as TabValue)}>
      {/* RONDE Tahap 4 — poin UMUM "interaksi": underline tab lama diganti
          segmented pill control (bahasa bentuk sama dgn .tag-pill di
          seluruh beranda) + indikator aktif yg SLIDE animasi (Framer
          Motion layoutId — bukan snap instan), konsisten dgn level
          interaksi Beranda baru. */}
      <div className="overflow-x-auto">
        <Tabs.List className="mb-8 inline-flex gap-1 rounded-full border border-ink-900/10 bg-white p-1 font-ui md:mb-12">
          {TAB_VALUES.map((value) => (
            <Tabs.Tab
              key={value}
              value={value}
              className="relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-ink-700/60 transition-colors duration-200 focus-visible:outline-none focus-visible:shadow-focus data-[active]:text-white"
            >
              {/* BUG (ditemukan & diperbaiki saat QA visual): `-z-10` di
                  sini bukan cuma menaruh indikator di belakang LABEL
                  (tujuan semula) — karena tombol tab (`position:relative`
                  TANPA z-index sendiri) tidak membentuk stacking context
                  baru, z-index NEGATIF pada child-nya "bocor" ke stacking
                  context PARENT (Tabs.List, `bg-white`), jadi pil teal
                  tenggelam total di BALIK background putih list-nya —
                  bukan sekadar di belakang teks. Fix: hapus z-index
                  negatif (urutan DOM — indikator dulu, baru label —
                  sudah cukup menaruhnya di bawah), label diberi
                  `relative z-10` eksplisit sbg jaminan. */}
              {activeTab === value && (
                <motion.span
                  layoutId="category-tab-pill"
                  className="absolute inset-0 rounded-full bg-brand-teal-600"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5">
                {TAB_LABELS[value]}
                <span className="mono-tech text-[10px] opacity-70">{counts[value]}</span>
              </span>
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </div>

      <Tabs.Panel value={activeTab}>
        {filteredProducts.length === 0 && activeTab !== 'all' ? (
          <div className="py-16 text-center">
            <p className="mb-4 text-neutral-600">Belum ada produk di kategori ini.</p>
            <button
              type="button"
              onClick={() => setOverrideTab('all')}
              className="link-arrow font-ui inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal-600 hover:text-brand-teal-700"
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
