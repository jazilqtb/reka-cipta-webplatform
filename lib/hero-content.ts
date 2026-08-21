// lib/hero-content.ts
// Kontrak konten hero yang bisa disunting admin (CP3, 2026-08-21).
//
// KEAMANAN — kenapa di sini tidak ada sanitasi HTML sama sekali.
// Teks dari admin TIDAK PERNAH ditafsirkan sebagai markup. Ia disimpan
// sebagai string biasa dan dirender sebagai text node React, jadi
// "<script>" yang diketik admin akan tampil sebagai lima karakter, bukan
// dieksekusi. Yang dipilih admin hanyalah LABEL gaya, dan label itu
// dicocokkan ke daftar tetap di bawah. Ini lebih kuat daripada menyimpan
// HTML lalu menyaringnya: tidak ada penyaring yang bisa gagal, karena
// tidak pernah ada HTML.

export const HERO_SPAN_STYLES = ['plain', 'bold', 'italic', 'primary'] as const
export type HeroSpanStyle = (typeof HERO_SPAN_STYLES)[number]

export interface HeroSpan {
  text: string
  style: HeroSpanStyle
}

export interface HeroContent {
  headline: HeroSpan[]
  subheadline: HeroSpan[]
}

/** Batas yang SAMA ditegakkan di form admin dan di CHECK constraint tabel.
 *  Form bisa dilewati (curl, ekstensi, bug); tabel tidak. */
export const HERO_LIMITS = {
  headlineChars: 120,
  subheadlineChars: 160,
  maxSpans: 8,
} as const

/** Satu-satunya tempat gaya diterjemahkan ke kelas. Daftar tertutup:
 *  gaya yang tidak dikenal jatuh ke 'plain', tidak pernah ke kelas bebas.
 *  Inilah yang membuat CMS tidak bisa merusak sistem desain — admin memilih
 *  PERAN, bukan warna. */
export const HERO_STYLE_CLASS: Record<HeroSpanStyle, string> = {
  plain: '',
  bold: 'font-semibold',
  italic: 'italic',
  primary: 'font-medium text-brand-teal-600',
}

export function heroStyleClass(style: string): string {
  return HERO_STYLE_CLASS[style as HeroSpanStyle] ?? HERO_STYLE_CLASS.plain
}

/** Membersihkan apa pun yang datang dari DB menjadi bentuk yang pasti aman
 *  dirender. Dipakai di sisi baca, bukan hanya di sisi tulis — baris lama,
 *  impor manual, atau perubahan lewat SQL editor tidak melewati form. */
export function parseHeroSpans(raw: unknown): HeroSpan[] {
  if (!Array.isArray(raw)) return []
  const out: HeroSpan[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const text = (item as { text?: unknown }).text
    if (typeof text !== 'string' || text.length === 0) continue
    const style = (item as { style?: unknown }).style
    out.push({
      text,
      style: HERO_SPAN_STYLES.includes(style as HeroSpanStyle)
        ? (style as HeroSpanStyle)
        : 'plain',
    })
    if (out.length >= HERO_LIMITS.maxSpans) break
  }
  return out
}

export function spansToPlainText(spans: HeroSpan[]): string {
  return spans.map((s) => s.text).join('')
}
