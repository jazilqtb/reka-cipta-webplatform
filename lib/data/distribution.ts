// lib/data/distribution.ts — CP3 ronde 3
// Rekap distribusi: JANJI vs REALISASI, per periode.
//
// ATURAN KEJUJURAN DATA (berlaku sejak ronde lalu, tetap mengikat di sini):
// setiap angka membawa asal-usulnya. Angka yang tidak punya sumber
// dinyatakan `null` dan ditampilkan "belum ada sumber" — TIDAK PERNAH
// sebagai 0. "Tidak ada datanya" dan "datanya nol" adalah dua kenyataan
// berbeda, dan menyamakannya membuat admin mengambil keputusan atas dasar
// yang salah.

import { createClient } from '@/lib/supabase/server'

export const PERIODS = [
  { value: '1w', label: '1 minggu', days: 7 },
  { value: '1m', label: '1 bulan', days: 30 },
  { value: '3m', label: '3 bulan', days: 90 },
  { value: '6m', label: '6 bulan', days: 180 },
] as const

export type PeriodKey = (typeof PERIODS)[number]['value']

export function periodDays(key: PeriodKey): number {
  return PERIODS.find((p) => p.value === key)?.days ?? 30
}

/** Komitmen dinyatakan per periodenya sendiri (mingguan/2-mingguan/bulanan).
 *  Untuk membandingkannya dengan rentang yang dipilih admin, semuanya
 *  diskalakan ke jumlah hari rentang itu. Tanpa penyetaraan ini, komitmen
 *  mingguan dan bulanan akan dijumlahkan begitu saja — dan hasilnya angka
 *  yang tidak berarti apa-apa. */
const PERIOD_DAYS: Record<string, number> = { weekly: 7, biweekly: 14, monthly: 30 }

export function scaleCommitmentToRange(qtyKg: number, period: string, rangeDays: number): number {
  const base = PERIOD_DAYS[period] ?? 30
  return (qtyKg / base) * rangeDays
}

export interface ProductRecap {
  productSlug: string
  productName: string
  /** Total yang dijanjikan, diskalakan ke rentang terpilih. */
  promisedKg: number
  /** Total yang benar-benar terkirim dalam rentang. null = tidak ada
   *  catatan pengiriman sama sekali untuk produk ini. */
  deliveredKg: number | null
  /** promised - delivered. null kalau salah satunya tidak diketahui. */
  gapKg: number | null
}

export interface PartnerRecap {
  companyId: string
  companyName: string
  promisedKg: number
  deliveredKg: number | null
}

export interface SupplierSupply {
  supplierId: string
  businessName: string
  /** Kapasitas bulanan dari pendaftaran supplier, diskalakan ke rentang. */
  capacityKg: number | null
  /** Yang benar-benar dipasok dalam rentang. null = belum pernah tercatat. */
  suppliedKg: number | null
  saltTypes: string[]
}

export interface DistributionRecap {
  rangeDays: number
  from: string
  to: string
  products: ProductRecap[]
  partners: PartnerRecap[]
  suppliers: SupplierSupply[]
  totals: {
    promisedKg: number
    deliveredKg: number | null
    /** Berapa banyak pengiriman tercatat — dipakai UI untuk membedakan
     *  "belum ada data" dari "totalnya nol". */
    shipmentCount: number
    commitmentCount: number
  }
}

/** kwintal = 100 kg. Satuan kapasitas supplier punya daftarnya sendiri
 *  (ton/kwintal/kg) yang berbeda dari satuan RFQ — dipetakan di sini
 *  alih-alih memaksa kedua daftar menjadi satu, karena keduanya memang
 *  dipakai orang yang berbeda untuk hal yang berbeda. */
const SUPPLIER_UNIT_TO_KG: Record<string, number> = { ton: 1000, kwintal: 100, kg: 1 }

