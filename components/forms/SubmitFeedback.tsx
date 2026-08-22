'use client'

// components/forms/SubmitFeedback.tsx — CP0 ronde 4
//
// KENAPA KOMPONEN INI ADA
//
// Poin 4 ronde ini: "tombol kirim ditekan, tidak muncul apa pun". Akar
// masalahnya satu bug validasi (lihat lib/validation/rfq-schema.ts), tapi
// yang membuat bug itu MAHAL bukan bugnya — melainkan tidak adanya jalur
// kegagalan yang terlihat. Bug yang sama dengan pesan error di layar akan
// dilaporkan dalam sehari; tanpa pesan, ia bertahan satu ronde penuh dan
// menghabiskan satu-satunya jalur konversi situs.
//
// Karena itu perbaikannya bukan hanya membetulkan validasinya, tapi
// menutup KELASNYA: setiap cabang hasil submit — ditolak validasi, ditolak
// server, tidak pernah sampai ke server — harus punya keadaan yang terlihat
// dan menyebut sebabnya. Tidak ada cabang yang boleh berakhir diam.
//
// Kosakata nadanya mengikuti AdminState §4.8 (DESIGN-SYSTEM.md), yang sudah
// membedakan `error` (server MENJAWAB galat) dari `blocked` (permintaan
// TIDAK PERNAH SAMPAI). Perbedaan itu sama pentingnya di portal publik:
// menyuruh orang "periksa koneksi" saat yang ditolak adalah origin CORS
// membuat ia mencari masalah di tempat yang salah.
//
// KENAPA BUKAN TOAST SAJA. Toast di pojok kanan bawah hilang sendiri dan
// jauh dari tombol yang baru ditekan. Untuk kegagalan yang menuntut
// tindakan (perbaiki field, coba lagi), keadaannya harus MENETAP dan berada
// di dekat tombolnya. Toast dipertahankan sebagai pelengkap, bukan sebagai
// satu-satunya penyampai.

import { WarningIcon, WarningCircleIcon, PlugsIcon, ClockIcon } from '@phosphor-icons/react/ssr'

/** Nada kegagalan. Sengaja dipisah — bukan satu "gagal" generik. */
export type SubmitFailureKind =
  /** Validasi klien menolak. Datanya belum terkirim, dan pengguna bisa memperbaikinya. */
  | 'invalid'
  /** Server MENJAWAB dengan galat (4xx/5xx selain yang di bawah). */
  | 'server'
  /** Permintaan tidak pernah sampai: server mati, jaringan putus, ATAU origin ditolak. */
  | 'blocked'
  /** Rate limit — bukan kesalahan pengguna, dan "coba lagi" sekarang pasti gagal. */
  | 'rate_limit'
  /** Permintaan terkirim tapi jawabannya tidak datang tepat waktu. */
  | 'timeout'

export interface SubmitFailure {
  kind: SubmitFailureKind
  /** Rincian dari server, kalau ada. Tidak pernah berisi token/kredensial. */
  detail?: string
  /** Untuk `invalid`: label field yang ditolak, dalam bahasa pengguna. */
  fields?: string[]
}

const ICON: Record<SubmitFailureKind, typeof WarningIcon> = {
  invalid: WarningIcon,
  server: WarningCircleIcon,
  blocked: PlugsIcon,
  rate_limit: ClockIcon,
  timeout: ClockIcon,
}

/** `invalid` dan `rate_limit` bukan kerusakan — keduanya keadaan "tunggu /
 *  perbaiki", jadi nadanya warning. Sisanya danger. */
const TONE: Record<SubmitFailureKind, 'warning' | 'danger'> = {
  invalid: 'warning',
  server: 'danger',
  blocked: 'danger',
  rate_limit: 'warning',
  timeout: 'danger',
}

const TITLE: Record<SubmitFailureKind, string> = {
  invalid: 'Ada isian yang belum benar',
  server: 'Permintaan Anda tidak tersimpan',
  blocked: 'Permintaan tidak sampai ke server kami',
  rate_limit: 'Terlalu banyak permintaan dari jaringan ini',
  timeout: 'Server terlalu lama menjawab',
}

