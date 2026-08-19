'use client'

// components/admin/article/ArticleForm.tsx
// Epic 6 Admin Slice 1 (E6-ADM-S1-FE-06) — form create & edit artikel.
// Epic 6 Admin Slice 2 (E6-ADM-S2-FE-04) — content sekarang Tiptap
// RichTextEditor (HTML langsung, bukan textarea+_plain_text_to_html lagi),
// plus ThumbnailUploader (hanya mode edit, lihat AR-02 Slice 2).

import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { articleFormSchema, type ArticleFormData } from '@/lib/validation/article-schema'
import { ARTICLE_CATEGORY_OPTIONS } from '@/constants/articleCategories'
import { slugifyTitle } from '@/lib/slugify'
import { createArticle, updateArticle, ApiFetchError } from '@/lib/api'
import { revalidateArticleRoutes } from '@/app/actions/articles'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/admin/article/RichTextEditor'
import { ThumbnailUploader } from '@/components/admin/article/ThumbnailUploader'
import type { ArticleAdmin } from '@/types/api'

const META_MAX = 300

interface ArticleFormProps {
  mode: 'create' | 'edit'
  initialData?: ArticleAdmin
}

export function ArticleForm({ mode, initialData }: ArticleFormProps) {
  const router = useRouter()
  const [isPublishChecked, setIsPublishChecked] = useState(initialData?.is_published ?? false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(initialData?.thumbnail_url ?? null)
  const slugManuallyEdited = useRef(mode === 'edit') // edit: jangan auto-overwrite slug existing

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      slug: initialData?.slug ?? '',
      category: initialData?.category ?? 'education',
      meta_description: initialData?.meta_description ?? null,
      content: initialData?.content ?? '',
    },
  })

  const titleValue = watch('title')
  useEffect(() => {
    if (slugManuallyEdited.current) return
    setValue('slug', slugifyTitle(titleValue))
  }, [titleValue, setValue])

  const metaLength = watch('meta_description')?.length ?? 0
  const wasPublished = initialData?.is_published ?? false
  const slugChangedOnPublished = mode === 'edit' && wasPublished && watch('slug') !== initialData?.slug

  async function onSubmit(values: ArticleFormData) {
    try {
      if (mode === 'create') {
        const { article } = await createArticle({ ...values, is_published: isPublishChecked })
        await revalidateArticleRoutes(article.slug)
        toast.success('Artikel berhasil dibuat')
        router.push('/admin/articles')
      } else {
        const { article } = await updateArticle(initialData!.id, values)
        await revalidateArticleRoutes(article.slug)
        toast.success('Perubahan disimpan')
        router.push('/admin/articles')
      }
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 401) {
        router.push('/admin/login')
      } else if (err instanceof ApiFetchError && err.status === 409) {
        toast.error(err.message)
      } else {
        toast.error('Gagal menyimpan artikel')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">
          Judul <span className="text-danger-600">*</span>
        </Label>
        <Input id="title" {...register('title')} disabled={isSubmitting} />
        {errors.title && <p className="text-sm text-danger-600">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          {...register('slug', {
            onChange: () => {
              slugManuallyEdited.current = true
            },
          })}
          disabled={isSubmitting}
        />
        {errors.slug && <p className="text-sm text-danger-600">{errors.slug.message}</p>}
        {slugChangedOnPublished && (
          <p className="text-sm text-warning-600">
            ⚠ Artikel ini sudah publish — mengubah slug akan mengubah URL publiknya, link lama akan 404.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category">
          Kategori <span className="text-danger-600">*</span>
        </Label>
        <select
          id="category"
          {...register('category')}
          disabled={isSubmitting}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ARTICLE_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="meta_description">Meta Description</Label>
        <Textarea id="meta_description" {...register('meta_description')} disabled={isSubmitting} rows={2} />
        <p className={`text-xs ${metaLength > META_MAX ? 'text-danger-600' : 'text-neutral-400'}`}>
          {metaLength}/{META_MAX} karakter
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="content">
          Konten <span className="text-danger-600">*</span>
        </Label>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <RichTextEditor value={field.value} onChange={field.onChange} disabled={isSubmitting} />
          )}
        />
        {errors.content && <p className="text-sm text-danger-600">{errors.content.message}</p>}
      </div>

      {mode === 'edit' && initialData && (
        <div className="space-y-1.5">
          <Label>Thumbnail</Label>
          <ThumbnailUploader
            articleId={initialData.id}
            articleSlug={initialData.slug}
            currentThumbnailUrl={thumbnailUrl}
            onUploadSuccess={(newUrl) => setThumbnailUrl(newUrl)}
          />
        </div>
      )}

      {mode === 'create' && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublishChecked}
            onChange={(e) => setIsPublishChecked(e.target.checked)}
            disabled={isSubmitting}
          />
          Publish sekarang (kalau tidak dicentang, tersimpan sebagai draft)
        </label>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/articles')}
          disabled={isSubmitting}
        >
          Batal
        </Button>
      </div>
    </form>
  )
}
