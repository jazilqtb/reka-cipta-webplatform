// components/admin/article/ArticlesWorkspace.tsx
//
// CP3.1 (2026-08-19) — daftar artikel dirombak agar tetap terpakai di 100+.
//
// MASALAH VERSI LAMA: tabel polos tanpa cari, saring, urut, atau halaman.
// Pada 7 artikel itu terasa cukup; pada 100 artikel satu-satunya cara
// menemukan sesuatu adalah menggulir sambil membaca — dan setiap tindakan
// memicu router.refresh() yang memuat ulang SELURUH daftar.
//
// KEPUTUSAN: penyaringan dilakukan di KLIEN atas daftar penuh dari server.
// Untuk blog perusahaan (ratusan artikel, bukan ratusan ribu) ini memberi
// respons instan tanpa perlu endpoint pencarian, indeks, atau debounce.
// Batasnya jujur: di angka ribuan, muatan awalnya jadi berat dan penyaringan
// harus pindah ke server. Dicatat, bukan didiamkan.
//
// PEMBARUAN OPTIMISTIK: menghapus/menerbitkan langsung mengubah daftar di
// layar, tanpa menunggu router.refresh(). Gejala yang dilaporkan Jazil —
// "toast gagal muncul, tapi 3 detik kemudian tetap terhapus" — punya dua
// sebab: bug 204 di apiFetch (sudah diperbaiki) dan tidak adanya umpan balik
// selama request berjalan. Baris yang sedang diproses kini meredup dan
// menampilkan pemintal, jadi keadaan layar selalu jujur.

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  PlusIcon, MagnifyingGlassIcon, PencilSimpleIcon, TrashIcon, EyeIcon, EyeSlashIcon,
  CircleNotchIcon, CaretLeftIcon, CaretRightIcon, ArrowSquareOutIcon,
} from '@phosphor-icons/react/ssr'
import { toggleArticlePublish, deleteArticle, ApiFetchError } from '@/lib/api'
import { ARTICLE_CATEGORY_LABEL, ARTICLE_CATEGORY_OPTIONS } from '@/constants/articleCategories'
import type { ArticleCategory } from '@/types/api'

export interface ArticleRowData {
  id: string
  title: string
  slug: string
  category: ArticleCategory
  is_published: boolean
  view_count: number
  updated_at: string
}

const PER_PAGE = 25
type StatusFilter = 'all' | 'published' | 'draft'
type SortKey = 'recent' | 'oldest' | 'title' | 'views'

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: 'recent', label: 'Terbaru diubah' },
  { key: 'oldest', label: 'Terlama diubah' },
  { key: 'title',  label: 'Judul A–Z' },
  { key: 'views',  label: 'Paling banyak dibaca' },
]

