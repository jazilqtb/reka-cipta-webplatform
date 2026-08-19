'use client'

// components/admin/article/ArticleForm.tsx
//
// CP3 (2026-08-19) — RANCANG ULANG. Tiga masalah yang ditutup:
//
// 1. AREA TULIS SEMPIT. Sebelumnya seluruh form dikurung `max-w-2xl` dan
//    editor jadi salah satu field di antara field lain, berbobot visual
//    sama dengan "Kategori". Padahal menulis isi artikel adalah 95% dari
//    waktu yang dihabiskan di halaman ini. Sekarang dua kolom: kanal tulis
//    yang lebar + panel pengaturan 320px yang jarang disentuh.
//
// 2. FIELD SLUG MANUAL DI ALUR UTAMA. Slug adalah detail teknis yang
//    99% waktu tidak perlu diubah, tapi ia duduk sebagai field kedua —
//    tepat di jalur mata setelah judul. Sekarang tampil sebagai URL siap
//    pakai di panel; menyuntingnya butuh satu klik sadar pada "Ubah".
//
// 3. SLUG BISA MEMATAHKAN TAUTAN. Versi lama mengizinkan slug artikel
//    TERBIT diubah, dengan peringatan "link lama akan 404". Sekarang slug
//    dibekukan sejak terbit pertama, dan kalau tetap diubah, slug lama
//    dicatat lalu dialihkan 301 (lihat migrasi article_slug_history dan
//    app/(public)/artikel/[slug]/page.tsx).
//
// Field SEO (meta title & canonical) BARU BISA DIISI dari sini. Kolomnya
// sudah ada di DB sejak Agustus tapi tidak pernah terekspos ke panel mana
// pun, jadi tiga dari empat field SEO artikel mustahil diisi.

import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CircleNotchIcon, LinkSimpleIcon, WarningCircleIcon } from '@phosphor-icons/react/ssr'
import { articleFormSchema, type ArticleFormData } from '@/lib/validation/article-schema'
import { ARTICLE_CATEGORY_OPTIONS } from '@/constants/articleCategories'
import { slugifyTitle } from '@/lib/slugify'
import { createArticle, updateArticle, ApiFetchError } from '@/lib/api'
import { revalidateArticleRoutes } from '@/app/actions/articles'
import { RichTextEditor } from '@/components/admin/article/RichTextEditor'
import { ThumbnailUploader } from '@/components/admin/article/ThumbnailUploader'
import { InfoHint } from '@/components/admin/ui/InfoHint'
import type { ArticleAdmin } from '@/types/api'

// Batas TAMPILAN hasil pencarian, bukan batas simpan. Google memotong yang
// kelewat panjang, tidak menolaknya — jadi ini peringatan lembut.
const TITLE_SEO_GUIDE = 60
const META_SEO_GUIDE = 160
const META_MAX = 300

interface ArticleFormProps {
  mode: 'create' | 'edit'
  initialData?: ArticleAdmin
}

