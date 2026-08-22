// components/admin/lead/LeadDetailPanel.tsx
//
// RANCANG ULANG (2026-08-19). Laporan Jazil: informasi RFQ "harus
// benar-benar dilihat dulu baru bisa dipahami" — tidak bisa dipindai.
//
// ═══ DIAGNOSIS ═══
// Versi sebelumnya memakai baris "label kiri — nilai kanan":
//     Industri                              makanan-minuman
//     Jenis garam   garam-halus-yodium, garam-halus-non-yodium, …
//     Volume                                   90 ton/bulan
// Lima hal yang membuatnya lambat dibaca:
//
// 1. PROXIMITAS RUSAK (Gestalt). Label dan nilainya justru dua elemen
//    TERJAUH pada baris yang sama. Mata harus melompati celah kosong yang
//    lebarnya berubah-ubah tiap baris.
// 2. TIDAK ADA KOLOM PINDAI. Nilai rata kanan berarti tepi kirinya
//    bergerigi, jadi tidak ada satu garis vertikal pun yang bisa diikuti
//    mata ke bawah — melawan pola baca F.
// 3. STRING MESIN. "makanan-minuman", "garam-halus-yodium" adalah slug
//    database. Setiap pembacaan menuntut penerjemahan mental.
// 4. HIERARKI DATAR. Volume — satu-satunya angka yang menentukan besar
//    penawaran — berbobot visual sama persis dengan "Kota kirim".
// 5. BEBAN INGATAN. Delapan baris setara tanpa pengelompokan; melebihi
//    kapasitas nyaman memori kerja (Miller ~4 keping).
//
// ═══ PENERAPAN ═══
// - HIERARKI: volume jadi angka display (30px, mono). Untuk RFQ garam,
//   "berapa ton" adalah pertanyaan pertama yang selalu ditanyakan.
// - RATA KIRI SEMUA: satu kolom pindai tunggal dari atas ke bawah.
// - LABEL MIKRO DI ATAS NILAI, bukan di sampingnya — jarak label→nilai
//   jadi sekecil mungkin (proximitas pulih).
// - LABEL MANUSIAWI menggantikan slug (lihat lib/lead-format.ts).
// - PENGELOMPOKAN: 4 blok (Kebutuhan / Kontak / Catatan / Jejak), masing-
//   masing maksimal 3 keping.
// - KONTRAS TIPOGRAFI, BUKAN WARNA: ukuran & bobot membedakan tingkatan.
//   Warna disimpan untuk status, yang memang butuh dikenali seketika.
// - KONTAK JADI TAUTAN AKTIF: nomor dan email bukan sekadar teks —
//   di panel ini keduanya memang dipakai untuk menghubungi.

'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  ArrowSquareOutIcon, EnvelopeSimpleIcon, WhatsappLogoIcon, UserIcon, MapPinIcon,
} from '@phosphor-icons/react/ssr'
import { LEAD_STATUSES, LABEL_MAP } from '@/lib/constants/lead-status'
import { frequencyLabel, industryLabel, saltTypeLabels } from '@/lib/lead-format'
import type { LeadStatus, RFQLead } from '@/types/api'
import { TaskComposer } from '@/components/admin/task/TaskComposer'
import { LeadArchiveActions } from './LeadArchiveActions'

interface Props {
  lead: RFQLead | null
  productNames: Record<string, string>
  onStatusChange: (leadId: string, status: LeadStatus) => void
  /** CP1 ronde 4 — dipanggil setelah lead diarsipkan/dipulihkan/dihapus,
   *  supaya daftar di sebelahnya ikut menyesuaikan. */
  onArchiveChanged?: () => void
}

