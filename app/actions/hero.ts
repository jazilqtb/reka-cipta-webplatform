'use server'

// app/actions/hero.ts — CP3 (2026-08-21)
// Server Action penyimpan konten hero.
//
// VALIDASI DIULANG DI SINI, bukan hanya di form. Form berjalan di browser
// dan bisa dilewati siapa pun yang memanggil action ini langsung. Batas
// yang sama juga ditegakkan ketiga kalinya oleh CHECK constraint di tabel —
// tiga lapis untuk aturan yang sama, karena masing-masing melindungi dari
// jalur masuk yang berbeda.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { HERO_LIMITS, HERO_SPAN_STYLES, type HeroSpan } from '@/lib/hero-content'

interface SaveResult {
  ok: boolean
  error?: string
}

function sanitiseSpans(raw: HeroSpan[], maxChars: number): HeroSpan[] | string {
  if (!Array.isArray(raw)) return 'Bentuk data tidak dikenali.'
  const cleaned = raw
    .map((s) => ({
      text: typeof s?.text === 'string' ? s.text : '',
      style: HERO_SPAN_STYLES.includes(s?.style) ? s.style : ('plain' as const),
    }))
    .filter((s) => s.text.length > 0)
    .slice(0, HERO_LIMITS.maxSpans)

  const total = cleaned.reduce((n, s) => n + s.text.length, 0)
  if (total > maxChars) return `Teks melebihi ${maxChars} karakter.`
  return cleaned
}

export async function saveHeroContent(input: {
  headline: HeroSpan[]
  subheadline: HeroSpan[]
}): Promise<SaveResult> {
  const supabase = await createClient()

  // Otorisasi TIDAK diandalkan pada RLS saja. RLS adalah jaring pengaman
  // terakhir; menolak lebih awal di sini memberi pesan yang benar alih-alih
  // kegagalan tulis yang membingungkan.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk lagi.' }

  const headline = sanitiseSpans(input.headline, HERO_LIMITS.headlineChars)
  if (typeof headline === 'string') return { ok: false, error: headline }
  if (headline.length === 0) return { ok: false, error: 'Headline tidak boleh kosong.' }

  const subheadline = sanitiseSpans(input.subheadline, HERO_LIMITS.subheadlineChars)
  if (typeof subheadline === 'string') return { ok: false, error: subheadline }

  const { error } = await supabase
    .from('hero_content')
    .upsert(
      {
        singleton_guard: true,
        headline_parts: headline,
        subheadline_parts: subheadline,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      },
      { onConflict: 'singleton_guard' }
    )

  if (error) {
    console.error('[hero] gagal simpan:', error.message)
    return { ok: false, error: 'Gagal menyimpan. Perubahan tidak tersimpan.' }
  }

  // Beranda di-render statis; tanpa ini perubahan tidak akan terlihat
  // sampai revalidate berikutnya.
  revalidatePath('/')
  return { ok: true }
}
