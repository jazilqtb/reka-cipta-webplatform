'use client'

// components/admin/about/TeamPhotoUpload.tsx — CP4 (2026-08-21)
//
// Unggah LANGSUNG ke Supabase Storage dari browser, bukan lewat FastAPI.
// Alasannya bukan kemalasan: CLAUDE.md sudah menetapkan "admin file uploads
// -> Supabase Storage direct" sebagai polanya, dan menambah endpoint proxy
// di FastAPI berarti berkasnya melewati Railway dua kali tanpa alasan.
//
// Batas ukuran & jenis ditegakkan DUA kali: di sini (pesan cepat untuk
// admin) dan di konfigurasi bucket (2 MB, jpeg/png/webp) yang tidak bisa
// dilewati dari klien mana pun.

import { useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { ImageIcon, SpinnerGapIcon, TrashIcon } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { teamPhotoUrl } from '@/lib/data/about'
import { compressImage, formatBytes } from '@/lib/image-compress'

const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function TeamPhotoUpload({
  value, onChange, disabled,
}: {
  value: string | null | undefined
  onChange: (path: string | null) => void
  disabled?: boolean
}) {
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const preview = teamPhotoUrl(value)

  async function upload(file: File) {
    if (!ALLOWED.has(file.type)) {
      toast.error('Format tidak didukung. Pakai JPG, PNG, atau WebP.')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('Ukuran maksimal 2 MB.')
      return
    }
    setBusy(true)
    try {
      // Kompresi SEBELUM validasi ukuran: berkas 4 MB dari kamera ponsel
      // biasanya turun jauh di bawah batas 2 MB setelah dikecilkan, jadi
      // menolaknya lebih dulu berarti menolak foto yang sebenarnya bisa
      // dipakai.
      const compressed = await compressImage(file, { maxDimension: 800, quality: 0.85 })
      const upload = compressed.file
      if (upload.size > MAX_BYTES) {
        toast.error(
          `Ukuran masih ${formatBytes(upload.size)} setelah dikompres — batasnya ${formatBytes(MAX_BYTES)}.`
        )
        setBusy(false)
        return
      }
      const supabase = createClient()
      const ext = upload.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      // Nama berkas diacak, bukan memakai nama asli: nama asli bisa
      // mengandung spasi/karakter non-ASCII dan bisa bertabrakan antar
      // anggota. crypto.randomUUID tersedia di semua browser modern.
      const path = `${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage
        .from('team-photos')
        .upload(path, upload, { cacheControl: '3600', upsert: false, contentType: upload.type })
      if (error) throw error
      onChange(path)
      toast.success(compressed.converted ? `Foto terunggah — ${compressed.reason}` : 'Foto terunggah')
    } catch (err) {
      /* PESAN GAGAL MENYEBUT SEBABNYA.
         Sebelumnya semua kegagalan tampil sebagai "Gagal mengunggah foto",
         dan penyebab yang sebenarnya — kebijakan RLS bucket belum dipasang —
         tidak pernah sampai ke admin. Ia melihat pesan yang sama untuk
         jaringan putus, format ditolak, dan izin kurang, sehingga tidak ada
         cara membedakannya tanpa membuka konsol. */
      const raw = err instanceof Error ? err.message : String(err)
      console.error('[team-photo] gagal unggah:', err)
      const friendly =
        /row-level security|policy/i.test(raw)
          ? 'Izin unggah ke penyimpanan belum aktif. Hubungi pengelola sistem.'
        : /mime|content type|not supported/i.test(raw)
          ? 'Format berkas ditolak penyimpanan. Pakai JPG, PNG, atau WebP.'
        : /exceeded|too large|payload/i.test(raw)
          ? 'Berkas terlalu besar untuk penyimpanan.'
        : /fetch|network|failed to fetch/i.test(raw)
          ? 'Tidak bisa menghubungi penyimpanan. Periksa koneksi.'
          : `Gagal mengunggah: ${raw}`
      toast.error(friendly)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <span className="font-ui mb-1 block text-xs font-medium text-neutral-600">Foto</span>
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-100">
          {preview ? (
            <Image src={preview} alt="" width={64} height={64} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon size={20} className="text-neutral-400" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
            className="font-ui inline-flex h-8 items-center gap-1.5 rounded-md border border-ink-900/12 px-2.5 text-xs font-medium text-ink-700 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-40"
          >
            {busy ? <SpinnerGapIcon size={16} className="animate-spin" aria-hidden="true" /> : <ImageIcon size={16} aria-hidden="true" />}
            {preview ? 'Ganti foto' : 'Unggah foto'}
          </button>
          {preview && (
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => onChange(null)}
              className="font-ui inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-neutral-500 transition-colors hover:bg-danger-50 hover:text-danger-600 focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-40"
            >
              <TrashIcon size={16} aria-hidden="true" />
              Hapus
            </button>
          )}
        </div>
      </div>
      <p className="mt-1.5 text-xs text-neutral-500">
        Persegi (1:1), maksimal 2 MB. Foto non-persegi akan dipotong dari tengah.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) upload(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
