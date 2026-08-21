// lib/image-compress.ts — CP5 ronde 3
//
// SATU tempat kompresi untuk SELURUH jalur unggah gambar di panel admin:
// foto tim, thumbnail artikel, foto produk, dan gambar di dalam editor
// artikel. Ditulis sebagai modul bersama, bukan ditambal per formulir —
// empat salinan logika kompresi akan berbeda perilaku dalam enam bulan,
// dan yang terlewat diperbarui justru yang paling jarang dipakai.
//
// Berjalan DI BROWSER lewat canvas. Alasannya: dua dari empat jalur
// mengunggah langsung ke Supabase Storage tanpa melewati FastAPI, jadi
// kompresi di server tidak akan menjangkau semuanya. Mengompres sebelum
// dikirim juga memangkas waktu unggah, bukan cuma ukuran simpan.

export interface CompressOptions {
  /** Sisi terpanjang maksimum, piksel. */
  maxDimension?: number
  /** Mutu encoder 0–1 untuk WebP/JPEG. */
  quality?: number
  /** Jangan sentuh berkas di bawah ukuran ini — sudah cukup kecil. */
  skipBelowBytes?: number
}

export interface CompressResult {
  file: File
  originalBytes: number
  finalBytes: number
  converted: boolean
  /** Kenapa hasilnya seperti itu — dipakai UI untuk memberi tahu admin. */
  reason: string
}

const DEFAULTS: Required<CompressOptions> = {
  maxDimension: 1600,
  quality: 0.82,
  skipBelowBytes: 80 * 1024,
}

/** Tipe yang tidak boleh disentuh.
 *
 *  SVG sengaja dilewati: ia vektor, tidak punya "dimensi piksel" yang
 *  bermakna, dan menggambarnya ke canvas justru mengubahnya jadi raster —
 *  membesar, bukan mengecil. GIF juga dilewati karena canvas hanya
 *  menangkap satu bingkai, jadi animasinya akan hilang diam-diam. */
const PASSTHROUGH = new Set(['image/svg+xml', 'image/gif'])

function canUseWebp(): boolean {
  try {
    const c = document.createElement('canvas')
    c.width = c.height = 1
    return c.toDataURL('image/webp').startsWith('data:image/webp')
  } catch {
    return false
  }
}

async function loadBitmap(file: File): Promise<{ w: number; h: number; draw: CanvasImageSource }> {
  // createImageBitmap jauh lebih murah daripada <img> + objectURL, dan
  // tidak menyentuh DOM. Fallback disediakan untuk browser yang belum punya.
  if (typeof createImageBitmap === 'function') {
    const bmp = await createImageBitmap(file)
    return { w: bmp.width, h: bmp.height, draw: bmp }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const el = new Image()
      el.onload = () => res(el)
      el.onerror = () => rej(new Error('Gambar tidak bisa dibaca'))
      el.src = url
    })
    return { w: img.naturalWidth, h: img.naturalHeight, draw: img }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function replaceExt(name: string, ext: string): string {
  return name.replace(/\.[^.]+$/, '') + ext
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressResult> {
  const opt = { ...DEFAULTS, ...options }
  const originalBytes = file.size
  const untouched = (reason: string): CompressResult => ({
    file, originalBytes, finalBytes: originalBytes, converted: false, reason,
  })

  if (PASSTHROUGH.has(file.type)) return untouched('Format ini tidak dikompres.')
  if (!file.type.startsWith('image/')) return untouched('Bukan berkas gambar.')

  try {
    const { w, h, draw } = await loadBitmap(file)
    const scale = Math.min(1, opt.maxDimension / Math.max(w, h))
    const needsResize = scale < 1

    // Berkas kecil DAN sudah cukup ringan: menyentuhnya hanya berisiko
    // menurunkan mutu tanpa menghemat apa pun.
    if (!needsResize && originalBytes < opt.skipBelowBytes) {
      return untouched('Sudah cukup kecil, tidak diubah.')
    }

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return untouched('Kompresi tidak didukung peramban ini.')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(draw, 0, 0, canvas.width, canvas.height)

    const useWebp = canUseWebp()
    const mime = useWebp ? 'image/webp' : 'image/jpeg'
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, mime, opt.quality))
    if (!blob) return untouched('Kompresi gagal, berkas asli dipakai.')

    // ATURAN YANG MENENTUKAN: kalau hasil konversi justru LEBIH BESAR,
    // berkas asli yang dipakai. Ini nyata terjadi pada PNG kecil dengan
    // sedikit warna — WebP lossy menambah bobot alih-alih mengurangi.
    // Tanpa penjagaan ini, "kompresi otomatis" bisa membengkakkan berkas.
    if (blob.size >= originalBytes && !needsResize) {
      return untouched('Konversi tidak menguntungkan, berkas asli dipakai.')
    }

    const out = new File(
      [blob],
      replaceExt(file.name, useWebp ? '.webp' : '.jpg'),
      { type: mime, lastModified: Date.now() }
    )
    const pct = Math.max(0, Math.round((1 - out.size / originalBytes) * 100))
    return {
      file: out,
      originalBytes,
      finalBytes: out.size,
      converted: true,
      reason: needsResize
        ? `Diperkecil ke ${canvas.width}×${canvas.height}, hemat ${pct}%.`
        : `Dikonversi ke ${useWebp ? 'WebP' : 'JPEG'}, hemat ${pct}%.`,
    }
  } catch (err) {
    console.error('[image-compress] gagal:', err)
    return untouched('Kompresi dilewati, berkas asli dipakai.')
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