export function LeadDetailPanel({ lead, productNames, onStatusChange, onArchiveChanged }: Props) {
  if (!lead) {
    return (
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 p-8 text-center">
        <UserIcon size={40} weight="duotone" aria-hidden="true" className="text-neutral-300" />
        <p className="font-ui text-sm font-medium text-ink-700">Pilih satu lead</p>
        <p className="max-w-[220px] text-xs text-neutral-500">
          Detailnya muncul di sini tanpa berpindah halaman.
        </p>
      </div>
    )
  }

  const waNumber = lead.whatsapp.replace(/\D/g, '').replace(/^0/, '62')
  const products = saltTypeLabels(lead.salt_types, productNames)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-ink-900/[0.06] p-4">
        <div className="min-w-0">
          <h2 className="font-ui truncate text-base font-semibold text-ink-700">
            {lead.company_name}
          </h2>
          <p className="mt-0.5 truncate text-xs text-neutral-500">
            {lead.full_name}{lead.position ? ` · ${lead.position}` : ''}
          </p>
        </div>
        {/* Label dibuat TERLIHAT, bukan sr-only. Memindahkan lead di
            pipeline adalah tindakan paling sering dan paling menentukan di
            layar ini, tapi kontrolnya tampil sebagai dropdown yang cuma
            menulis "Negosiasi" — tidak terbaca sebagai sesuatu yang bisa
            diubah, hanya sebagai keterangan. Satu label kecil mengubahnya
            dari informasi jadi tindakan. */}
        <div className="shrink-0">
          <label
            className="font-ui mb-1 block text-right text-xs font-medium text-neutral-500"
            htmlFor="lead-status-select"
          >
            Status
          </label>
        <select
          id="lead-status-select"
          value={lead.status}
          onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
          className="font-ui h-9 shrink-0 rounded-md border border-ink-900/15 bg-white px-2 text-sm font-medium text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>{LABEL_MAP[s]}</option>
          ))}
        </select>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {/* ── Angka penentu. Ditaruh paling atas dan paling besar karena
             inilah yang dicari lebih dulu pada tiap RFQ garam. ── */}
        <div>
          <p className="mono-tech text-2xl font-semibold leading-none text-ink-700">
            {lead.volume_per_month}
            <span className="ml-1 text-base font-medium text-neutral-500">ton</span>
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-600">
            <span>{frequencyLabel(lead.delivery_frequency)}</span>
            <span className="text-neutral-300" aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPinIcon size={16} weight="duotone" aria-hidden="true" className="text-neutral-400" />
              {lead.delivery_city}
            </span>
          </p>
        </div>

        <Group title="Produk diminta">
          <ul role="list" className="flex flex-wrap gap-1.5">
            {products.map((name) => (
              <li
                key={name}
                className="font-ui rounded-lg bg-brand-teal-50 px-2 py-1 text-xs font-medium text-brand-teal-700"
              >
                {name}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-neutral-600">
            Industri: <span className="text-ink-700">{industryLabel(lead.industry_type)}</span>
          </p>
        </Group>

        <Group title="Kontak">
          <div className="space-y-1">
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mono-tech block text-sm text-ink-700 underline-offset-2 hover:text-brand-teal-600 hover:underline"
            >
              {lead.whatsapp}
            </a>
            <a
              href={`mailto:${lead.email}`}
              className="block break-all text-sm text-ink-700 underline-offset-2 hover:text-brand-teal-600 hover:underline"
            >
              {lead.email}
            </a>
          </div>
        </Group>

        {lead.notes && (
          <Group title="Catatan dari pemohon">
            <p className="whitespace-pre-line rounded-xl bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-700">
              {lead.notes}
            </p>
          </Group>
        )}

        {/* CP4 ronde 3 — follow-up dibuat DI SINI, tepat saat operator
            sedang melihat leadnya. Tugas yang dibuat dari halaman terpisah
            hampir selalu kehilangan konteks: "hubungi lagi" tanpa menyebut
            siapa. Tugasnya melekat ke RFQ ini lewat foreign key sungguhan. */}
        <Group title="Follow-up">
          <TaskComposer parentKind="rfq" parentId={lead.id} />
        </Group>

        {/* Aksi merusak ditaruh SETELAH seluruh informasi, bukan di kepala
            panel: yang dicari orang saat membuka lead adalah datanya, dan
            tombol membuang tidak boleh berada di jalur pandang itu. */}
        <Group title="Kelola">
          <LeadArchiveActions
            lead={lead}
            layout="panel"
            onChanged={() => onArchiveChanged?.()}
          />
        </Group>

        <Group title="Jejak">
          <p className="text-xs text-neutral-600">
            Masuk{' '}
            <span className="mono-tech text-ink-700">
              {format(new Date(lead.created_at), 'd MMM yyyy, HH:mm', { locale: idLocale })}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-neutral-600">
            Proposal:{' '}
            <span className="text-ink-700">
              {lead.proposal_sent_at
                ? `terkirim ${format(new Date(lead.proposal_sent_at), 'd MMM yyyy', { locale: idLocale })}`
                : lead.proposal_generated ? 'dibuat, belum dikirim' : 'belum dibuat'}
            </span>
          </p>
        </Group>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-ink-900/[0.06] p-3">
        <a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-ui flex h-9 items-center justify-center gap-1.5 rounded-xl border border-ink-900/10 bg-white text-xs font-semibold text-ink-700 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none"
        >
          <WhatsappLogoIcon size={16} weight="duotone" aria-hidden="true" />
          WhatsApp
        </a>
        <a
          href={`mailto:${lead.email}`}
          className="font-ui flex h-9 items-center justify-center gap-1.5 rounded-xl border border-ink-900/10 bg-white text-xs font-semibold text-ink-700 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none"
        >
          <EnvelopeSimpleIcon size={16} weight="duotone" aria-hidden="true" />
          Email
        </a>
        <Link
          href={`/admin/leads/${lead.id}`}
          className="font-ui col-span-2 flex h-9 items-center justify-center gap-1.5 rounded-xl bg-brand-teal-600 text-xs font-semibold text-white transition-colors hover:bg-brand-teal-500 focus-visible:shadow-focus focus-visible:outline-none"
        >
          Buka detail lengkap
          <ArrowSquareOutIcon size={16} weight="bold" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-ui mb-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400">
        {title}
      </h3>
      {children}
    </div>
  )
}
