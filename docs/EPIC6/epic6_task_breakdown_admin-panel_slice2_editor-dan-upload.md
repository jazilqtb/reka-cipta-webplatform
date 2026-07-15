# Epic 6 Task Breakdown — Admin Panel Manajemen Artikel · Slice 2 (Rich Text Editor + Upload)

**Depends on:** Epic 6 Admin Panel Slice 1 (**wajib** — `ArticleForm.tsx`, endpoint `POST/PUT/DELETE /articles`, `types/api.ts` admin article types semua harus stabil sebelum slice ini mulai), Epic 3B Slice 2 (`epic3B_task_breakdown_admin-panel.md` — pola upload multipart `PhotoUploader.tsx`/`apiFetchMultipart`/`storage_service.py`, direplikasi persis di slice ini)

**Blocks:** Tidak ada — leaf slice, penutup Epic 6 Admin Panel.

---

## Konteks Slice

Slice ini melengkapi CRUD artikel dari Slice 1 dengan dua kapabilitas yang Epic Doc 2 minta eksplisit tapi sengaja ditunda: **Rich Text Editor** (mengganti `<textarea>` polos) dan **Upload Thumbnail** (mengisi `thumbnail_path` yang sejak Epic 6 CF Slice 1 selalu `null`). Setelah slice ini, Epic 6 Admin Panel **selesai sepenuhnya** — admin punya kontrol penuh atas artikel: judul, slug, kategori, meta description, konten terformat (bold/italic/heading/list/link/gambar), thumbnail cover, dan status publish.

**Yang termasuk slice ini:**
- Integrasi Tiptap sebagai editor `content` (toolbar: Bold, Italic, Heading H2/H3, Bullet list, Numbered list, Link, Image insert)
- Upload gambar di dalam konten (toolbar "Insert Image" → upload ke Storage → sisip URL ke editor)
- `ThumbnailUploader` untuk cover artikel (mirip `PhotoUploader.tsx` produk persis)
- Extend `DELETE /articles/{id}` (Slice 1) untuk cleanup `thumbnail_path` di storage saat artikel dihapus

**Yang TIDAK termasuk slice ini:**
- Redesign field lain di form (title/slug/kategori/meta description tetap seperti Slice 1)
- Editor gambar lanjutan (crop/resize) — upload apa adanya, validasi MIME/size saja

---

## Prasyarat Teknis (Konfirmasi Sebelum Mulai)

- [ ] Epic 6 Admin Slice 1 selesai dan live — admin bisa create/edit/delete/publish artikel dengan textarea polos
- [ ] `components/admin/product/PhotoUploader.tsx` dan `backend/routers/products.py` (endpoint `upload-photo`) dibaca ulang — pola di slice ini adalah replikasi hampir 1:1
- [ ] `backend/services/storage_service.py` (`upload_to_storage`/`delete_from_storage`) dipahami — dipakai lagi tanpa modifikasi

---

## Keputusan Arsitektur Slice

### AR-01 — Reuse Bucket `article-thumbnails` untuk Cover DAN Gambar Konten (Tidak Ada Bucket Baru)

Epic Doc 2 dan skema `articles` cuma menyebut satu bucket (`article-thumbnails`, dibuat Epic 6 CF Slice 1). Alih-alih bikin bucket kedua (`article-content-images` misalnya) yang butuh migration RLS baru, slice ini **reuse bucket yang sama** untuk dua tujuan, dibedakan lewat filename prefix:
- Cover thumbnail: `{article-slug}-{timestamp}.{ext}` (path disimpan di `articles.thumbnail_path`)
- Gambar konten (disisipkan editor): `content-{timestamp}-{random4char}.{ext}` (path **tidak** disimpan di kolom manapun — URL-nya langsung tertanam di HTML `content` sebagai `<img src="...">`, sama seperti bagaimana rich text editor pada umumnya bekerja)