export function ArticleForm({ mode, initialData }: ArticleFormProps) {
  const router = useRouter()
  const [isPublishChecked, setIsPublishChecked] = useState(initialData?.is_published ?? false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(initialData?.thumbnail_url ?? null)
  const [slugUnlocked, setSlugUnlocked] = useState(false)
  const wasPublished = initialData?.is_published ?? false

  // Slug mengikuti judul HANYA selama artikel belum pernah terbit.
  // Sekali terbit, ia dibekukan: belum tentu tidak ada yang menautkannya.
  const slugFollowsTitle = useRef(mode === 'create' || !wasPublished)

  const {
    register, handleSubmit, watch, setValue, control,
    formState: { errors, isSubmitting },
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      slug: initialData?.slug ?? '',
      category: initialData?.category ?? 'education',
      meta_description: initialData?.meta_description ?? null,
      meta_title: initialData?.meta_title ?? null,
      canonical_url: initialData?.canonical_url ?? null,
      content: initialData?.content ?? '',
    },
  })

  const titleValue = watch('title')
  useEffect(() => {
    if (!slugFollowsTitle.current) return
    setValue('slug', slugifyTitle(titleValue))
  }, [titleValue, setValue])

  const slugValue = watch('slug')
  const metaLength = watch('meta_description')?.length ?? 0
  const metaTitleLength = watch('meta_title')?.length ?? 0
  const slugChanged = mode === 'edit' && slugValue !== initialData?.slug

  async function onSubmit(values: ArticleFormData) {
    try {
      if (mode === 'create') {
        const { article } = await createArticle({ ...values, is_published: isPublishChecked })
        await revalidateArticleRoutes(article.slug)
        toast.success('Artikel berhasil dibuat')
      } else {
        const { article } = await updateArticle(initialData!.id, values)
        await revalidateArticleRoutes(article.slug)
        toast.success('Perubahan disimpan')
      }
      router.push('/admin/articles')
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 401) router.push('/admin/login')
      else if (err instanceof ApiFetchError && err.status === 409) toast.error(err.message)
      else toast.error('Gagal menyimpan artikel')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 xl:grid-cols-[1fr_320px]">
      {/* ══ KANAL TULIS ══ */}
      <div className="min-w-0 space-y-4">
        {/* KANVAS TULIS.
            Masalah yang ditutup: `.prose-brand` di globals.css TIDAK berlapis
            (unlayered), jadi `max-width: 68ch`-nya MENGALAHKAN utility
            `max-w-none` milik editor — jebakan cascade layer Tailwind v4 yang
            sudah pernah menggigit proyek ini. Akibatnya teks terkurung 68ch di
            tengah kolom lebar, menyisakan ruang mati menganga ke arah panel
            metadata.

            Ukuran 68ch itu sendiri BENAR — itu panjang baris yang nyaman
            dibaca, dan menyamainya membuat editor benar-benar WYSIWYG dengan
            halaman publik. Yang salah bukan lebar teksnya, melainkan ruang
            kosong di sekelilingnya yang tidak bertuan. Maka teksnya dibiarkan
            68ch tapi dipusatkan di dalam kartu putih yang mengisi penuh kolom:
            ruang kosong berubah jadi margin dokumen yang disengaja, bukan
            celah yang bocor. */}
        <div className="rounded-xl border border-ink-900/[0.07] bg-white p-5 md:p-8">
          <div className="mx-auto max-w-[68ch]">
            <label htmlFor="title" className="sr-only">Judul artikel</label>
            <input
              id="title"
              {...register('title')}
              disabled={isSubmitting}
              placeholder="Judul artikel…"
              className="font-ui w-full border-0 bg-transparent p-0 text-2xl font-semibold leading-snug text-ink-700 placeholder:text-neutral-300 focus-visible:outline-none md:text-[28px]"
            />
            {errors.title && <p className="mt-1 text-xs text-danger-600">{errors.title.message}</p>}

            <div className="mt-5">
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <RichTextEditor value={field.value} onChange={field.onChange} disabled={isSubmitting} />
                )}
              />
              {errors.content && <p className="mt-1 text-xs text-danger-600">{errors.content.message}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ══ PANEL PENGATURAN ══ */}
      <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
        <Panel title="Publikasi">
          <div className="space-y-3">
            <div>
              <Field
                label="Kategori"
                htmlFor="category"
                hint={
                  <InfoHint title="Kategori artikel">
                    Menentukan di tab mana artikel muncul pada halaman /artikel publik,
                    dan label yang tercetak di kartunya. <b>Wawasan Industri</b> untuk
                    materi teknis dan edukasi; <b>Berita Perusahaan</b> untuk kabar
                    kegiatan, kemitraan, atau pencapaian.
                  </InfoHint>
                }
              />
              <select
                id="category"
                {...register('category')}
                disabled={isSubmitting}
                className="h-9 w-full rounded-xl border border-ink-900/10 bg-white px-2.5 text-sm text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
              >
                {ARTICLE_CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {mode === 'create' && (
              <label className="flex items-start gap-2 text-xs text-neutral-600">
                <input
                  type="checkbox"
                  checked={isPublishChecked}
                  onChange={(e) => setIsPublishChecked(e.target.checked)}
                  disabled={isSubmitting}
                  className="mt-0.5"
                />
                Terbitkan sekarang — kalau tidak dicentang, tersimpan sebagai draf
              </label>
            )}
          </div>
        </Panel>

        <Panel title="URL">
          {!slugUnlocked ? (
            <div className="space-y-1.5">
              <p className="mono-tech break-all rounded-xl bg-neutral-50 px-2.5 py-2 text-xs text-ink-700">
                <LinkSimpleIcon size={12} weight="bold" aria-hidden="true" className="mr-1 inline text-neutral-400" />
                /artikel/{slugValue || '…'}
              </p>
              <button
                type="button"
                onClick={() => {
                  slugFollowsTitle.current = false
                  setSlugUnlocked(true)
                }}
                className="font-ui text-[11px] font-medium text-neutral-500 underline-offset-2 hover:text-brand-teal-600 hover:underline"
              >
                Ubah URL
              </button>
              {wasPublished && (
                <p className="text-[11px] leading-relaxed text-neutral-400">
                  Artikel sudah terbit — URL dibekukan agar tautan yang sudah
                  tersebar tidak patah.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <input
                {...register('slug')}
                disabled={isSubmitting}
                className="mono-tech h-9 w-full rounded-xl border border-ink-900/10 bg-white px-2.5 text-xs text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
              />
              {errors.slug && <p className="text-[11px] text-danger-600">{errors.slug.message}</p>}
              {slugChanged && wasPublished && (
                <p className="flex items-start gap-1.5 rounded-xl bg-warning-50 p-2 text-[11px] leading-relaxed text-warning-700">
                  <WarningCircleIcon size={13} weight="fill" aria-hidden="true" className="mt-px shrink-0" />
                  URL lama akan dialihkan otomatis (301) ke yang baru, jadi
                  tautan lama tetap hidup dan peringkat pencarian ikut pindah.
                </p>
              )}
            </div>
          )}
        </Panel>

        {mode === 'edit' && initialData && (
          <Panel title="Thumbnail">
            <ThumbnailUploader
              articleId={initialData.id}
              articleSlug={initialData.slug}
              currentThumbnailUrl={thumbnailUrl}
              onUploadSuccess={setThumbnailUrl}
            />
          </Panel>
        )}

        <Panel title="SEO">
          <div className="space-y-3">
            <div>
              <Field
                label="Judul untuk hasil pencarian"
                htmlFor="meta_title"
                hint={
                  <InfoHint title="Meta title">
                    Judul yang tampil sebagai baris biru di Google, bukan judul yang
                    dibaca pengunjung di halaman. Dipisah karena judul yang enak dibaca
                    sering terlalu panjang atau kurang mengandung kata kunci.
                    Idealnya <b>di bawah 60 karakter</b> agar tidak terpotong.
                    Kosongkan saja kalau judul artikel sudah cukup baik — sistem otomatis
                    memakainya.
                  </InfoHint>
                }
              />
              <input
                id="meta_title"
                {...register('meta_title')}
                disabled={isSubmitting}
                placeholder={titleValue || 'Sama dengan judul artikel'}
                className="h-9 w-full rounded-xl border border-ink-900/10 bg-white px-2.5 text-xs text-ink-700 placeholder:text-neutral-300 focus-visible:shadow-focus focus-visible:outline-none"
              />
              <Counter value={metaTitleLength} guide={TITLE_SEO_GUIDE} />
            </div>

            <div>
              <Field
                label="Deskripsi ringkas"
                htmlFor="meta_description"
                hint={
                  <InfoHint title="Meta description">
                    Dua kalimat di bawah judul pada hasil pencarian, dan teks yang ikut
                    tampil saat tautan dibagikan di WhatsApp atau LinkedIn. Tulis sebagai
                    <b> ajakan membaca</b>, bukan ringkasan kaku — sebutkan manfaat
                    konkret bagi pembaca. Idealnya <b>di bawah 160 karakter</b>.
                  </InfoHint>
                }
              />
              <textarea
                id="meta_description"
                {...register('meta_description')}
                disabled={isSubmitting}
                rows={3}
                className="w-full resize-y rounded-xl border border-ink-900/10 bg-white p-2.5 text-xs leading-relaxed text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
              />
              <Counter value={metaLength} guide={META_SEO_GUIDE} hardMax={META_MAX} />
            </div>

            <div>
              <Field
                label="Canonical URL"
                htmlFor="canonical_url"
                hint={
                  <InfoHint title="Canonical URL">
                    Menunjuk alamat ASLI sebuah tulisan ketika isi yang sama terbit di dua
                    tempat. Gunanya mencegah Google menganggapnya konten duplikat lalu
                    membagi peringkat ke dua alamat.
                    <br /><br />
                    <b>Hampir selalu dikosongkan.</b> Isi hanya kalau artikel ini
                    diterbitkan ulang dari sumber lain — tulis URL sumbernya lengkap
                    dengan https://
                  </InfoHint>
                }
              />
              <input
                id="canonical_url"
                {...register('canonical_url')}
                disabled={isSubmitting}
                placeholder="Kosongkan saja"
                className="h-9 w-full rounded-xl border border-ink-900/10 bg-white px-2.5 text-xs text-ink-700 placeholder:text-neutral-300 focus-visible:shadow-focus focus-visible:outline-none"
              />
              {errors.canonical_url && (
                <p className="mt-1 text-[11px] text-danger-600">{errors.canonical_url.message}</p>
              )}
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                Isi hanya kalau artikel ini salinan dari sumber lain.
              </p>
            </div>
          </div>
        </Panel>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="font-ui flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-teal-600 text-sm font-semibold text-white transition-colors hover:bg-brand-teal-500 focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? <CircleNotchIcon size={16} weight="bold" className="animate-spin" aria-hidden="true" />
              : 'Simpan'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/articles')}
            disabled={isSubmitting}
            className="font-ui h-10 rounded-xl border border-ink-900/10 px-4 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none"
          >
            Batal
          </button>
        </div>
      </aside>
    </form>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-ink-900/[0.07] bg-white p-3.5">
      <h2 className="font-ui mb-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Field({
  label, htmlFor, hint,
}: { label: string; htmlFor: string; hint?: React.ReactNode }) {
  return (
    <div className="mb-1 flex items-center justify-between gap-2">
      <label htmlFor={htmlFor} className="text-[11px] font-medium text-neutral-600">
        {label}
      </label>
      {hint}
    </div>
  )
}

/** Panduan panjang, bukan penghalang. Melewati batas tampilan hasil
 *  pencarian diwarnai kuning (masih boleh disimpan); melewati batas SIMPAN
 *  backend diwarnai merah. */
function Counter({ value, guide, hardMax }: { value: number; guide: number; hardMax?: number }) {
  const overHard = hardMax !== undefined && value > hardMax
  const overGuide = value > guide
  return (
    <p
      className={[
        'mono-tech mt-1 text-[10px]',
        overHard ? 'text-danger-600' : overGuide ? 'text-warning-600' : 'text-neutral-400',
      ].join(' ')}
    >
      {value}/{guide}
      {overGuide && !overHard && ' — terpotong di hasil pencarian'}
      {overHard && ` — melebihi batas simpan ${hardMax}`}
    </p>
  )
}
