'use client'

// components/admin/hero/HeroEditor.tsx — CP3 (2026-08-21)
//
// Menyunting headline & sub-headline hero sebagai DERET SPAN BERLABEL,
// bukan sebagai HTML.
//
// KENAPA TIDAK ADA COLOR PICKER — ini keputusan yang paling menentukan di
// layar ini. Kebebasan warna di CMS adalah cara paling cepat sistem desain
// runtuh: dalam tiga bulan akan ada empat biru yang hampir sama, satu
// merah yang bukan warna danger, dan tidak ada yang tahu mana yang benar.
// Jadi admin memilih PERAN ("Warna utama"), bukan nilai. Peran diterjemah-
// kan ke kelas oleh lib/hero-content.ts, dan daftarnya tertutup.

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { FloppyDiskIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react'
import {
  HERO_LIMITS,
  HERO_SPAN_STYLES,
  heroStyleClass,
  spansToPlainText,
  type HeroSpan,
  type HeroSpanStyle,
} from '@/lib/hero-content'
import { AdminCard } from '@/components/admin/ui/AdminPrimitives'
import { InfoHint } from '@/components/admin/ui/InfoHint'
import { saveHeroContent } from '@/app/actions/hero'

/** Label yang dibaca admin. Sengaja menyebut PERAN, bukan warna — supaya
 *  ketika token primary berganti hue (seperti yang baru saja terjadi),
 *  pilihan yang sudah disimpan tetap benar tanpa disentuh. */
const STYLE_LABEL: Record<HeroSpanStyle, string> = {
  plain: 'Biasa',
  bold: 'Tebal',
  italic: 'Miring',
  primary: 'Warna utama',
}

interface Props {
  initialHeadline: HeroSpan[]
  initialSubheadline: HeroSpan[]
}

export function HeroEditor({ initialHeadline, initialSubheadline }: Props) {
  const [headline, setHeadline] = useState<HeroSpan[]>(
    initialHeadline.length ? initialHeadline : [{ text: '', style: 'plain' }]
  )
  const [sub, setSub] = useState<HeroSpan[]>(
    initialSubheadline.length ? initialSubheadline : [{ text: '', style: 'plain' }]
  )
  const [pending, startTransition] = useTransition()

  const headlineLen = spansToPlainText(headline).length
  const subLen = spansToPlainText(sub).length
  const subSentences = (spansToPlainText(sub).match(/[.!?](\s|$)/g) ?? []).length

  const tooLong = headlineLen > HERO_LIMITS.headlineChars || subLen > HERO_LIMITS.subheadlineChars
  const emptyHeadline = headlineLen === 0

  function save() {
    startTransition(async () => {
      const res = await saveHeroContent({ headline, subheadline: sub })
      if (res.ok) toast.success('Hero diperbarui')
      else toast.error(res.error ?? 'Gagal menyimpan hero')
    })
  }

  return (
    <div className="space-y-5">
      <AdminCard className="p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-ui text-sm font-semibold text-ink-700">Pratinjau</h2>
          <span className="font-ui text-xs text-neutral-500">Seperti yang dilihat pengunjung</span>
        </div>
        {/* Pratinjau memakai KELAS YANG SAMA dengan halaman publik, jadi
            yang terlihat di sini benar-benar yang akan tayang. */}
        {/* Latar GELAP, sama dengan hero sungguhan. Pratinjau yang
            berlatar terang akan membohongi admin soal keterbacaan. */}
        <div className="surface-dark rounded-md p-4">
          <p className="text-balance font-display text-2xl font-semibold leading-tight tracking-tight text-white">
            {headline.map((s, i) => (
              <span key={i} className={heroStyleClass(s.style)}>{s.text}</span>
            ))}
          </p>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-steel-200">
            {sub.map((s, i) => (
              <span key={i} className={heroStyleClass(s.style)}>{s.text}</span>
            ))}
          </p>
        </div>
      </AdminCard>

      <SpanListEditor
        title="Headline"
        hint="Pecah kalimat menjadi beberapa bagian kalau ada kata yang ingin ditebalkan atau diberi warna utama. Satu bagian = satu potongan teks dengan satu gaya."
        spans={headline}
        onChange={setHeadline}
        length={headlineLen}
        limit={HERO_LIMITS.headlineChars}
        disabled={pending}
      />

      <SpanListEditor
        title="Sub-headline"
        hint="Satu kalimat. Kalau butuh lebih dari satu kalimat, itu bukan sub-headline melainkan teks isi, dan tempatnya bukan di hero."
        spans={sub}
        onChange={setSub}
        length={subLen}
        limit={HERO_LIMITS.subheadlineChars}
        disabled={pending}
        warning={subSentences > 1 ? 'Terbaca lebih dari satu kalimat. Sub-headline hero dibatasi satu kalimat.' : null}
      />

      <div className="flex items-center justify-end gap-3">
        {emptyHeadline && (
          <span className="font-ui text-xs text-danger-600">Headline tidak boleh kosong.</span>
        )}
        <button
          type="button"
          onClick={save}
          disabled={pending || tooLong || emptyHeadline}
          className="font-ui inline-flex h-9 items-center gap-2 rounded-md bg-brand-teal-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-teal-500 focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FloppyDiskIcon size={16} weight="bold" aria-hidden="true" />
          {pending ? 'Menyimpan…' : 'Simpan hero'}
        </button>
      </div>
    </div>
  )
}

function SpanListEditor({
  title, hint, spans, onChange, length, limit, disabled, warning,
}: {
  title: string
  hint: string
  spans: HeroSpan[]
  onChange: (next: HeroSpan[]) => void
  length: number
  limit: number
  disabled: boolean
  warning?: string | null
}) {
  const over = length > limit
  function update(i: number, patch: Partial<HeroSpan>) {
    onChange(spans.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }
  return (
    <AdminCard className="p-4 md:p-5">
      <div className="mb-1 flex items-center gap-1.5">
        <h2 className="font-ui text-sm font-semibold text-ink-700">{title}</h2>
        <InfoHint title={title}>{hint}</InfoHint>
        <span className={`font-ui ml-auto text-xs ${over ? 'text-danger-600' : 'text-neutral-500'}`}>
          {length}/{limit}
        </span>
      </div>
      {warning && <p className="mb-2 text-xs text-warning-700">{warning}</p>}

      <div className="space-y-2">
        {spans.map((span, i) => (
          <div key={i} className="flex items-start gap-2">
            <input
              value={span.text}
              disabled={disabled}
              onChange={(e) => update(i, { text: e.target.value })}
              placeholder="Potongan teks…"
              className="h-9 min-w-0 flex-1 rounded-md border border-ink-900/15 px-2.5 text-sm text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
            />
            <select
              value={span.style}
              disabled={disabled}
              onChange={(e) => update(i, { style: e.target.value as HeroSpanStyle })}
              aria-label={`Gaya untuk bagian ${i + 1}`}
              className="font-ui h-9 shrink-0 rounded-md border border-ink-900/15 bg-white px-2 text-sm text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
            >
              {HERO_SPAN_STYLES.map((st) => (
                <option key={st} value={st}>{STYLE_LABEL[st]}</option>
              ))}
            </select>
            <button
              type="button"
              disabled={disabled || spans.length <= 1}
              onClick={() => onChange(spans.filter((_, idx) => idx !== i))}
              aria-label={`Hapus bagian ${i + 1}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-danger-50 hover:text-danger-600 focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-400"
            >
              <TrashIcon size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={disabled || spans.length >= HERO_LIMITS.maxSpans}
        onClick={() => onChange([...spans, { text: '', style: 'plain' }])}
        className="font-ui mt-2 inline-flex h-8 items-center gap-1.5 rounded-md border border-ink-900/12 px-2.5 text-xs font-medium text-ink-700 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-40"
      >
        <PlusIcon size={16} aria-hidden="true" />
        Tambah bagian
      </button>
    </AdminCard>
  )
}
