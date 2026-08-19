// components/admin/lead/LeadDetailPanel.tsx
// CP2 (2026-08-19) — panel konteks di sebelah daftar.
//
// SUMBER DATANYA TIDAK MENAMBAH REQUEST. Endpoint daftar sudah
// mengembalikan RFQLead LENGKAP (kontak, kebutuhan, catatan, status,
// jejak proposal) — lihat types/api.ts. Jadi panel ini murni merender
// ulang data yang sudah ada di memori. Tidak ada fetch per klik, dan
// memilih lead terasa instan.
//
// Yang TIDAK ditaruh di sini: generator proposal, riwayat status, dan
// editor catatan admin. Ketiganya butuh interaksi panjang dan sudah punya
// rumah di /admin/leads/[id]. Panel ini untuk MEMUTUSKAN lead mana yang
// dikerjakan; halaman detail untuk MENGERJAKANNYA.

'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  ArrowSquareOutIcon, EnvelopeSimpleIcon, WhatsappLogoIcon, UserIcon,
} from '@phosphor-icons/react/ssr'
import { LEAD_STATUSES, LABEL_MAP } from '@/lib/constants/lead-status'
import { formatVolume } from '@/lib/lead-format'
import type { LeadStatus, RFQLead } from '@/types/api'

interface Props {
  lead: RFQLead | null
  onStatusChange: (leadId: string, status: LeadStatus) => void
}

export function LeadDetailPanel({ lead, onStatusChange }: Props) {
  if (!lead) {
    return (
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 p-8 text-center">
        <UserIcon size={32} weight="duotone" aria-hidden="true" className="text-neutral-300" />
        <p className="font-ui text-sm font-medium text-ink-700">Pilih satu lead</p>
        <p className="max-w-[220px] text-xs text-neutral-500">
          Detailnya muncul di sini tanpa berpindah halaman.
        </p>
      </div>
    )
  }

  const waNumber = lead.whatsapp.replace(/\D/g, '').replace(/^0/, '62')

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
        <label className="sr-only" htmlFor="lead-status-select">Ubah status lead</label>
        <select
          id="lead-status-select"
          value={lead.status}
          onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
          className="font-ui h-8 shrink-0 rounded-xl border border-ink-900/10 bg-white px-2 text-xs font-medium text-ink-700 focus-visible:shadow-focus focus-visible:outline-none"
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>{LABEL_MAP[s]}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <Section title="Kebutuhan">
          <Row label="Industri" value={lead.industry_type} />
          <Row label="Jenis garam" value={lead.salt_types.join(', ') || '—'} />
          <Row label="Volume" value={formatVolume(lead)} mono />
          <Row label="Kota kirim" value={lead.delivery_city} />
        </Section>

        <Section title="Kontak">
          <Row label="Email" value={lead.email} />
          <Row label="WhatsApp" value={lead.whatsapp} mono />
        </Section>

        {lead.notes && (
          <Section title="Catatan dari pemohon">
            <p className="whitespace-pre-line text-xs leading-relaxed text-neutral-600">{lead.notes}</p>
          </Section>
        )}

        <Section title="Jejak">
          <Row
            label="Masuk"
            value={format(new Date(lead.created_at), "d MMM yyyy, HH:mm", { locale: idLocale })}
            mono
          />
          <Row
            label="Proposal"
            value={lead.proposal_sent_at
              ? `Terkirim ${format(new Date(lead.proposal_sent_at), 'd MMM yyyy', { locale: idLocale })}`
              : lead.proposal_generated ? 'Dibuat, belum dikirim' : 'Belum dibuat'}
          />
        </Section>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-ink-900/[0.06] p-3">
        <a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-ui flex h-9 items-center justify-center gap-1.5 rounded-xl border border-ink-900/10 bg-white text-xs font-semibold text-ink-700 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none"
        >
          <WhatsappLogoIcon size={15} weight="duotone" aria-hidden="true" />
          WhatsApp
        </a>
        <a
          href={`mailto:${lead.email}`}
          className="font-ui flex h-9 items-center justify-center gap-1.5 rounded-xl border border-ink-900/10 bg-white text-xs font-semibold text-ink-700 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none"
        >
          <EnvelopeSimpleIcon size={15} weight="duotone" aria-hidden="true" />
          Email
        </a>
        <Link
          href={`/admin/leads/${lead.id}`}
          className="font-ui col-span-2 flex h-9 items-center justify-center gap-1.5 rounded-xl bg-brand-teal-600 text-xs font-semibold text-white transition-colors hover:bg-brand-teal-500 focus-visible:shadow-focus focus-visible:outline-none"
        >
          Buka detail lengkap
          <ArrowSquareOutIcon size={15} weight="bold" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-ui mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="shrink-0 text-neutral-500">{label}</span>
      <span className={['min-w-0 break-words text-right text-ink-700', mono ? 'mono-tech' : ''].join(' ')}>
        {value}
      </span>
    </div>
  )
}
