'use client'

// components/admin/settings/LogoEditor.tsx
// CRUD logo situs — dua slot (dark/light), pola upload sama dengan
// PartnersEditor.tsx (LogoUpload): kompres di browser, unggah langsung
// ke Supabase Storage, lalu simpan PATH-nya lewat server action.

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { ImageIcon, SpinnerGapIcon } from '@phosphor-icons/react'
import { AdminCard } from '@/components/admin/ui/AdminPrimitives'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { compressImage, formatBytes } from '@/lib/image-compress'
import { logoUrl, DEFAULT_LOGO_DARK, DEFAULT_LOGO_LIGHT } from '@/lib/data/logo'
import { saveLogoPath } from '@/app/actions/logo'

const MAX_BYTES = 2 * 1024 * 1024

interface Props {
  initialDarkPath: string | null
  initialLightPath: string | null
}

export function LogoEditor({ initialDarkPath, initialLightPath }: Props) {
  return (
    <AdminCard className="p-4 md:p-5">
      <h2 className="font-ui mb-1 text-sm font-semibold text-ink-700">Logo Situs</h2>
      <p className="mb-4 text-xs leading-relaxed text-neutral-500">
        Dua varian: <strong>gelap</strong> tampil di atas latar terang (navbar), <strong>terang</strong>{' '}
        tampil di atas latar gelap (footer, hero). Format PNG/JPEG/WebP/SVG, maksimal 2 MB.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <LogoSlot
          variant="dark"
          label="Logo Gelap"
          helper="Dipakai di navbar (latar putih)."
          initialPath={initialDarkPath}
          fallback={DEFAULT_LOGO_DARK}
          previewBg="bg-white"
        />
        <LogoSlot
          variant="light"
          label="Logo Terang"
          helper="Dipakai di footer & hero (latar gelap)."
          initialPath={initialLightPath}
          fallback={DEFAULT_LOGO_LIGHT}
          previewBg="bg-steel-900"
        />
      </div>
    </AdminCard>
  )
}

function LogoSlot({
  variant, label, helper, initialPath, fallback, previewBg,
}: {
  variant: 'dark' | 'light'
  label: string
  helper: string
  initialPath: string | null
  fallback: string
  previewBg: string
}) {
  const [path, setPath] = useState(initialPath)
  const [busy, setBusy] = useState(false)
  const [pending, startTransition] = useTransition()
  const preview = logoUrl(path, fallback)
  const isCustom = !!path && path !== fallback

  async function upload(file: File) {
    setBusy(true)
    try {
      const isSvg = file.type === 'image/svg+xml'
      const { file: out } = isSvg
        ? { file }
        : await compressImage(file, { maxDimension: 800, quality: 0.9 })
      if (out.size > MAX_BYTES) {
        toast.error(`Ukuran masih ${formatBytes(out.size)} setelah dikompres — batasnya ${formatBytes(MAX_BYTES)}.`)
        return
      }
      const supabase = createClient()
      const ext = out.name.split('.').pop()?.toLowerCase() ?? 'png'
      const objectPath = `${variant}-${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage
        .from('site-logo')
        .upload(objectPath, out, { cacheControl: '3600', upsert: false, contentType: out.type })
      if (error) throw error

      const res = await saveLogoPath(variant, objectPath)
      if (!res.ok) {
        toast.error(res.error ?? 'Gagal menyimpan')
        return
      }
      setPath(objectPath)
      toast.success(`${label} tersimpan`)
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err)
      console.error(`[logo:${variant}] gagal unggah:`, err)
      toast.error(
        /row-level security|policy/i.test(raw)
          ? 'Izin unggah ke penyimpanan belum aktif.'
          : `Gagal mengunggah: ${raw}`
      )
    } finally {
      setBusy(false)
    }
  }

  function revert() {
    startTransition(async () => {
      const res = await saveLogoPath(variant, null)
      if (res.ok) {
        setPath(null)
        toast.success(`${label} dikembalikan ke bawaan`)
      } else {
        toast.error(res.error ?? 'Gagal mengembalikan')
      }
    })
  }

  return (
    <div className="rounded-md border border-ink-900/[0.09] p-3">
      <p className="font-ui text-xs font-medium text-neutral-700">{label}</p>
      <p className="mb-2 text-xs text-neutral-500">{helper}</p>
      <div className={cn('mb-3 flex h-16 items-center justify-center rounded-sm p-2', previewBg)}>
        <Image src={preview} alt="" width={160} height={48} className="h-full w-auto object-contain" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="font-ui inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-ink-900/12 px-2.5 text-xs font-medium text-ink-700 transition-colors hover:bg-neutral-50">
          {busy ? (
            <SpinnerGapIcon size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <ImageIcon size={16} aria-hidden="true" />
          )}
          Ganti logo
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            hidden
            disabled={busy || pending}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) upload(f)
              e.target.value = ''
            }}
          />
        </label>
        {isCustom && (
          <button
            type="button"
            disabled={busy || pending}
            onClick={revert}
            className="font-ui text-xs font-medium text-neutral-500 transition-colors hover:text-danger-600"
          >
            Kembalikan ke bawaan
          </button>
        )}
      </div>
    </div>
  )
}
