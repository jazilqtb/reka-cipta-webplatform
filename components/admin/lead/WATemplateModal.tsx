'use client'

// components/admin/lead/WATemplateModal.tsx
// Epic 4B Slice 1 (E4B-S1-FE-13) — susun pesan WhatsApp dari template,
// boleh disunting, lalu dibuka di wa.me.
//
// BUGFIX + REDESAIN (2026-08-19). Laporan: "tampilannya transparan, tidak
// enak dibaca, dan kurang enak untuk input teks."
//
// ═══ PENYEBAB TRANSPARANSI ═══
// Bukan salah komponen ini. components/ui/dialog.tsx memberi panel kelas
// `bg-popover`, yang TIDAK PERNAH LAHIR di CSS — Tailwind v4 hanya
// menghasilkan utility dari entri `--color-*` di `@theme`, sedangkan
// globals.css hanya mendefinisikan `--popover` di `:root`. Penjelasan
// lengkap ada di components/brand/BrandDialogContent.tsx, yang kini
// dipakai di sini sebagai pengganti DialogContent mentah.
//
// ═══ KEPUTUSAN UX ═══
//
// 1. NOMOR TUJUAN DITAMPILKAN UTUH, tidak lagi disamarkan.
//    Sebelumnya "0877****06". Di daftar lead, penyamaran masuk akal —
//    nomor lewat begitu saja di layar. Di sini pengguna SEDANG hendak
//    mengirim pesan ke nomor itu; menyamarkannya menghalangi satu-satunya
//    pemeriksaan yang penting (benar tidak nomornya?) tanpa melindungi
//    apa pun, karena tujuan dialog ini memang mengirim ke sana.
//
// 2. Textarea jadi area utama: lebih tinggi, leading longgar, autofocus
//    dengan kursor di akhir teks. Sebelumnya ia satu kotak kecil di
//    antara dua baris teks dengan bobot visual setara.
//
// 3. Penghitung karakter. Pesan panjang terpotong di pratinjau notifikasi
//    WhatsApp; angka ini memberi sinyal tanpa memaksa batas.
//
// 4. "Kembalikan ke template" — sebelumnya sekali disunting, satu-satunya
//    cara kembali adalah menutup lalu membuka lagi dialog.
//
// 5. "Salin" — sebagian orang mengirim lewat WhatsApp Desktop atau
//    Business yang tidak selalu menangani tautan wa.me dengan benar.
//
// 6. Status dipindah jadi keterangan sub-judul: ia menjelaskan MENGAPA
//    template-nya berbunyi begitu, bukan informasi berdiri sendiri.

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowCounterClockwiseIcon, CopyIcon, WhatsappLogoIcon,
} from '@phosphor-icons/react/ssr'
import { getWATemplate } from '@/lib/api'
import { LABEL_MAP } from '@/lib/constants/lead-status'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BrandDialogContent } from '@/components/brand/BrandDialogContent'
import type { LeadStatus } from '@/types/api'

interface Props {
  leadId: string
  status: LeadStatus
  whatsapp: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WATemplateModal({ leadId, status, whatsapp, open, onOpenChange }: Props) {
  const [template, setTemplate] = useState('')
  const [original, setOriginal] = useState('')
  const [whatsappClean, setWhatsappClean] = useState('')
  const [loading, setLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function loadTemplate() {
    setLoading(true)
    try {
      const res = await getWATemplate(leadId, status)
      setTemplate(res.template)
      setOriginal(res.template)
      setWhatsappClean(res.whatsapp_number)
    } catch {
      toast.error('Gagal memuat template')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTemplate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leadId, status])

  // Kursor ditaruh di AKHIR teks, bukan di awal. Pola pemakaian yang
  // sebenarnya adalah menambahkan kalimat di ujung template, bukan
  // menulis ulang dari depan.
  useEffect(() => {
    if (loading || !open) return
    const el = textareaRef.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [loading, open])

  function openWhatsApp() {
    const url = `https://wa.me/${whatsappClean}?text=${encodeURIComponent(template)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    onOpenChange(false)
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(template)
      toast.success('Pesan disalin')
    } catch {
      toast.error('Gagal menyalin. Salin manual dari kotak teks.')
    }
  }

  const isEdited = template !== original

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <BrandDialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-ui text-base font-semibold text-ink-700">
            Pesan WhatsApp
          </DialogTitle>
          <p className="text-xs text-neutral-500">
            Template untuk status &ldquo;{LABEL_MAP[status]}&rdquo;
          </p>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2 py-2" aria-busy="true">
            <div className="skeleton h-11 w-full rounded-xl" />
            <div className="skeleton h-48 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-ink-900/[0.07] bg-neutral-50 px-3 py-2">
              <p className="font-ui text-xs font-bold uppercase tracking-wider text-neutral-400">
                Kirim ke
              </p>
              <p className="mono-tech mt-0.5 text-sm text-ink-700">{whatsapp}</p>
            </div>

            <div>
              <label htmlFor="wa-message" className="sr-only">Isi pesan WhatsApp</label>
              <textarea
                id="wa-message"
                ref={textareaRef}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={12}
                className="w-full resize-y rounded-xl border border-ink-900/10 bg-white p-3.5 text-sm leading-relaxed text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
              />
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="mono-tech text-xs text-neutral-400">
                  {template.length} karakter
                </span>
                {isEdited && (
                  <button
                    type="button"
                    onClick={() => setTemplate(original)}
                    className="font-ui flex items-center gap-1 text-xs font-medium text-neutral-500 transition-colors hover:text-brand-teal-600 focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    <ArrowCounterClockwiseIcon size={16} weight="bold" aria-hidden="true" />
                    Kembalikan ke template
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-900/[0.06] pt-3">
              <button
                type="button"
                onClick={copyMessage}
                className="font-ui flex h-10 items-center gap-1.5 rounded-xl border border-ink-900/10 px-3 text-sm font-medium text-ink-700 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none"
              >
                <CopyIcon size={16} weight="duotone" aria-hidden="true" />
                Salin
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="font-ui h-10 rounded-xl border border-ink-900/10 px-4 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={openWhatsApp}
                  disabled={!whatsappClean || !template.trim()}
                  className="font-ui flex h-10 items-center gap-1.5 rounded-xl bg-brand-teal-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal-500 focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <WhatsappLogoIcon size={16} weight="duotone" aria-hidden="true" />
                  Buka WhatsApp
                </button>
              </div>
            </div>
          </>
        )}
      </BrandDialogContent>
    </Dialog>
  )
}