**Konsekuensi:** gambar konten yang pernah diupload tapi lalu dihapus dari editor (user insert lalu undo/hapus) **jadi orphan file di storage** — tidak ada cleanup otomatis. Ini trade-off sadar (YAGNI): auto-detect "gambar mana yang masih dipakai di HTML content" butuh parsing HTML setiap update, kompleksitas yang tidak sepadan untuk volume artikel yang diproyeksikan kecil (target PRD: minimal 5 artikel sebelum launch, tim admin 2 orang). Kalau storage cost/clutter jadi masalah nyata di masa depan, baru investasi cleanup job terpisah.

### AR-02 — Endpoint Upload Konten Tidak Terikat ID Artikel (Pola Baru, Beda dari `upload-photo`)

`POST /products/{id}/upload-photo` (Epic 3B) butuh `product_id` karena foto selalu punya "pemilik" record yang sudah pasti ada. **Upload gambar di dalam editor beda kasus**: admin bisa menyisipkan gambar saat menulis artikel **baru** yang belum disimpan (belum punya `id`) — endpoint upload untuk kasus ini **tidak boleh** butuh `article_id`.

**Keputusan:** `POST /articles/upload-content-image` (tanpa `{id}` di path) — upload standalone, return `{ url: string }`, tidak menyentuh tabel `articles` sama sekali. Ini pola upload pertama di codebase yang "tidak terikat record" — dicatat eksplisit karena berbeda dari semua endpoint upload sebelumnya (`upload-photo`, `upload-lab-doc` selalu per-ID).

`POST /articles/{id}/upload-thumbnail` (cover) **tetap** butuh `article_id` (pola identik `upload-photo`) — karena thumbnail cover memang selalu terikat ke satu artikel spesifik yang sudah tersimpan. Konsekuensi UX: **`ThumbnailUploader` hanya muncul di mode edit** (`ArticleForm mode="edit"`), tidak di mode create — sama persis keterbatasan `PhotoUploader` di form produk (produk juga harus ada dulu sebelum foto bisa diupload). Admin yang mau kasih thumbnail di artikel baru: simpan dulu (draft tanpa thumbnail) → buka lagi via Edit → upload thumbnail → save.

### AR-03 — DELETE Artikel Sekarang Cleanup Storage (Extend Slice 1, Bukan Endpoint Baru)

Slice 1 (`E6-ADM-S1-BE-06`) sengaja tidak cleanup storage karena belum ada thumbnail yang bisa diupload. Sekarang thumbnail eksis, `DELETE /articles/{id}` di-extend: sebelum delete row, ambil `thumbnail_path`-nya, setelah delete row sukses, `delete_from_storage('article-thumbnails', thumbnail_path)` best-effort (try/except + `logger.warning`, **tidak** re-raise — pola R-17 sama persis `products.py`). Gambar konten yang tertanam di HTML **tidak** ikut dibersihkan (konsisten AR-01).

### AR-04 — Tiptap, Bukan Quill (Keputusan Final, Bukan "Atau")

Epic Doc 2 menulis "Rich Text Editor (gunakan Tiptap **atau** Quill)" — slice ini memilih **Tiptap** secara definitif. Alasan: Tiptap berbasis ProseMirror dengan API React-native (`@tiptap/react`) yang lebih mudah dikontrol togglenya (toolbar state sinkron `editor.isActive('bold')` dsb) dibanding Quill yang API-nya lebih imperative/DOM-first dan integrasinya ke React historically lebih janggal (banyak wrapper pihak ketiga yang tidak terawat). Tidak ada dependency editor lain yang terinstal di proyek ini (dikonfirmasi via grep `package.json`) — bebas pilih tanpa migrasi dari sesuatu yang sudah ada.

### AR-05 — Validasi MIME/Size Sama Persis dengan Foto Produk

`ALLOWED_MIME` (`image/jpeg`, `image/png`, `image/webp`) dan `MAX_SIZE` (5 MB) untuk thumbnail **dan** gambar konten memakai angka yang identik dengan `products.py` (`ALLOWED_PHOTO_MIME`, `MAX_PHOTO_SIZE`). Tidak ada alasan bisnis untuk beda — konsistensi limit upload di seluruh admin panel lebih penting daripada micro-optimize per use-case.

