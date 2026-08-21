'use client'

// components/admin/article/RichTextEditor.tsx
// Epic 6 Admin Slice 2 (E6-ADM-S2-FE-02) — Tiptap editor untuk field
// content. Toolbar terbatas sesuai spec Epic Doc 2: Bold, Italic, H2, H3,
// Bullet list, Numbered list, Link, Image — tidak ditambah fitur lain
// (table, code block, dst) yang tidak diminta (YAGNI).

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  ImageIcon,
  Loader2,
} from 'lucide-react'
import { uploadArticleContentImage, ApiFetchError } from '@/lib/api'
import { compressImage } from '@/lib/image-compress'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  disabled?: boolean
}

export function RichTextEditor({ value, onChange, disabled }: RichTextEditorProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkDraft, setLinkDraft] = useState('')
  const [linkError, setLinkError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      // StarterKit v3 membawa Link bawaan — configure di sini, JANGAN
      // daftarkan @tiptap/extension-link terpisah (duplicate extension name).
      StarterKit.configure({ link: { openOnClick: false } }),
      Image,
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose-brand min-h-[280px] max-w-none rounded-b-lg border border-t-0 border-input px-3 py-2 focus:outline-none',
      },
    },
    immediatelyRender: false,
  })

  async function handleImageFile(file: File) {
    setIsUploadingImage(true)
    try {
      // Gambar isi artikel dirender di kolom 68ch — 1400px cukup.
      const { file: upload } = await compressImage(file, { maxDimension: 1400 })
      const { url } = await uploadArticleContentImage(upload)
      editor?.chain().focus().setImage({ src: url }).run()
    } catch (err) {
      const message = err instanceof ApiFetchError ? err.message : 'Upload gambar gagal'
      toast.error(message)
    } finally {
      setIsUploadingImage(false)
    }
  }

  /* Dulu: window.prompt('URL link:').
   *
   * Tiga masalah nyata, bukan sekadar selera:
   *   1. Tidak ada validasi — apa pun yang diketik langsung jadi href,
   *      termasuk "javascript:..." dan "www.contoh.com" tanpa skema (yang
   *      akan diperlakukan browser sebagai path relatif, jadi tautan mati).
   *   2. Tautan yang SUDAH ada tidak bisa disunting atau dihapus. Satu-
   *      satunya jalan keluar adalah menghapus teksnya lalu mengetik ulang.
   *   3. prompt() digambar oleh browser, jadi satu-satunya bagian editor
   *      yang berada di luar sistem desain — dan ia membekukan seluruh tab
   *      selama terbuka.
   */
  function openLinkEditor() {
    const existing = editor?.getAttributes('link').href as string | undefined
    setLinkDraft(existing ?? '')
    setLinkOpen(true)
  }

  /** Menerima "contoh.com", "www.contoh.com", "https://contoh.com",
   *  "mailto:…" dan menolak skema yang bisa dieksekusi. */
  function normaliseHref(raw: string): string | null {
    const value = raw.trim()
    if (!value) return null
    if (/^(javascript|data|vbscript):/i.test(value)) return null
    if (/^(https?:|mailto:|tel:|\/)/i.test(value)) return value
    return `https://${value}`
  }

  function applyLink() {
    const href = normaliseHref(linkDraft)
    if (!href) {
      setLinkError('Alamat tidak valid.')
      return
    }
    editor?.chain().focus().extendMarkRange('link').setLink({ href }).run()
    setLinkOpen(false)
    setLinkError(null)
  }

  function removeLink() {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run()
    setLinkOpen(false)
    setLinkError(null)
  }

  if (!editor) return null

  return (
    <div>
      <div className="relative flex flex-wrap items-center gap-1 rounded-t-md border border-input bg-neutral-50 px-2 py-1.5">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={disabled}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('link')} onClick={openLinkEditor} disabled={disabled}>
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

        {/* Panel tautan inline — menggantikan window.prompt. Ditempel di
            dalam bilah alat (relative) supaya muncul tepat di bawah tombol
            yang ditekan, bukan di tengah layar seperti modal. */}
        {linkOpen && (
          <div className="absolute left-2 top-full z-20 mt-1 w-[min(20rem,calc(100%-1rem))] rounded-md border border-ink-900/12 bg-white p-3 shadow-lg">
            <label className="font-ui mb-1 block text-xs font-medium text-neutral-600" htmlFor="rte-link-url">
              Alamat tautan
            </label>
            <input
              id="rte-link-url"
              autoFocus
              value={linkDraft}
              onChange={(e) => { setLinkDraft(e.target.value); setLinkError(null) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); applyLink() }
                if (e.key === 'Escape') { e.preventDefault(); setLinkOpen(false); setLinkError(null) }
              }}
              placeholder="contoh.com atau https://contoh.com"
              className="h-9 w-full rounded-md border border-ink-900/15 px-2 text-sm text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
            />
            {linkError && <p className="mt-1 text-xs text-danger-600">{linkError}</p>}
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={removeLink}
                className="font-ui text-xs font-medium text-neutral-500 hover:text-danger-600"
              >
                Hapus tautan
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setLinkOpen(false); setLinkError(null) }}
                  className="font-ui h-8 rounded-md px-2.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={applyLink}
                  className="font-ui h-8 rounded-md bg-brand-teal-600 px-3 text-xs font-medium text-white hover:bg-brand-teal-500"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
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