export async function getDistributionRecap(period: PeriodKey): Promise<DistributionRecap> {
  const supabase = await createClient()
  const days = periodDays(period)
  const to = new Date()
  const from = new Date(to.getTime() - days * 86400000)
  const fromISO = from.toISOString().slice(0, 10)
  const toISO = to.toISOString().slice(0, 10)

  const [commitRes, shipRes, prodRes, supRes] = await Promise.all([
    supabase
      .from('supply_commitments')
      .select('id, company_id, product_slug, qty_kg, period, source, companies(name)')
      .eq('status', 'active'),
    supabase
      .from('shipments')
      .select('id, company_id, product_slug, qty_kg, supplier_id, shipped_on, companies(name)')
      .gte('shipped_on', fromISO)
      .lte('shipped_on', toISO),
    supabase.from('products').select('slug, name'),
    supabase
      .from('supplier_registrations')
      .select('id, business_name, capacity_per_month, capacity_unit, salt_types_available')
      .eq('status', 'active'),
  ])

  const productName = new Map<string, string>(
    (prodRes.data ?? []).map((p) => [p.slug as string, p.name as string])
  )
  const commitments = commitRes.data ?? []
  const shipments = shipRes.data ?? []

  // ── Per produk ────────────────────────────────────────────────
  const promisedByProduct = new Map<string, number>()
  for (const c of commitments) {
    const slug = c.product_slug as string
    promisedByProduct.set(
      slug,
      (promisedByProduct.get(slug) ?? 0) +
        scaleCommitmentToRange(Number(c.qty_kg), c.period as string, days)
    )
  }
  const deliveredByProduct = new Map<string, number>()
  for (const s of shipments) {
    const slug = s.product_slug as string
    deliveredByProduct.set(slug, (deliveredByProduct.get(slug) ?? 0) + Number(s.qty_kg))
  }

  const slugs = new Set<string>([...promisedByProduct.keys(), ...deliveredByProduct.keys()])
  const products: ProductRecap[] = [...slugs].map((slug) => {
    const promised = promisedByProduct.get(slug) ?? 0
    const delivered = deliveredByProduct.has(slug) ? deliveredByProduct.get(slug)! : null
    return {
      productSlug: slug,
      productName: productName.get(slug) ?? slug,
      promisedKg: promised,
      deliveredKg: delivered,
      gapKg: delivered === null ? null : promised - delivered,
    }
  }).sort((a, b) => b.promisedKg - a.promisedKg)

  // ── Per mitra ─────────────────────────────────────────────────
  const partnerMap = new Map<string, PartnerRecap>()
  for (const c of commitments) {
    const id = c.company_id as string
    const name = (c.companies as { name?: string } | null)?.name ?? '(tidak diketahui)'
    const cur = partnerMap.get(id) ?? { companyId: id, companyName: name, promisedKg: 0, deliveredKg: null }
    cur.promisedKg += scaleCommitmentToRange(Number(c.qty_kg), c.period as string, days)
    partnerMap.set(id, cur)
  }
  for (const s of shipments) {
    const id = s.company_id as string
    const name = (s.companies as { name?: string } | null)?.name ?? '(tidak diketahui)'
    const cur = partnerMap.get(id) ?? { companyId: id, companyName: name, promisedKg: 0, deliveredKg: null }
    cur.deliveredKg = (cur.deliveredKg ?? 0) + Number(s.qty_kg)
    partnerMap.set(id, cur)
  }

  // ── Sisi pasokan ──────────────────────────────────────────────
  const suppliedBySupplier = new Map<string, number>()
  for (const s of shipments) {
    const sid = s.supplier_id as string | null
    if (!sid) continue
    suppliedBySupplier.set(sid, (suppliedBySupplier.get(sid) ?? 0) + Number(s.qty_kg))
  }
  const suppliers: SupplierSupply[] = (supRes.data ?? []).map((sp) => {
    const factor = SUPPLIER_UNIT_TO_KG[sp.capacity_unit as string]
    const monthlyKg = factor ? Number(sp.capacity_per_month) * factor : null
    return {
      supplierId: sp.id as string,
      businessName: sp.business_name as string,
      capacityKg: monthlyKg === null ? null : (monthlyKg / 30) * days,
      suppliedKg: suppliedBySupplier.has(sp.id as string)
        ? suppliedBySupplier.get(sp.id as string)!
        : null,
      saltTypes: (sp.salt_types_available as string[]) ?? [],
    }
  })

  const totalPromised = products.reduce((n, p) => n + p.promisedKg, 0)
  const totalDelivered = shipments.length === 0
    ? null
    : shipments.reduce((n, s) => n + Number(s.qty_kg), 0)

  return {
    rangeDays: days,
    from: fromISO,
    to: toISO,
    products,
    partners: [...partnerMap.values()].sort((a, b) => b.promisedKg - a.promisedKg),
    suppliers,
    totals: {
      promisedKg: totalPromised,
      deliveredKg: totalDelivered,
      shipmentCount: shipments.length,
      commitmentCount: commitments.length,
    },
  }
}