---

## Ringkasan Task per Layer

| Layer | Jumlah Task | Prefix |
|---|---|---|
| Backend | 4 | `E6-ADM-S2-BE` |
| Contract | 1 | `E6-ADM-S2-CT` |
| Frontend Admin | 5 | `E6-ADM-S2-FE` |
| QA | 4 | `E6-ADM-S2-QA` |
| **Total** | **14** | |

---

## Layer 1 — Backend

### E6-ADM-S2-BE-01 — `POST /articles/{id}/upload-thumbnail`

**Priority:** P0 · **Tags:** `backend` `endpoint` `upload`

**File:** `backend/routers/articles.py` (append)

```python
import time
from fastapi import File, UploadFile
from core.storage import get_public_storage_url
from services.storage_service import delete_from_storage, upload_to_storage

ALLOWED_IMAGE_MIME = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB, konsisten products.py (AR-05)


@router.post(
    "/{article_id}/upload-thumbnail",
    response_model=ArticleDetailResponse,
    dependencies=[Depends(get_current_user)],
)
async def upload_article_thumbnail(article_id: str, file: UploadFile = File(...)):
    """[AUTH] Upload/replace thumbnail cover artikel. Validasi MIME + size,
    cleanup file lama best-effort (R-17, pola sama upload_product_photo)."""
    if file.content_type not in ALLOWED_IMAGE_MIME:
        raise HTTPException(status_code=422, detail="Format tidak didukung. Pakai JPG, PNG, atau WebP.")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=422, detail="File terlalu besar. Maks 5 MB.")

    supabase = get_supabase()
    existing = supabase.table("articles").select("*").eq("id", article_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")
    article = existing.data[0]

    ext = ALLOWED_IMAGE_MIME[file.content_type]
    filename = f"{article['slug']}-{int(time.time())}.{ext}"

    try:
        new_path = upload_to_storage("article-thumbnails", filename, file_bytes, file.content_type)
    except Exception as e:
        logger.error(f"articles_thumbnail_upload_failed: id={article_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Gagal mengunggah thumbnail")

    try:
        result = supabase.table("articles").update({"thumbnail_path": new_path}).eq("id", article_id).execute()
    except Exception as e:
        logger.error(f"articles_thumbnail_db_update_failed: id={article_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Thumbnail terunggah, tapi gagal menyimpan referensi artikel")

    old_path = article.get("thumbnail_path")
    if old_path and old_path != new_path:
        try:
            delete_from_storage("article-thumbnails", old_path)
        except Exception as e:
            logger.warning(f"articles_old_thumbnail_delete_failed: path={old_path} error={e!r}")

    return ArticleDetailResponse(article=_row_to_article_admin(result.data[0]))
```

**Verifikasi:**
```bash
curl -X POST "${API_URL}/articles/${ID}/upload-thumbnail" \
  -H "Authorization: Bearer ${TOKEN}" -F "file=@thumbnail-test.jpg"
# Expected: 200, article.thumbnail_url terisi

curl -X POST "${API_URL}/articles/${ID}/upload-thumbnail" \
  -H "Authorization: Bearer ${TOKEN}" -F "file=@dokumen.pdf"
# Expected: 422
```

---

### E6-ADM-S2-BE-02 — `POST /articles/upload-content-image`

**Priority:** P0 · **Tags:** `backend` `endpoint` `upload`

