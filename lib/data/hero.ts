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
  try {
    const supabase = createPublic()
    const [prodRes, dealRes] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      /* CP1 ronde 3: sumbernya berpindah rfq_leads -> rfqs. Nilainya WAJIB
         sama — diverifikasi sebelum & sesudah migrasi: COUNT(deal) dan
         jumlah kota unik keduanya identik. Kalau angka statistik beranda
         bergeser diam-diam gara-gara refactor, pengunjung melihat klaim
         yang berubah tanpa ada yang mengubahnya. */
      supabase.from('rfqs').select('delivery_city').eq('status', 'deal'),
    ])
    products = prodRes.error ? 0 : (prodRes.count ?? 0)
    if (!dealRes.error && dealRes.data) {
      deals = dealRes.data.length
      cities = new Set(
        dealRes.data
          .map((r) => String(r.delivery_city ?? '').trim().toLowerCase())
          .filter(Boolean)
      ).size
    }
  } catch (err) {
    console.error('[Hero] Gagal menghitung statistik dinamis:', err)
  }

  return [
    { key: 'salt_types_count', label: 'Jenis Garam', baseline: num(settings.salt_types_count, 0), dynamic: products, suffix: '' },
    { key: 'partner_count', label: 'Mitra Aktif', baseline: num(settings.partner_count, 6), dynamic: deals, suffix: '+' },
    { key: 'cities_served', label: 'Kota Dilayani', baseline: num(settings.cities_served, 9), dynamic: cities, suffix: '+' },
    { key: 'total_distribution_tons', label: 'Ton Distribusi', baseline: num(settings.total_distribution_tons, 353), dynamic: null, suffix: '' },
  ]
}

export function heroStatTotal(stat: HeroStat): number {
  return stat.baseline + (stat.dynamic ?? 0)
}
