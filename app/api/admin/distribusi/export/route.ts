// app/api/admin/distribusi/export/route.ts — CP3 ronde 3
// Ekspor rekap distribusi ke CSV (dibuka Excel) atau JSON.
//
// KENAPA ROUTE HANDLER, BUKAN UNDUHAN DARI KLIEN: berkas dibangun di
// server dari data yang sama dengan yang dirender halaman, jadi tidak ada
// kemungkinan angka di layar dan angka di berkas berselisih.
//
// SATUAN: kolom kg SELALU disertakan sebagai kanonik. Kolom "ton" hanya
// turunan yang dihitung, ditandai jelas di judulnya — supaya siapa pun yang
// membuka berkasnya tahu mana yang asli dan mana yang konversi.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDistributionRecap, type PeriodKey, PERIODS } from '@/lib/data/distribution'

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v)
  // Kutip kalau mengandung pemisah, kutip, atau baris baru — jika tidak,
  // satu nama perusahaan bertanda koma akan menggeser seluruh kolom.
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const format = url.searchParams.get('format') === 'json' ? 'json' : 'csv'
  const periodParam = url.searchParams.get('period') ?? '1m'
  const period = (PERIODS.some((p) => p.value === periodParam) ? periodParam : '1m') as PeriodKey

  const recap = await getDistributionRecap(period)

  if (format === 'json') {
    return new NextResponse(JSON.stringify(recap, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="distribusi-${period}-${recap.to}.json"`,
      },
    })
  }

  const lines: string[] = []
  lines.push(`# Rekap distribusi ${recap.from} s/d ${recap.to} (${recap.rangeDays} hari)`)
  lines.push('')
  lines.push('bagian,nama,jenis_garam,dijanjikan_kg,terkirim_kg,selisih_kg,dijanjikan_ton,terkirim_ton')
  for (const p of recap.products) {
    lines.push([
      'produk', csvCell(p.productName), csvCell(p.productSlug),
      p.promisedKg.toFixed(3),
      p.deliveredKg === null ? 'belum ada catatan' : p.deliveredKg.toFixed(3),
      p.gapKg === null ? '' : p.gapKg.toFixed(3),
      (p.promisedKg / 1000).toFixed(3),
      p.deliveredKg === null ? '' : (p.deliveredKg / 1000).toFixed(3),
    ].join(','))
  }
  for (const m of recap.partners) {
    lines.push([
      'mitra', csvCell(m.companyName), '',
      m.promisedKg.toFixed(3),
      m.deliveredKg === null ? 'belum ada catatan' : m.deliveredKg.toFixed(3),
      '', (m.promisedKg / 1000).toFixed(3),
      m.deliveredKg === null ? '' : (m.deliveredKg / 1000).toFixed(3),
    ].join(','))
  }
  for (const s of recap.suppliers) {
    lines.push([
      'supplier', csvCell(s.businessName), csvCell(s.saltTypes.join(' | ')),
      s.capacityKg === null ? 'tidak diketahui' : s.capacityKg.toFixed(3),
      s.suppliedKg === null ? 'belum ada catatan' : s.suppliedKg.toFixed(3),
      '', '', '',
    ].join(','))
  }

  // BOM supaya Excel di Windows membaca UTF-8 dengan benar — tanpa ini
  // nama ber-aksen tampil rusak, dan itu keluhan pertama yang selalu muncul.
  const body = '﻿' + lines.join('\r\n')
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="distribusi-${period}-${recap.to}.csv"`,
    },
  })
}