```python
import random
import string


@router.post(
    "/upload-content-image",
    dependencies=[Depends(get_current_user)],
)
async def upload_article_content_image(file: UploadFile = File(...)) -> dict:
    """[AUTH] Upload gambar untuk disisipkan di konten editor. TIDAK terikat
    article_id (lihat AR-02) — artikel baru yang belum disimpan tetap bisa
    upload gambar konten. Return { url } untuk disisip Tiptap."""
    if file.content_type not in ALLOWED_IMAGE_MIME:
        raise HTTPException(status_code=422, detail="Format tidak didukung. Pakai JPG, PNG, atau WebP.")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=422, detail="File terlalu besar. Maks 5 MB.")

    ext = ALLOWED_IMAGE_MIME[file.content_type]
    rand_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
    filename = f"content-{int(time.time())}-{rand_suffix}.{ext}"

    try:
        path = upload_to_storage("article-thumbnails", filename, file_bytes, file.content_type)
    except Exception as e:
        logger.error(f"articles_content_image_upload_failed: error={e!r}")
        raise HTTPException(status_code=500, detail="Gagal mengunggah gambar")

    return {"url": get_public_storage_url("article-thumbnails", path)}
```

**Catatan:** route ini **harus** dideklarasikan sebelum `/{article_id}/...` manapun yang punya method `POST` di path yang sama shape-nya untuk aman dari greedy-match FastAPI (tidak ada collision aktual di sini karena `upload-content-image` adalah literal fixed segment, tapi tetap declare di atas `/{article_id}/upload-thumbnail` sebagai kebiasaan aman — konsisten kewaspadaan yang sama dengan komentar route-order di `products.py`).

**Verifikasi:**
```bash
curl -X POST "${API_URL}/articles/upload-content-image" \
  -H "Authorization: Bearer ${TOKEN}" -F "file=@gambar-konten.jpg"
# Expected: 200, { "url": "https://....supabase.co/storage/v1/object/public/article-thumbnails/content-....jpg" }
```

---

### E6-ADM-S2-BE-03 — Extend `DELETE /articles/{id}` untuk Cleanup Thumbnail

**Priority:** P0 · **Tags:** `backend` `cleanup`

**File:** `backend/routers/articles.py` — modifikasi `delete_article` dari Slice 1 (`E6-ADM-S1-BE-06`)

```python
@router.delete("/{article_id}", status_code=204, dependencies=[Depends(get_current_user)])
async def delete_article(article_id: str):
    supabase = get_supabase()

    existing = supabase.table("articles").select("thumbnail_path").eq("id", article_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")

    thumbnail_path = existing.data[0].get("thumbnail_path")

    try:
        supabase.table("articles").delete().eq("id", article_id).execute()
    except Exception as e:
        logger.error(f"articles_delete_failed: id={article_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Gagal menghapus artikel")

    if thumbnail_path:
        try:
            delete_from_storage("article-thumbnails", thumbnail_path)
        except Exception as e:
            logger.warning(f"articles_thumbnail_delete_on_article_delete_failed: path={thumbnail_path} error={e!r}")
```

**Catatan:** ini **mengubah file yang sama dari Slice 1**, bukan endpoint baru — perubahan minimal (tambah select `thumbnail_path`, tambah blok cleanup setelah delete row sukses), fungsi lain di endpoint ini tidak disentuh.

**Verifikasi:** Upload thumbnail ke artikel test → hapus artikel → cek bucket `article-thumbnails` via Supabase Dashboard → file thumbnail tersebut sudah tidak ada.

---

### E6-ADM-S2-BE-04 — Register Route Baru + Update Komentar Header Router

**Priority:** P2 · **Tags:** `housekeeping`

Update komentar header `backend/routers/articles.py` (ditulis Slice 1) untuk mencantumkan 2 endpoint baru:
```python
# POST /articles/{id}/upload-thumbnail   → [AUTH] upload cover artikel (Epic 6 Admin S2)
# POST /articles/upload-content-image     → [AUTH] upload gambar konten editor (Epic 6 Admin S2)
```

**Verifikasi:** `GET /docs` (Swagger UI FastAPI) menampilkan 6 endpoint total untuk tag `articles`.

---

## Layer 2 — Contract

### E6-ADM-S2-CT-01 — `lib/api.ts` Append Upload Functions

**Priority:** P0 · **Tags:** `contract`

