// lib/lead-format.ts
// CP2 (2026-08-19) — helper format lead, sumber tunggal.
//
// Sebelumnya maskWhatsapp/label frekuensi ditulis inline di
// LeadKanbanCard. CP2 menambah dua permukaan lagi (list + panel detail),
// jadi tanpa pemusatan akan ada tiga salinan yang bisa melenceng — kelas
// bug yang persis sama dengan label kategori artikel di CP1.

import type { RFQLead } from '@/types/api'

/** Ambang "belum disentuh" dalam hari. Dipakai badge stale. */
export const STALE_DAYS = 3

export function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

export function isStale(lead: RFQLead): boolean {
  return daysSince(lead.updated_at) > STALE_DAYS
}

/** Nomor disamarkan di daftar — panel detail menampilkannya utuh. */
export function maskWhatsapp(whatsapp: string): string {
  if (whatsapp.length <= 6) return whatsapp
  return `${whatsapp.slice(0, 5)}****${whatsapp.slice(-2)}`
}

const FREQ_LABEL: Record<string, string> = {
  weekly: 'minggu',
  biweekly: '2 minggu',
  monthly: 'bulan',
}

export function formatVolume(lead: RFQLead): string {
  return `${lead.volume_per_month} ton/${FREQ_LABEL[lead.delivery_frequency] ?? 'bulan'}`
}

/** Rentang tanggal preset — menggantikan dua <input type="date">.
 *
 *  KENAPA PRESET, BUKAN INPUT TANGGAL:
 *  <input type="date"> dirender memakai locale BROWSER, bukan atribut
 *  `lang` halaman. Di audit produksi ia tampil "mm/dd/yyyy" — format
 *  Amerika di panel berbahasa Indonesia — dan itu tidak bisa dipaksa
 *  lewat HTML/CSS tanpa membangun date picker sendiri. Preset menghindari
 *  masalahnya sekaligus lebih cepat dipakai: rentang yang benar-benar
 *  dipilih orang saat menyaring lead hampir selalu "beberapa hari
 *  terakhir", bukan tanggal spesifik. */
export const DATE_PRESETS = [
  { key: 'all', label: 'Semua waktu', days: null },
  { key: '7', label: '7 hari', days: 7 },
  { key: '30', label: '30 hari', days: 30 },
  { key: '90', label: '90 hari', days: 90 },
] as const

export type DatePresetKey = (typeof DATE_PRESETS)[number]['key']

/** ISO yyyy-mm-dd untuk `days` hari lalu — format yang diminta backend. */
export function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}
