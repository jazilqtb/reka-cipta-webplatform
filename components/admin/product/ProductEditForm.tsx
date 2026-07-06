'use client'

// components/admin/product/ProductEditForm.tsx
// Epic 3B Slice 1 (E3B-S1-FE-05) — Integration hub: compose semua
// komponen edit (ReadOnlyInfoBlock, SpecJSONBEditor, IndustriesEditor)
// dalam satu form react-hook-form + Zod. Pattern submit mengikuti
// components/admin/SettingsForm.tsx (Epic 2 Slice 3).

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { updateProduct, ApiFetchError } from '@/lib/api'
import { revalidateProductRoutes } from '@/app/actions/products'
import { productUpdateSchema, type ProductUpdateFormData } from '@/lib/validation/product-schema'
import { ReadOnlyInfoBlock } from './ReadOnlyInfoBlock'
import { SpecJSONBEditor } from './SpecJSONBEditor'
import { IndustriesEditor } from './IndustriesEditor'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Product } from '@/types/api'

interface ProductEditFormProps {
  product: Product
  availableIndustries: string[]
}

export function ProductEditForm({ product, availableIndustries }: ProductEditFormProps) {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductUpdateFormData>({
    resolver: zodResolver(productUpdateSchema),
    defaultValues: {
      name: product.name,
      tagline: product.tagline,
      description: product.description,
      specs: product.specs as Record<string, string | number>,
      industries: product.industries,
      is_sni: product.is_sni,
      is_active: product.is_active,
      sort_order: product.sort_order,
    },
  })

  // Warn sebelum navigate away kalau ada perubahan belum disimpan.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  async function onSubmit(data: ProductUpdateFormData) {
    try {
      await updateProduct(product.id, data)

      try {
        await revalidateProductRoutes(product.slug)
      } catch {
        toast.warning('Produk tersimpan, tapi halaman publik mungkin butuh beberapa saat untuk update.')
      }

      toast.success('Produk berhasil diperbarui')
      reset(data)
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 401) {
        router.push('/admin/login')
        return
      }
      toast.error('Gagal menyimpan. Silakan coba lagi.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isSubmitting} className="space-y-6">
      <ReadOnlyInfoBlock product={product} />

      <div className="bg-white border border-neutral-200 rounded-2xl p-6 md:p-8 space-y-5">
        <h2 className="text-lg font-semibold text-ink-700">Informasi Dasar</h2>

        <div className="space-y-1.5">
          <Label htmlFor="name">
            Nama Produk <span className="text-danger-600">*</span>
          </Label>
          <Input
            {...register('name')}
            id="name"
            disabled={isSubmitting}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" role="alert" className="text-sm text-danger-600">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            {...register('tagline')}
            id="tagline"
            disabled={isSubmitting}
            aria-invalid={!!errors.tagline}
            aria-describedby={errors.tagline ? 'tagline-error' : undefined}
          />
          {errors.tagline && (
            <p id="tagline-error" role="alert" className="text-sm text-danger-600">
              {errors.tagline.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea
            {...register('description')}
            id="description"
            rows={5}
            disabled={isSubmitting}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? 'description-error' : undefined}
          />
          {errors.description && (
            <p id="description-error" role="alert" className="text-sm text-danger-600">
              {errors.description.message}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6 md:p-8 space-y-3">
        <h2 className="text-lg font-semibold text-ink-700">Spesifikasi Teknis</h2>
        <Controller
          name="specs"
          control={control}
          render={({ field }) => <SpecJSONBEditor value={field.value} onChange={field.onChange} />}
        />
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6 md:p-8 space-y-3">
        <h2 className="text-lg font-semibold text-ink-700">Industri yang Dilayani</h2>
        <Controller
          name="industries"
          control={control}
          render={({ field }) => (
            <IndustriesEditor
              value={field.value}
              onChange={field.onChange}
              suggestions={availableIndustries}
            />
          )}
        />
        {errors.industries && (
          <p role="alert" className="text-sm text-danger-600">
            {errors.industries.message}
          </p>
        )}
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6 md:p-8 space-y-4">
        <h2 className="text-lg font-semibold text-ink-700">Pengaturan Tampilan</h2>

        <label className="flex items-center gap-2.5 text-sm text-neutral-700">
          <input
            type="checkbox"
            {...register('is_sni')}
            disabled={isSubmitting}
            className="h-4 w-4 rounded border-neutral-300 text-brand-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600"
          />
          Bersertifikat SNI
        </label>

        <label className="flex items-center gap-2.5 text-sm text-neutral-700">
          <input
            type="checkbox"
            {...register('is_active')}
            disabled={isSubmitting}
            className="h-4 w-4 rounded border-neutral-300 text-brand-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600"
          />
          Tampilkan di katalog
        </label>

        <div className="space-y-1.5 max-w-[160px]">
          <Label htmlFor="sort_order">Urutan Tampil</Label>
          <Input
            {...register('sort_order', { valueAsNumber: true })}
            id="sort_order"
            type="number"
            min={0}
            disabled={isSubmitting}
            aria-invalid={!!errors.sort_order}
            aria-describedby={errors.sort_order ? 'sort_order-error' : undefined}
          />
          {errors.sort_order && (
            <p id="sort_order-error" role="alert" className="text-sm text-danger-600">
              {errors.sort_order.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          disabled={isSubmitting}
          className="h-10 px-4 rounded-md border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="h-10 px-5 rounded-md bg-brand-teal-600 text-white text-sm font-semibold hover:bg-brand-teal-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  )
}
