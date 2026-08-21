// lib/rfq-units.ts — CP2 ronde 3
// Satuan perdagangan garam curah + konversi ke satuan KANONIK (kilogram).
//
// KENAPA KANONIK ITU WAJIB: tanpa satu satuan pembanding, agregasi di
// dashboard distribusi (CP3) mustahil benar — sak tidak bisa dijumlahkan
// dengan ton. Nilai asli yang dipilih pengguna TETAP disimpan supaya
// tampilan bisa mengembalikan bentuk yang ia ketik ("80 sak"), bukan hanya
// hasil konversinya.
//
// KONTAINER SENGAJA TIDAK ADA. Bobot satu kontainer berubah menurut jenis
// garam, kadar air, dan cara muat. Memberinya angka tetap akan menghasilkan
// konversi yang terlihat pasti tapi salah — dan angka salah yang ikut
// terjumlah di laporan lebih berbahaya daripada satuan yang tidak
// ditawarkan. Kalau pelanggan berpikir dalam kontainer, biarkan ia menulis
// di kolom keterangan.

export const RFQ_UNITS = [
  { value: 'kg',     label: 'kg',            kg: 1 },
  { value: 'ton',    label: 'ton',           kg: 1000 },
  { value: 'sak_25', label: 'sak (25 kg)',   kg: 25 },
  { value: 'sak_50', label: 'sak (50 kg)',   kg: 50 },
] as const

export type RFQUnit = (typeof RFQ_UNITS)[number]['value']

export const UNIT_TO_KG: Record<RFQUnit, number> = Object.fromEntries(
  RFQ_UNITS.map((u) => [u.value, u.kg])
) as Record<RFQUnit, number>

export const UNIT_LABEL: Record<RFQUnit, string> = Object.fromEntries(
  RFQ_UNITS.map((u) => [u.value, u.label])
) as Record<RFQUnit, string>

export function toKg(quantity: number, unit: RFQUnit): number {
  return Math.round(quantity * UNIT_TO_KG[unit] * 1000) / 1000
}

/** Untuk tampilan ringkas: kg besar dibaca sebagai ton. */
export function formatKg(kg: number | null | undefined): string {
  if (kg === null || kg === undefined) return '—'
  if (kg >= 1000) {
    const t = kg / 1000
    return `${t % 1 === 0 ? t : t.toFixed(2)} ton`
  }
  return `${kg % 1 === 0 ? kg : kg.toFixed(2)} kg`
}
