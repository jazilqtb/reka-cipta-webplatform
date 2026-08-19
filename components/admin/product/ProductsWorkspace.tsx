// components/admin/product/ProductsWorkspace.tsx
//
// CP5 (2026-08-19) — katalog produk disamakan bahasanya dengan Leads (CP2)
// dan Artikel (CP3.1): satu baris kendali, chip status, tabel padat.
//
// KENAPA TIDAK ADA HALAMAN (PAGINATION) DI SINI:
// Katalog produk berbeda sifat dari daftar artikel atau lead. Ia tumbuh dari
// keputusan bisnis, bukan dari waktu — lima produk hari ini, mungkin belasan
// beberapa tahun lagi, tapi tidak akan pernah ratusan. Menambahkan halaman
// justru merugikan: URUTAN (sort_order) adalah data yang bermakna di sini,
// dan memecahnya ke beberapa halaman membuat urutan katalog mustahil dilihat
// utuh. Pencarian dan saring tetap ada karena murah dan kadang berguna.
//
// Tabel tetap menampilkan foto: pada katalog, mengenali produk dari gambar
// jauh lebih cepat daripada membaca nama yang berbeda dua kata.

'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  MagnifyingGlassIcon, PencilSimpleIcon, ArrowSquareOutIcon, ImageIcon,
} from '@phosphor-icons/react/ssr'
import type { Product, ProductCategory } from '@/types/api'

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  halus: 'Garam Halus',
  kasar: 'Garam Kasar',
  industri: 'Garam Industri',
}

type StatusFilter = 'all' | 'active' | 'inactive'

export function ProductsWorkspace({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [category, setCategory] = useState<'all' | ProductCategory>('all')

  const counts = useMemo(() => ({
    all: products.length,
    active: products.filter((p) => p.is_active).length,
    inactive: products.filter((p) => !p.is_active).length,
  }), [products])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products.filter((p) => {
      if (status === 'active' && !p.is_active) return false
      if (status === 'inactive' && p.is_active) return false
      if (category !== 'all' && p.category !== category) return false
      if (!term) return true
      // Kode produk ikut dicari — di percakapan dengan mitra, produk lebih
      // sering disebut lewat kodenya ("PRO YD") daripada nama panjangnya.
      return (
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.slug.toLowerCase().includes(term)
      )
    })
  }, [products, search, status, category])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <MagnifyingGlassIcon
            size={16} weight="bold" aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau kode produk…"
            aria-label="Cari produk"
            className="h-9 w-full rounded-xl border border-ink-900/10 bg-white pl-9 pr-3 text-sm text-ink-700 placeholder:text-neutral-400 focus-visible:shadow-focus focus-visible:outline-none"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as 'all' | ProductCategory)}
          aria-label="Saring menurut kategori"
          className="h-9 rounded-xl border border-ink-900/10 bg-white px-2.5 text-sm text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
        >
          <option value="all">Semua kategori</option>
          {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Chip active={status === 'all'} onClick={() => setStatus('all')} label="Semua" count={counts.all} />
        <Chip active={status === 'active'} onClick={() => setStatus('active')} label="Aktif" count={counts.active} />
        <Chip active={status === 'inactive'} onClick={() => setStatus('inactive')} label="Nonaktif" count={counts.inactive} />
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-900/[0.07] bg-white">
        {visible.length === 0 ? (
          <p className="p-10 text-center text-sm text-neutral-500">
            {products.length === 0
              ? 'Belum ada produk di katalog.'
              : 'Tidak ada produk yang cocok dengan filter ini.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-ink-900/[0.07] bg-neutral-50/70">
                <tr className="font-ui text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="w-16 px-4 py-2.5">Foto</th>
                  <th className="px-4 py-2.5">Produk</th>
                  <th className="w-24 px-4 py-2.5">Kode</th>
                  <th className="w-36 px-4 py-2.5">Kategori</th>
                  <th className="w-24 px-4 py-2.5">Status</th>
                  <th className="w-20 px-4 py-2.5 text-right">Urutan</th>
                  <th className="w-28 px-4 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/[0.05]">
                {visible.map((p) => (
                  <tr key={p.id} className={p.is_active ? 'transition-colors hover:bg-neutral-50' : 'bg-neutral-50/40'}>
                    <td className="px-4 py-2.5">
                      <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-neutral-100">
                        {p.photo_url ? (
                          <Image
                            src={p.photo_url}
                            alt=""
                            fill
                            sizes="44px"
                            className={['object-cover', p.is_active ? '' : 'grayscale'].join(' ')}
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-neutral-300">
                            <ImageIcon size={16} weight="duotone" aria-hidden="true" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="font-ui block truncate font-medium text-ink-700 hover:text-brand-teal-600"
                      >
                        {p.name}
                      </Link>
                      {p.tagline && (
                        <span className="mt-0.5 block truncate text-[11px] text-neutral-500">{p.tagline}</span>
                      )}
                    </td>
                    <td className="mono-tech px-4 py-2.5 text-xs text-neutral-600">{p.code}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-ui rounded-lg bg-brand-teal-50 px-2 py-0.5 text-[11px] font-medium text-brand-teal-700">
                        {CATEGORY_LABELS[p.category]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={[
                        'font-ui inline-flex items-center gap-1.5 text-[11px] font-medium',
                        p.is_active ? 'text-success-700' : 'text-neutral-500',
                      ].join(' ')}>
                        <span
                          aria-hidden="true"
                          className={['h-1.5 w-1.5 rounded-full', p.is_active ? 'bg-success-600' : 'bg-neutral-300'].join(' ')}
                        />
                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="mono-tech px-4 py-2.5 text-right text-xs text-neutral-500">{p.sort_order}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {p.is_active && (
                          <Link
                            href={`/produk/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Lihat di katalog publik"
                            aria-label="Lihat di katalog publik"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink-900/10 text-neutral-600 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none"
                          >
                            <ArrowSquareOutIcon size={15} weight="bold" aria-hidden="true" />
                          </Link>
                        )}
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          title="Sunting produk"
                          aria-label="Sunting produk"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink-900/10 text-neutral-600 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none"
                        >
                          <PencilSimpleIcon size={15} weight="duotone" aria-hidden="true" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mono-tech text-xs text-neutral-400">
        {visible.length === products.length
          ? `${products.length} produk`
          : `${visible.length} dari ${products.length} produk`}
      </p>
    </div>
  )
}

function Chip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'font-ui flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors duration-100',
        'focus-visible:shadow-focus focus-visible:outline-none',
        active
          ? 'border-brand-teal-600 bg-brand-teal-600 text-white'
          : count === 0
            ? 'border-ink-900/[0.07] bg-white text-neutral-400'
            : 'border-ink-900/10 bg-white text-ink-700 hover:border-brand-teal-600/40',
      ].join(' ')}
    >
      {label}
      <span className={['mono-tech text-[11px]', active ? 'text-white/80' : 'text-neutral-400'].join(' ')}>{count}</span>
    </button>
  )
}