```typescript
// === Epic 6 Admin Slice 2: Article Upload (E6-ADM-S2-CT-01) ===

export async function uploadArticleThumbnail(
  id: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<ArticleDetailResponse> {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetchMultipart<ArticleDetailResponse>(`/articles/${id}/upload-thumbnail`, formData, {
    onProgress,
  })
}

export async function uploadArticleContentImage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetchMultipart<{ url: string }>('/articles/upload-content-image', formData, {
    onProgress,
  })
}
```

**Verifikasi:** `npx tsc --noEmit` clean.

---

## Layer 3 — Frontend Admin

### E6-ADM-S2-FE-01 — Install Tiptap

**Priority:** P0 · **Tags:** `dependency`

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image
```

**Verifikasi:** `npm list @tiptap/react` menunjukkan versi terinstal.

---

### E6-ADM-S2-FE-02 — `components/admin/article/RichTextEditor.tsx`

**Priority:** P0 · **Tags:** `component` `admin`

```tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  LinkIcon, ImageIcon, Loader2,
} from 'lucide-react'
import { uploadArticleContentImage, ApiFetchError } from '@/lib/api'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  disabled?: boolean
}

export function RichTextEditor({ value, onChange, disabled }: RichTextEditorProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose-brand min-h-[280px] max-w-none rounded-b-lg border border-t-0 border-input px-3 py-2 focus:outline-none',
      },
    },
    immediatelyRender: false,
  })

  async function handleImageFile(file: File) {
    setIsUploadingImage(true)
    try {
      const { url } = await uploadArticleContentImage(file)
      editor?.chain().focus().setImage({ src: url }).run()
    } catch (err) {
      const message = err instanceof ApiFetchError ? err.message : 'Upload gambar gagal'
      toast.error(message)
    } finally {
      setIsUploadingImage(false)
    }
  }

  function handleLinkClick() {
    const url = window.prompt('URL link:')
    if (url) editor?.chain().focus().setLink({ href: url }).run()
  }

  if (!editor) return null

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-input bg-neutral-50 px-2 py-1.5">
        <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} disabled={disabled}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} disabled={disabled}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} disabled={disabled}>
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} disabled={disabled}>
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} disabled={disabled}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} disabled={disabled}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('link')} onClick={handleLinkClick} disabled={disabled}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={false}
          disabled={disabled || isUploadingImage}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImageFile(file)
            e.target.value = ''
          }}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

