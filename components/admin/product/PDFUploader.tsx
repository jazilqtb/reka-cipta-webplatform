'use client'

// components/admin/product/PDFUploader.tsx
// Epic 3B Slice 2 (E3B-S2-FE-02) — Upload/replace PDF hasil uji lab.
// Pola identik PhotoUploader, tapi preview-nya link (bukan thumbnail
// gambar) dan validasi PDF-only — UX cukup berbeda untuk tidak
// diabstraksi jadi satu komponen generic.

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { FileText, Loader2, RotateCcw, UploadCloud } from 'lucide-react'
import { uploadProductLabDoc, ApiFetchError } from '@/lib/api'
import { revalidateProductRoutes } from '@/app/actions/products'

const ALLOWED_MIME = new Set(['application/pdf'])
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; percent: number }
  | { status: 'error'; message: string; retryFile?: File }

interface PDFUploaderProps {
  productId: string
  productSlug: string
  currentPdfUrl: string | null
  onUploadSuccess: (newUrl: string) => void
}

export function PDFUploader({
  productId,
  productSlug,
  currentPdfUrl,
  onUploadSuccess,
}: PDFUploaderProps) {
  const [state, setState] = useState<UploadState>({ status: 'idle' })
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(file: File) {
    if (!ALLOWED_MIME.has(file.type)) {
      setState({ status: 'error', message: 'Format tidak didukung. Pakai PDF.' })
      return
    }
    if (file.size > MAX_SIZE) {
      setState({ status: 'error', message: 'File terlalu besar. Maks 10 MB.' })
      return
    }

    setState({ status: 'uploading', percent: 0 })

    try {
      const response = await uploadProductLabDoc(productId, file, (percent) => {
        setState({ status: 'uploading', percent })
      })
      onUploadSuccess(response.product.lab_doc_url!)
      setState({ status: 'idle' })
      toast.success('Dokumen berhasil diperbarui')
    } catch (err) {
      const message = err instanceof ApiFetchError ? err.message : 'Upload gagal'
      setState({ status: 'error', message, retryFile: file })
      toast.error('Upload gagal. Coba lagi.')
      return
    }

    try {
      await revalidateProductRoutes(productSlug)
    } catch {
      toast.warning('Dokumen tersimpan, tapi halaman publik mungkin butuh beberapa saat untuk update.')
    }
  }

  function handleFileSelected(files: FileList | null) {
    const file = files?.[0]
    if (file) handleUpload(file)
  }

  const isUploading = state.status === 'uploading'

  return (
    <div className="space-y-3">
      {currentPdfUrl && (
        <a
          href={currentPdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-brand-teal-600 hover:underline"
        >
          <FileText size={16} aria-hidden="true" />
          Lihat dokumen saat ini
        </a>
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
        aria-label="Upload dokumen PDF"
        className={[
          'flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-center text-sm transition-colors cursor-pointer',
          isDragging ? 'border-brand-teal-600 bg-brand-teal-50' : 'border-neutral-300 hover:bg-neutral-50',
          isUploading ? 'pointer-events-none opacity-70' : '',
        ].join(' ')}
      >
        <input ref={inputRef} type="file" accept="application/pdf" hidden onChange={(e) => handleFileSelected(e.target.files)} />

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
            <UploadCloud className="h-6 w-6 text-neutral-400" aria-hidden="true" />
            <p className="text-neutral-600">
              Drag PDF atau <span className="font-medium text-brand-teal-600">pilih file</span>
            </p>
            <p className="text-xs text-neutral-400">PDF only, maks 10 MB</p>
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
              <RotateCcw size={14} aria-hidden="true" />
              Coba lagi
            </button>
          )}
        </div>
      )}
    </div>
  )
}