export function ArticlesWorkspace({ initialArticles }: { initialArticles: ArticleRowData[] }) {
  const router = useRouter()
  const [articles, setArticles] = useState(initialArticles)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [category, setCategory] = useState<'all' | ArticleCategory>('all')
  const [sort, setSort] = useState<SortKey>('recent')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<string | null>(null)

  const counts = useMemo(() => ({
    all: articles.length,
    published: articles.filter((a) => a.is_published).length,
    draft: articles.filter((a) => !a.is_published).length,
  }), [articles])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const rows = articles.filter((a) => {
      if (status === 'published' && !a.is_published) return false
      if (status === 'draft' && a.is_published) return false
      if (category !== 'all' && a.category !== category) return false
      if (!term) return true
      // Slug ikut dicari: mengingat potongan URL sering lebih mudah
      // daripada mengingat judul persisnya.
      return a.title.toLowerCase().includes(term) || a.slug.toLowerCase().includes(term)
    })
    const sorted = [...rows]
    sorted.sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title, 'id')
      if (sort === 'views') return b.view_count - a.view_count
      const diff = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      return sort === 'oldest' ? -diff : diff
    })
    return sorted
  }, [articles, search, status, category, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const visible = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setPage(1) }
  }

  async function handleToggle(row: ArticleRowData) {
    setBusyId(row.id)
    const next = !row.is_published
    try {
      await toggleArticlePublish(row.id, { is_published: next })
      setArticles((prev) => prev.map((a) => (a.id === row.id ? { ...a, is_published: next } : a)))
      toast.success(next ? 'Artikel diterbitkan' : 'Artikel jadi draf')
      router.refresh()
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 401) router.push('/admin/login')
      else toast.error('Gagal mengubah status terbit')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(row: ArticleRowData) {
    if (!window.confirm(`Hapus artikel "${row.title}"? Tindakan ini tidak bisa dibatalkan.`)) return
    setBusyId(row.id)
    try {
      await deleteArticle(row.id)
      setArticles((prev) => prev.filter((a) => a.id !== row.id))
      toast.success('Artikel dihapus')
      router.refresh()
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 401) router.push('/admin/login')
      else toast.error('Gagal menghapus artikel')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Kendali ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <MagnifyingGlassIcon
            size={16} weight="bold" aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => resetPage(setSearch)(e.target.value)}
            placeholder="Cari judul atau URL…"
            aria-label="Cari artikel"
            className="h-9 w-full rounded-xl border border-ink-900/10 bg-white pl-9 pr-3 text-sm text-ink-700 placeholder:text-neutral-400 focus-visible:shadow-focus focus-visible:outline-none"
          />
        </div>

        <select
          value={category}
          onChange={(e) => resetPage(setCategory)(e.target.value as 'all' | ArticleCategory)}
          aria-label="Saring menurut kategori"
          className="h-9 rounded-xl border border-ink-900/10 bg-white px-2.5 text-sm text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
        >
          <option value="all">Semua kategori</option>
          {ARTICLE_CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => resetPage(setSort)(e.target.value as SortKey)}
          aria-label="Urutkan"
          className="h-9 rounded-xl border border-ink-900/10 bg-white px-2.5 text-sm text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
        >
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>

        <Link
          href="/admin/articles/new"
          className="font-ui ml-auto flex h-9 items-center gap-1.5 rounded-xl bg-brand-teal-600 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal-500 focus-visible:shadow-focus focus-visible:outline-none"
        >
          <PlusIcon size={15} weight="bold" aria-hidden="true" />
          Artikel Baru
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Chip active={status === 'all'} onClick={() => resetPage(setStatus)('all')} label="Semua" count={counts.all} />
        <Chip active={status === 'published'} onClick={() => resetPage(setStatus)('published')} label="Terbit" count={counts.published} />
        <Chip active={status === 'draft'} onClick={() => resetPage(setStatus)('draft')} label="Draf" count={counts.draft} />
      </div>

      {/* ── Tabel ── */}
      <div className="overflow-hidden rounded-xl border border-ink-900/[0.07] bg-white">
        {visible.length === 0 ? (
          <p className="p-10 text-center text-sm text-neutral-500">
            {articles.length === 0
              ? 'Belum ada artikel. Mulai dengan “Artikel Baru”.'
              : 'Tidak ada artikel yang cocok dengan filter ini.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-ink-900/[0.07] bg-neutral-50/70">
                <tr className="font-ui text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="px-4 py-2.5">Artikel</th>
                  <th className="px-4 py-2.5 w-40">Kategori</th>
                  <th className="px-4 py-2.5 w-24">Status</th>
                  <th className="px-4 py-2.5 w-20 text-right">Dibaca</th>
                  <th className="px-4 py-2.5 w-36">Diubah</th>
                  <th className="px-4 py-2.5 w-32 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/[0.05]">
                {visible.map((row) => {
                  const busy = busyId === row.id
                  return (
                    <tr key={row.id} className={busy ? 'opacity-50' : 'transition-colors hover:bg-neutral-50'}>
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/admin/articles/${row.id}/edit`}
                          className="font-ui block truncate font-medium text-ink-700 hover:text-brand-teal-600"
                        >
                          {row.title}
                        </Link>
                        <span className="mono-tech mt-0.5 block truncate text-[11px] text-neutral-400">
                          /artikel/{row.slug}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-ui rounded-lg bg-brand-teal-50 px-2 py-0.5 text-[11px] font-medium text-brand-teal-700">
                          {ARTICLE_CATEGORY_LABEL[row.category]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={[
                          'font-ui inline-flex items-center gap-1.5 text-[11px] font-medium',
                          row.is_published ? 'text-success-700' : 'text-neutral-500',
                        ].join(' ')}>
                          <span
                            aria-hidden="true"
                            className={['h-1.5 w-1.5 rounded-full', row.is_published ? 'bg-success-600' : 'bg-neutral-300'].join(' ')}
                          />
                          {row.is_published ? 'Terbit' : 'Draf'}
                        </span>
                      </td>
                      <td className="mono-tech px-4 py-2.5 text-right text-xs text-neutral-600">
                        {row.view_count}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-neutral-500">
                        {format(new Date(row.updated_at), 'd MMM yyyy, HH:mm', { locale: idLocale })}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          {row.is_published && (
                            <IconLink href={`/artikel/${row.slug}`} label="Lihat di situs publik" external>
                              <ArrowSquareOutIcon size={15} weight="bold" aria-hidden="true" />
                            </IconLink>
                          )}
                          <IconButton
                            onClick={() => handleToggle(row)}
                            disabled={busy}
                            label={row.is_published ? 'Jadikan draf' : 'Terbitkan'}
                            busy={busy}
                          >
                            {row.is_published
                              ? <EyeSlashIcon size={15} weight="duotone" aria-hidden="true" />
                              : <EyeIcon size={15} weight="duotone" aria-hidden="true" />}
                          </IconButton>
                          <IconLink href={`/admin/articles/${row.id}/edit`} label="Sunting">
                            <PencilSimpleIcon size={15} weight="duotone" aria-hidden="true" />
                          </IconLink>
                          <IconButton
                            onClick={() => handleDelete(row)}
                            disabled={busy}
                            label="Hapus"
                            busy={busy}
                            danger
                          >
                            <TrashIcon size={15} weight="duotone" aria-hidden="true" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Halaman ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="mono-tech text-xs text-neutral-400">
          {filtered.length === articles.length
            ? `${articles.length} artikel`
            : `${filtered.length} dari ${articles.length} artikel`}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <PageBtn onClick={() => setPage(safePage - 1)} disabled={safePage <= 1} label="Halaman sebelumnya">
              <CaretLeftIcon size={14} weight="bold" aria-hidden="true" />
            </PageBtn>
            <span className="mono-tech px-2 text-xs text-neutral-600">{safePage} / {totalPages}</span>
            <PageBtn onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages} label="Halaman berikutnya">
              <CaretRightIcon size={14} weight="bold" aria-hidden="true" />
            </PageBtn>
          </div>
        )}
      </div>
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

const ICON_BASE =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors duration-100 focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed'

function IconButton({
  onClick, disabled, label, busy, danger = false, children,
}: {
  onClick: () => void; disabled: boolean; label: string; busy: boolean
  danger?: boolean; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={[
        ICON_BASE,
        danger
          ? 'border-danger-200 text-danger-600 hover:bg-danger-50'
          : 'border-ink-900/10 text-neutral-600 hover:bg-neutral-50',
      ].join(' ')}
    >
      {busy
        ? <CircleNotchIcon size={15} weight="bold" className="animate-spin" aria-hidden="true" />
        : children}
    </button>
  )
}

function IconLink({
  href, label, external = false, children,
}: { href: string; label: string; external?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={[ICON_BASE, 'border-ink-900/10 text-neutral-600 hover:bg-neutral-50'].join(' ')}
    >
      {children}
    </Link>
  )
}

function PageBtn({
  onClick, disabled, label, children,
}: { onClick: () => void; disabled: boolean; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={[ICON_BASE, 'border-ink-900/10 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40'].join(' ')}
    >
      {children}
    </button>
  )
}
