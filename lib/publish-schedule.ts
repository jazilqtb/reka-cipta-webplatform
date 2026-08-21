// lib/publish-schedule.ts
// CP5 ronde 3 — penjadwalan terbit artikel.
//
// Tiga keadaan, bukan dua. Sebelum ini sebuah artikel hanya "draf" atau
// "terbit"; sekarang ada keadaan ketiga di antaranya — sudah disetujui,
// belum waktunya. Menyatukannya dengan "terbit" akan membuat admin melihat
// badge hijau untuk artikel yang tidak bisa dibuka siapa pun, dan itu
// persis jenis kebingungan yang berakhir dengan artikel diterbitkan ulang
// secara manual karena dikira rusak.
//
// SUMBER KEBENARANNYA TETAP RLS, BUKAN FILE INI. Modul ini hanya
// menerjemahkan keadaan untuk ditampilkan. Yang menentukan sebuah artikel
// terlihat atau tidak adalah kebijakan di migrasi 20260822110000 —
// termasuk untuk sitemap dan akses langsung ke slug.

export type PublishState = 'draft' | 'scheduled' | 'published'

export function publishState(
  isPublished: boolean,
  publishedAt: string | null | undefined,
  now: Date = new Date()
): PublishState {
  if (!isPublished) return 'draft'
  if (!publishedAt) return 'published'
  return new Date(publishedAt).getTime() > now.getTime() ? 'scheduled' : 'published'
}

export const PUBLISH_STATE_LABEL: Record<PublishState, string> = {
  draft: 'Draf',
  scheduled: 'Terjadwal',
  published: 'Terbit',
}

/** ISO UTC -> nilai untuk <input type="datetime-local">, dalam waktu LOKAL
 *  peramban. `toISOString()` TIDAK bisa dipakai di sini: ia mengembalikan
 *  UTC, jadi admin di WIB akan melihat jam 7 lebih awal dari yang ia
 *  tetapkan sendiri. */
export function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Nilai <input type="datetime-local"> -> ISO ber-offset.
 *
 *  Offsetnya WAJIB ikut terkirim. `datetime-local` tidak membawa zona
 *  waktu, jadi "2026-09-01T08:00" itu ambigu; kalau dikirim apa adanya,
 *  yang mengartikannya adalah server — dan server ada di UTC sementara
 *  adminnya di WIB. Selisih 7 jam pada penjadwalan berarti artikel terbit
 *  di hari yang salah. `new Date(v)` menafsirkan string ini sebagai waktu
 *  lokal peramban (perilaku yang dispesifikasikan untuk bentuk tanpa Z),
 *  lalu toISOString() memberi UTC yang setara — persis yang dibutuhkan. */
export function fromLocalInputValue(v: string): string | null {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export function formatSchedule(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}