function bodyFor(f: SubmitFailure): string {
  switch (f.kind) {
    case 'invalid':
      return f.fields && f.fields.length > 0
        ? `Periksa kembali: ${f.fields.join(', ')}.`
        : 'Periksa kembali isian yang ditandai merah di bawah.'
    case 'server':
      /* Pesan server dipakai apa adanya kalau ada — ia lebih spesifik
         daripada kalimat generik apa pun yang bisa kita tulis di sini. */
      return f.detail
        ? `${f.detail} Isian Anda masih tersimpan di layar ini, jadi Anda bisa langsung mencoba lagi.`
        : 'Server kami menerima permintaannya tapi gagal menyimpannya. Isian Anda masih tersimpan di layar ini, jadi Anda bisa langsung mencoba lagi.'
    case 'blocked':
      /* Browser sengaja tidak membedakan "server mati", "jaringan putus",
         dan "origin ditolak" — ketiganya keluar sebagai satu
         `TypeError: Failed to fetch`. Karena kita memang tidak tahu yang
         mana, teksnya MENYEBUT keduanya, bukan menebak satu (§4.8). */
      return 'Ini bisa berarti koneksi Anda terputus, atau server kami sedang tidak dapat dihubungi. Isian Anda tidak hilang. Kalau berulang, hubungi kami lewat WhatsApp di footer halaman ini.'
    case 'rate_limit':
      return 'Demi mencegah spam, pengiriman dibatasi 5 kali per jam. Silakan coba lagi nanti, atau hubungi kami langsung lewat WhatsApp.'
    case 'timeout':
      return 'Permintaan Anda mungkin sudah masuk, mungkin juga belum. Tunggu sebentar sebelum mengirim ulang supaya tidak terkirim dua kali.'
  }
}

/** Kapan "coba lagi" masuk akal ditawarkan. Menawarkannya pada rate limit
 *  berarti menyuruh orang mengulang hal yang pasti gagal (§4.8). */
const RETRYABLE: Record<SubmitFailureKind, boolean> = {
  invalid: false,
  server: true,
  blocked: true,
  rate_limit: false,
  timeout: false,
}

interface Props {
  failure: SubmitFailure | null
  /** Kalau diisi, tombol "Coba lagi" tampil untuk nada yang pantas. */
  onRetry?: () => void
}

export function SubmitFeedback({ failure, onRetry }: Props) {
  if (!failure) return null

  const tone = TONE[failure.kind]
  const Icon = ICON[failure.kind]
  const showRetry = RETRYABLE[failure.kind] && !!onRetry

  return (
    <div
      /* role="alert" + aria-live: pembaca layar mengumumkannya tanpa perlu
         fokus berpindah. Kegagalan yang hanya terlihat mata bukan kegagalan
         yang terkomunikasikan. */
      role="alert"
      aria-live="assertive"
      className={
        tone === 'danger'
          ? 'flex items-start gap-3 rounded-md border border-danger-200 bg-danger-50 p-4'
          : 'flex items-start gap-3 rounded-md border border-warning-200 bg-warning-50 p-4'
      }
    >
      <Icon
        size={20}
        weight="regular"
        aria-hidden="true"
        className={tone === 'danger' ? 'mt-0.5 shrink-0 text-danger-700' : 'mt-0.5 shrink-0 text-warning-700'}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className={tone === 'danger' ? 'text-sm font-medium text-danger-700' : 'text-sm font-medium text-warning-700'}>
          {TITLE[failure.kind]}
        </p>
        <p className="text-sm text-steel-700">{bodyFor(failure)}</p>
        {showRetry && (
          <button
            type="button"
            onClick={onRetry}
            /* Sekunder, bukan primary: tombol simpan/kirim tetap satu-satunya
               primary di form ini (§4.7 aturan 5 — aksi tidak setara tidak
               boleh tampil setara). */
            className="mt-2 inline-flex h-9 items-center rounded-md border border-steel-300 bg-white px-3 text-sm font-medium text-steel-700 transition-colors hover:bg-steel-50 focus-visible:outline-none focus-visible:shadow-focus"
          >
            Coba lagi
          </button>
        )}
      </div>
    </div>
  )
}

/** Menerjemahkan `ApiFetchError` menjadi nada yang tepat.
 *
 *  Dipusatkan di sini supaya ketiga form publik (RFQ, supplier, kontak)
 *  memetakan status yang sama ke pesan yang sama — pemetaan yang disalin
 *  ke tiap form adalah cara pemetaan itu berselisih dalam tiga bulan. */
export function failureFromStatus(status: number, detail?: string): SubmitFailure {
  if (status === 0) return { kind: 'blocked' }
  if (status === 408) return { kind: 'timeout' }
  if (status === 429) return { kind: 'rate_limit' }
  return { kind: 'server', detail }
}