function ToolbarButton({
  active, disabled, onClick, children,
}: { active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-7 w-7 items-center justify-center rounded transition-colors disabled:opacity-50 ${
        active ? 'bg-brand-teal-100 text-brand-teal-700' : 'text-neutral-600 hover:bg-neutral-200'
      }`}
    >
      {children}
    </button>
  )
}
```

**Catatan:**
- `immediatelyRender: false` — wajib untuk Tiptap di Next.js App Router (mencegah SSR hydration mismatch, dokumentasi resmi Tiptap untuk framework SSR).
- Class `prose-brand` (dari `globals.css`, frozen file, sudah ada — dipakai juga di halaman detail artikel publik) dipakai di sini juga supaya **tampilan editor mendekati tampilan hasil render publik** — WYSIWYG yang jujur.
- Toolbar terbatas sesuai spec Epic Doc 2 persis: Bold, Italic, H2, H3, Bullet list, Numbered list, Link, Image — **tidak** ditambah fitur lain (table, code block, dst) yang tidak diminta (YAGNI).

**Verifikasi:** Ketik teks, toggle bold/italic/heading/list → format ter-apply visual di editor. Klik ikon gambar → pilih file → gambar tersisip di posisi kursor setelah upload selesai.

---

### E6-ADM-S2-FE-03 — `components/admin/article/ThumbnailUploader.tsx`

**Priority:** P0 · **Tags:** `component` `admin` `upload`

Replikasi `PhotoUploader.tsx` (Epic 3B Slice 2) hampir 1:1 — beda hanya nama props/fungsi dan aspect ratio preview (16:9 untuk artikel, bukan 4:3 seperti foto produk, konsisten `aspect-video` yang dipakai `ArticleCard`):

```tsx
'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { ImageUp, Loader2, RotateCcw } from 'lucide-react'
import { uploadArticleThumbnail, ApiFetchError } from '@/lib/api'
import { revalidateArticleRoutes } from '@/app/actions/articles'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_SIZE = 5 * 1024 * 1024

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; percent: number }
  | { status: 'error'; message: string; retryFile?: File }

interface ThumbnailUploaderProps {
  articleId: string
  articleSlug: string
  currentThumbnailUrl: string | null
  onUploadSuccess: (newUrl: string) => void
}

export function ThumbnailUploader({
  articleId, articleSlug, currentThumbnailUrl, onUploadSuccess,
}: ThumbnailUploaderProps) {
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
      const response = await uploadArticleThumbnail(articleId, file, (percent) => {
        setState({ status: 'uploading', percent })
      })
      onUploadSuccess(response.article.thumbnail_url!)
      setState({ status: 'idle' })
      toast.success('Thumbnail berhasil diperbarui')
    } catch (err) {
      const message = err instanceof ApiFetchError ? err.message : 'Upload gagal'
      setState({ status: 'error', message, retryFile: file })
      toast.error('Upload gagal. Coba lagi.')
      return
    }

    try {
      await revalidateArticleRoutes(articleSlug)
    } catch {
      toast.warning('Thumbnail tersimpan, tapi halaman publik mungkin butuh beberapa saat untuk update.')
    }
  }

  function handleFileSelected(files: FileList | null) {
    const file = files?.[0]
    if (file) handleUpload(file)
  }

  const isUploading = state.status === 'uploading'

  return (
    <div className="space-y-3">
      {currentThumbnailUrl && (
        <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-md bg-neutral-100">
          <Image src={currentThumbnailUrl} alt="Thumbnail artikel saat ini" fill className="object-cover" sizes="384px" />
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileSelected(e.dataTransfer.files) }}
        onClick={() => !isUploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload thumbnail artikel"
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
              <div className="h-full bg-brand-teal-600 transition-all" style={{ width: `${state.percent}%` }} />
            </div>
          </>
        ) : (
          <>
            <ImageUp className="h-6 w-6 text-neutral-400" aria-hidden="true" />
            <p className="text-neutral-600">
              Drag &amp; drop thumbnail atau <span className="font-medium text-brand-teal-600">pilih file</span>
            </p>
            <p className="text-xs text-neutral-400">JPG/PNG/WebP, maks 5 MB, rasio 16:9 disarankan</p>
          </>
        )}
      </div>

      {state.status === 'error' && (
        <div className="flex items-center justify-between rounded-md bg-danger-100 px-3 py-2 text-sm text-danger-600">
          <p role="alert">{state.message}</p>
          {state.retryFile && (
            <button type="button" onClick={() => handleUpload(state.retryFile!)} className="flex items-center gap-1 font-medium hover:underline">
              <RotateCcw size={14} aria-hidden="true" />
              Coba lagi
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

**Verifikasi:** Perilaku identik `PhotoUploader.tsx` — drag-drop, klik-pilih-file, progress bar, retry on error, toast sukses.

---

### E6-ADM-S2-FE-04 — Wire `RichTextEditor` + `ThumbnailUploader` ke `ArticleForm.tsx`

**Priority:** P0 · **Tags:** `component` `admin` `integration`

**File:** `components/admin/article/ArticleForm.tsx` (modifikasi dari Slice 1)

Perubahan (diff konseptual, bukan rewrite total):
1. Ganti `defaultValues.content` dari `stripHtmlToPlainText(initialData.content)` menjadi `initialData?.content ?? ''` (HTML mentah langsung — Tiptap konsumsi HTML, bukan plain text).
2. Ganti blok `<Textarea id="content" {...register('content')} .../>` dengan:
   ```tsx
   <Controller
     name="content"
     control={control}
     render={({ field }) => (
       <RichTextEditor value={field.value} onChange={field.onChange} disabled={isSubmitting} />
     )}
   />
   ```
   (butuh `control` dari `useForm` — tambahkan ke destructuring, dan import `Controller` dari `react-hook-form`)
3. Hapus helper `stripHtmlToPlainText` (Slice 1) — tidak lagi dipakai, HTML dikonsumsi langsung oleh editor.
4. Tambahkan `<ThumbnailUploader>` **hanya saat `mode === 'edit'`** (lihat AR-02):
   ```tsx
   {mode === 'edit' && initialData && (
     <div className="space-y-1.5">
       <Label>Thumbnail</Label>
       <ThumbnailUploader
         articleId={initialData.id}
         articleSlug={initialData.slug}
         currentThumbnailUrl={initialData.thumbnail_url}
         onUploadSuccess={() => router.refresh()}
       />
     </div>
   )}
   ```
5. Hapus catatan teks `"Editor teks lengkap segera hadir."` (Slice 1 placeholder note) — sudah tidak relevan.
6. Backend: `content` dari `RichTextEditor.getHTML()` **dikirim apa adanya** ke `POST`/`PUT /articles` — **tidak** lewat `_plain_text_to_html` lagi di frontend (fungsi backend itu tetap ada untuk kompatibilitas mundur tapi tidak dipanggil untuk payload baru — lihat catatan `BE` di bawah).

**Backend companion change** (`backend/routers/articles.py`, `create_article`/`update_article` dari Slice 1): payload `content` dari Tiptap **sudah HTML**, jadi baris `"content": _plain_text_to_html(payload.content)` diganti `"content": payload.content` langsung. **Tidak ada sanitasi HTML di sisi backend/write** — konsisten arsitektur Epic 6 CF Slice 1 AR-05 yang menaruh sanitasi di render-time (`sanitizeArticleContent`, dipanggil saat `/artikel/[slug]` merender), bukan di write-time. Ini bukan celah baru: HTML mentah dari Tiptap (output ProseMirror standar) tidak pernah dipercaya blind oleh sisi publik terlepas dari siapa yang menulisnya.

**Verifikasi:** Buat artikel baru dengan Rich Text Editor (bold, heading, list, gambar) → simpan → buka `/artikel/{slug}` di publik → format ter-render benar (bold tetap bold, heading H2/H3 sesuai ukuran, gambar tampil). Edit artikel lama (hasil Slice 1, `<p>` sederhana) → editor tetap bisa buka dan edit HTML lama tanpa error.

---

### E6-ADM-S2-FE-05 — Hapus Textarea Fallback Note dari Wireframe/UX Doc

**Priority:** P2 · **Tags:** `docs` `housekeeping`

Update `docs/wireframes/Epic6_admin_slice1_article-form.md` (dibuat Slice 1, `UX-02`) dengan catatan tambahan/lampiran wireframe baru menunjukkan toolbar Rich Text Editor + slot Thumbnail Uploader — **tidak perlu file wireframe baru terpisah**, cukup tambahan section "Update Slice 2" di file yang sama (pola sama seperti `epic2_task_breakdown_slice1_beranda_v1.1.md` yang punya "Changelog v1.0 → v1.1").

**Verifikasi:** Dokumen wireframe mencerminkan UI final, bukan cuma UI Slice 1.

---

## Layer 4 — QA Tasks

### E6-ADM-S2-QA-01 — Rich Text Editor Fungsional Penuh

**Steps:** Buat artikel baru → gunakan semua tombol toolbar (bold, italic, H2, H3, bullet list, numbered list, link, image) → simpan → buka di publik → semua format ter-render benar (bandingkan visual dengan apa yang diketik di editor).

**Verifikasi:** Tidak ada format yang hilang/salah render antara editor dan tampilan publik.

---

### E6-ADM-S2-QA-02 — Upload Thumbnail End-to-End + Cleanup

**Steps:** Edit artikel existing → upload thumbnail A → cek `ArticleCard` di `/artikel` menampilkan thumbnail A (bukan fallback gradient lagi) → upload thumbnail B (replace) → cek file A sudah terhapus dari bucket (Supabase Dashboard) → hapus artikel → cek file B juga terhapus.

**Verifikasi:** Tidak ada file thumbnail orphan setelah replace atau delete artikel.

---

### E6-ADM-S2-QA-03 — Upload Gambar Konten Tanpa Artikel Tersimpan

**Steps:** Buka `/admin/articles/new` (mode create, artikel belum punya `id`) → ketik judul+konten → klik toolbar image → upload gambar → gambar tersisip di editor **tanpa error** (memverifikasi AR-02: endpoint upload konten tidak butuh `article_id`).

**Verifikasi:** Upload berhasil meski artikel belum pernah di-save sama sekali.

---

### E6-ADM-S2-QA-04 — Regresi Slice 1 (Validasi & Auth Tidak Berubah)

**Steps:** Re-run `E6-ADM-S1-QA-01` (CRUD end-to-end) dan `E6-ADM-S1-QA-03` (whitelist & auth guard) — pastikan integrasi editor+upload tidak merusak validasi/auth yang sudah ada di Slice 1.

**Verifikasi:** Kedua QA task Slice 1 tetap pass tanpa modifikasi ekspektasi.

---

## Definition of Done — Slice 2

- [ ] Rich Text Editor (Tiptap) menggantikan textarea, toolbar sesuai spec Epic Doc 2 (Bold/Italic/H2/H3/List/Link/Image)
- [ ] Upload thumbnail berfungsi, ter-cleanup saat replace atau delete artikel
- [ ] Upload gambar konten berfungsi tanpa butuh artikel tersimpan dulu
- [ ] `DELETE /articles/{id}` sudah cleanup thumbnail (extend Slice 1, bukan endpoint baru)
- [ ] Semua 4 QA task pass, termasuk regresi Slice 1
- [ ] `npx tsc --noEmit`, `npm run lint`, `next build` clean

**Demo ke klien:**
- [ ] Sign-off Jazil/klien: admin tulis artikel lengkap dengan format + gambar + thumbnail dari nol → publish → tampilan publik sesuai ekspektasi WYSIWYG

---

## Catatan Penutup

**1. Epic 6 Admin Panel selesai total setelah slice ini** — bersama Epic 6 Customer-Facing (3 slice, sudah live), seluruh Epic 6 ("Konten & Tools") tuntas: artikel bisa dikelola penuh dari admin dan dikonsumsi penuh oleh publik, plus Kalkulator Garam berdiri independen.

**2. Endpoint upload tak-terikat-ID (`upload-content-image`, AR-02) adalah pola baru** yang belum ada preseden di codebase sebelum slice ini. Kalau epic masa depan butuh pola serupa (upload standalone sebelum record ada), rujuk endpoint ini sebagai preseden, bukan `upload-photo`/`upload-lab-doc` yang keduanya terikat ID.

**3. Orphan file di storage (AR-01) adalah trade-off yang didokumentasikan, bukan bug yang terlewat.** Kalau nanti terbukti jadi masalah nyata (dashboard storage penuh sampah), solusinya bukan buru-buru nulis cleanup job — pertama ukur dulu skalanya (berapa artikel, berapa gambar orphan) baru putuskan apakah worth effort-nya.

---

**File:** `docs/EPIC6/epic6_task_breakdown_admin-panel_slice2_editor-dan-upload.md`
**Versi:** 1.0
**Berdasarkan:** `Epic_Doc2_Epics4-6_RekaCirciptaIndonesia.md` (Epic 6 bagian B), `epic6_task_breakdown_admin-panel_slice1_manajemen-artikel.md` (dependency utama), `epic3B_task_breakdown_admin-panel.md` Slice 2 (pola upload — `PhotoUploader.tsx`, `apiFetchMultipart`, `storage_service.py`), verifikasi langsung kode `backend/routers/products.py`
