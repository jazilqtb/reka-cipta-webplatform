'use client'

// components/admin/product/PhotoUploader.tsx
// Epic 3B Slice 2 (E3B-S2-FE-01) — Upload/replace foto produk. Standalone
// widget, BUKAN react-hook-form field — upload adalah operasi terpisah
// dari submit form utama (lihat ProductEditForm, Phase 9).

import { useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { ImageUp, Loader2, RotateCcw } from 'lucide-react'
import { uploadProductPhoto, ApiFetchError } from '@/lib/api'
import { revalidateProductRoutes } from '@/app/actions/products'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; percent: number }
  | { status: 'error'; message: string; retryFile?: File }

interface PhotoUploaderProps {
  productId: string
  productSlug: string
  currentPhotoUrl: string | null
  onUploadSuccess: (newUrl: string) => void
}

export function PhotoUploader({
  productId,
  productSlug,
  currentPhotoUrl,
  onUploadSuccess,
}: PhotoUploaderProps) {
  const [state, setState] = useState<UploadState>({ status: 'idle' })
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(file: File) {
    if (!ALLOWED_MIME.has(file.type)) {
      setState({ status: 'error', message: 'Format tidak didukung. Pakai JPG, PNG, atau WebP.' })
      return
    }
    if (file.size > MAX_SIZE) {
      setState({ status: 'error', message: 'File terlalu besar. Maks 5 MB.' })
      return
    }

    setState({ status: 'uploading', percent: 0 })

    try {
      const response = await uploadProductPhoto(productId, file, (percent) => {
        setState({ status: 'uploading', percent })
      })
      onUploadSuccess(response.product.photo_url!)
      setState({ status: 'idle' })
      toast.success('Foto berhasil diperbarui')
    } catch (err) {
      const message = err instanceof ApiFetchError ? err.message : 'Upload gagal'
      setState({ status: 'error', message, retryFile: file })
      toast.error('Upload gagal. Coba lagi.')
      return
    }

    try {
      await revalidateProductRoutes(productSlug)
    } catch {
      toast.warning('Foto tersimpan, tapi halaman publik mungkin butuh beberapa saat untuk update.')
    }
  }

  function handleFileSelected(files: FileList | null) {
    const file = files?.[0]
    if (file) handleUpload(file)
  }

  const isUploading = state.status === 'uploading'

  return (
    <div className="space-y-3">
      {currentPhotoUrl && (
        <div className="relative aspect-[4/3] w-full max-w-xs overflow-hidden rounded-md bg-neutral-100">
          <Image src={currentPhotoUrl} alt="Foto produk saat ini" fill className="object-cover" sizes="320px" />
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFileSelected(e.dataTransfer.files)
        }}
        onClick={() => !isUploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload foto produk"
        className={[
          'flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-center text-sm transition-colors cursor-pointer',
          isDragging ? 'border-brand-teal-600 bg-brand-teal-50' : 'border-neutral-300 hover:bg-neutral-50',
          isUploading ? 'pointer-events-none opacity-70' : '',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => handleFileSelected(e.target.files)}
        />

        {isUploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-brand-teal-600" aria-hidden="true" />
            <p className="text-neutral-600">Mengunggah... {state.percent}%</p>
            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full bg-brand-teal-600 transition-all"
                style={{ width: `${state.percent}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <ImageUp className="h-6 w-6 text-neutral-400" aria-hidden="true" />
            <p className="text-neutral-600">
              Drag &amp; drop foto atau <span className="font-medium text-brand-teal-600">pilih file</span>
            </p>
            <p className="text-xs text-neutral-400">JPG/PNG/WebP, maks 5 MB</p>
          </>
        )}
      </div>

      {state.status === 'error' && (
        <div className="flex items-center justify-between rounded-md bg-danger-100 px-3 py-2 text-sm text-danger-600">
          <p role="alert">{state.message}</p>
          {state.retryFile && (
            <button
              type="button"
              onClick={() => handleUpload(state.retryFile!)}
              className="flex items-center gap-1 font-medium hover:underline"
            >
              <RotateCcw size={16} aria-hidden="true" />
              Coba lagi
            </button>
          )}
        </div>
      )}
    </div>
  )
}
