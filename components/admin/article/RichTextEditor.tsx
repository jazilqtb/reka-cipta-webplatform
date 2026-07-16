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
