// lib/data/hero.ts
// Pembacaan konten hero + perhitungan statistik. Direct Supabase (AR-01),
// pola sama lib/data/articles.ts: try/catch -> console.error -> fallback.

import { createPublic } from '@/lib/supabase/public'
import { parseHeroSpans, type HeroContent } from '@/lib/hero-content'

/** Dipakai kalau tabel belum terisi atau query gagal. Isinya SAMA dengan
 *  baris awal di migrasi, jadi halaman tidak pernah kosong. */
const FALLBACK_HERO: HeroContent = {
  headline: [
    { text: 'Garam industri bermutu ', style: 'plain' },
    { text: 'konsisten', style: 'primary' },
    { text: ', dari tambak petani ke lini produksi Anda.', style: 'plain' },
  ],
  subheadline: [
    {
      text: 'Hasil uji laboratorium dan legalitas tiap produk terbuka untuk diperiksa, sebelum Anda memesan.',
      style: 'plain',
    },
  ],
}

export async function getHeroContent(): Promise<HeroContent> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase
      .from('hero_content')
      .select('headline_parts, subheadline_parts')
      .limit(1)
      .maybeSingle()

    if (error || !data) return FALLBACK_HERO

    const headline = parseHeroSpans(data.headline_parts)
    const subheadline = parseHeroSpans(data.subheadline_parts)
    // Headline kosong = hero tanpa judul. Lebih baik jatuh ke teks bawaan
    // daripada menayangkan halaman tanpa H1.
    if (headline.length === 0) return FALLBACK_HERO
    return { headline, subheadline }
  } catch (err) {
    console.error('[Hero] Gagal membaca hero_content:', err)
    return FALLBACK_HERO
  }
}

export interface HeroStat {
  key: string
  label: string
  /** Nilai yang ditetapkan admin. */
  baseline: number
  /** Tambahan dari data nyata. null = statistik ini memang tidak punya
   *  sumber dinamis yang sah. */
  dynamic: number | null
  suffix: string
}

/** PEMETAAN SUMBER DINAMIS — dan satu yang SENGAJA dibiarkan statis.
 *
 *  Tiap angka di bawah dipetakan ke query yang benar-benar mengukur hal
 *  yang dinamai label-nya:
 *    Jenis Garam   -> jumlah produk aktif
 *    Mitra Aktif   -> jumlah lead berstatus 'deal' (kemitraan yang jadi)
 *    Kota Dilayani -> jumlah kota tujuan unik dari lead berstatus 'deal'
 *
 *  "Ton Distribusi" TIDAK dipetakan. Satu-satunya angka volume yang ada di
 *  basis data adalah rfq_leads.volume_per_month — volume BULANAN yang
 *  DIMINTA, bukan tonase yang sudah dikirim secara kumulatif. Menjumlahkan
 *  kolom itu lalu menyebutnya "Ton Distribusi" akan menghasilkan angka yang
 *  terlihat resmi dan artinya salah. Jadi ia tetap murni baseline, dan
 *  panel admin menyatakan itu apa adanya.
 */
export async function getHeroStats(
  settings: Record<string, string>
): Promise<HeroStat[]> {
  const num = (v: string | undefined, d = 0) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : d
  }

  let products = 0
  let deals = 0
  let cities = 0
  let shippedKg: number | null = null

  /* SATU panggilan RPC, bukan beberapa SELECT.
   *
   * Sebelumnya fungsi ini melakukan SELECT langsung ke `rfqs`/`shipments`
   * memakai anon key — dan RLS tabel itu hanya mengizinkan admin. PostgREST
   * TIDAK melempar error untuk kasus itu; ia mengembalikan NOL BARIS. Jadi
   * statistik dinamis beranda selalu 0 tanpa satu pun tanda bahwa ada yang
   * salah, dan verifikasi yang memakai service key tidak akan pernah
   * menangkapnya karena service key melewati RLS.
   *
   * get_public_hero_stats() adalah SECURITY DEFINER yang hanya
   * mengembalikan angka agregat — tidak ada identitas pelanggan yang bisa
   * keluar lewat sana. */
  /* CATATAN CACHE: Next.js membungkus `fetch` global, dan supabase-js
   * memakainya. Panggilan ini karena itu ikut aturan `revalidate = 3600`
   * milik halaman beranda — angka statistik menyegar paling lambat sejam
   * sekali, dan LANGSUNG saat pengiriman baru disimpan lewat panel admin
   * (saveShipment memanggil revalidatePath('/')).
   * Sempat terlihat seperti bug: build mengembalikan 0 pengiriman padahal
   * basis data punya 2. Ternyata build memakai respons ter-cache dari
   * sebelum data itu ada — bukan salah kueri. Terbukti setelah
   * .next/cache/fetch-cache dibersihkan: nilainya langsung benar. */
  try {
    const supabase = createPublic()
    const { data, error } = await supabase.rpc('get_public_hero_stats')
    const row = Array.isArray(data) ? data[0] : data
    if (!error && row) {
      products = Number(row.active_products ?? 0)
      deals = Number(row.deal_count ?? 0)
      cities = Number(row.city_count ?? 0)
      // Nol BARIS pengiriman berarti belum ada sumbernya sama sekali —
      // berbeda dari total nol. Perbedaan itu dipertahankan sampai UI.
      shippedKg = Number(row.shipment_rows ?? 0) > 0 ? Number(row.shipped_kg ?? 0) : null
    }
  } catch (err) {
    console.error('[Hero] Gagal menghitung statistik dinamis:', err)
  }

  return [
    { key: 'salt_types_count', label: 'Jenis Garam', baseline: num(settings.salt_types_count, 0), dynamic: products, suffix: '' },
    { key: 'partner_count', label: 'Mitra Aktif', baseline: num(settings.partner_count, 6), dynamic: deals, suffix: '+' },
    { key: 'cities_served', label: 'Kota Dilayani', baseline: num(settings.cities_served, 9), dynamic: cities, suffix: '+' },
    {
      key: 'total_distribution_tons',
      label: 'Ton Distribusi',
      baseline: num(settings.total_distribution_tons, 353),
      // Dibulatkan ke ton penuh: label statistiknya berbunyi "Ton
      // Distribusi", jadi menampilkan pecahan kilogram di sana salah satuan.
      dynamic: shippedKg === null ? null : Math.round(shippedKg / 1000),
      suffix: '',
    },
  ]
}

export function heroStatTotal(stat: HeroStat): number {
  return stat.baseline + (stat.dynamic ?? 0)
}
