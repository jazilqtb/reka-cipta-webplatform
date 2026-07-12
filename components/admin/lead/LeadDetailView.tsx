'use client'

// components/admin/lead/LeadDetailView.tsx
// Epic 4B Slice 1 (E4B-S1-FE-09) — fetch-on-mount detail lead + histori
// (pattern SettingsForm, client-side karena butuh apiFetch auth:true).
// "Not found" ditampilkan sebagai state lokal (bukan next/navigation
// notFound(), yang server-only) kalau API balas 404.

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { getLeadDetail, ApiFetchError } from '@/lib/api'
import { revalidateLeadRoutes } from '@/app/actions/leads'
import { TextLineSkeleton } from '@/components/ui/skeletons'
import { LABEL_MAP } from '@/lib/constants/lead-status'
import { INDUSTRY_OPTIONS, FREQUENCY_OPTIONS } from '@/lib/validation/rfq-schema'
import { AdminNotesEditor } from '@/components/admin/shared/AdminNotesEditor'
import { ProposalGeneratorPanel } from './ProposalGeneratorPanel'
import { StatusHistoryTable } from './StatusHistoryTable'
import { StatusPanel } from './StatusPanel'
import type { LeadStatus, RFQLead, LeadStatusHistory } from '@/types/api'

function industryLabel(value: string): string {
  return INDUSTRY_OPTIONS.find((o) => o.value === value)?.label ?? value
}

function frequencyLabel(value: string): string {
  return FREQUENCY_OPTIONS.find((o) => o.value === value)?.label ?? value
}

export function LeadDetailView({ leadId }: { leadId: string }) {
  const router = useRouter()
  const [lead, setLead] = useState<RFQLead | null>(null)
  const [history, setHistory] = useState<LeadStatusHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isError, setIsError] = useState(false)

  // silent=true dipakai untuk re-sync setelah mutation (status/notes) —
  // TIDAK toggle isLoading, supaya tidak flash skeleton di seluruh halaman
  // tiap kali AdminNotesEditor auto-save.
  const fetchDetail = useCallback(
    async (silent = false) => {
      if (!silent) {
        setIsLoading(true)
        setIsError(false)
        setNotFound(false)
      }
      try {
        const data = await getLeadDetail(leadId)
        setLead(data.lead)
        setHistory(data.history)
      } catch (err) {
        if (err instanceof ApiFetchError && err.status === 401) {
          router.push('/admin/login')
          return
        }
        if (silent) return // background refresh gagal — biarkan state lama, jangan ganggu UI
        if (err instanceof ApiFetchError && err.status === 404) {
          setNotFound(true)
        } else {
          setIsError(true)
        }
      } finally {
        if (!silent) setIsLoading(false)
      }
    },
    [leadId, router]
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDetail()
  }, [fetchDetail])

  async function handleStatusMutationSettled() {
    await fetchDetail(true) // history table + status badge butuh data terbaru
    try {
      await revalidateLeadRoutes(leadId)
    } catch {
      // Non-fatal — Kanban list masih akan up-to-date setelah navigasi ulang.
    }
  }

  async function handleNotesSaved() {
    try {
      await revalidateLeadRoutes(leadId)
    } catch {
      // Non-fatal.
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <TextLineSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center space-y-4">
        <p className="text-neutral-600">Lead tidak ditemukan.</p>
        <Link
          href="/admin/leads"
          className="inline-block h-9 px-4 rounded-md bg-brand-teal-600 text-white text-sm font-semibold hover:bg-brand-teal-500 transition-colors leading-9"
        >
          Kembali ke Pipeline
        </Link>
      </div>
    )
  }

  if (isError || !lead) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center space-y-4">
        <p className="text-neutral-600">Gagal memuat data lead.</p>
        <button
          type="button"
          onClick={() => fetchDetail()}
          className="h-9 px-4 rounded-md bg-brand-teal-600 text-white text-sm font-semibold hover:bg-brand-teal-500 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex items-center gap-1.5 text-xs text-neutral-400" role="list">
            <li>
              <Link href="/admin/leads" className="hover:text-neutral-600 hover:underline">
                Leads
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-neutral-600 font-medium">{lead.company_name}</li>
          </ol>
        </nav>
        <h1 className="text-xl font-bold text-ink-700">
          {lead.company_name} — {industryLabel(lead.industry_type)}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          <span className="inline-block px-2 py-0.5 rounded-full bg-brand-teal-50 text-brand-teal-600 font-medium mr-2">
            {LABEL_MAP[lead.status]}
          </span>
          Terakhir diupdate {formatDistanceToNow(new Date(lead.updated_at), { locale: idLocale, addSuffix: true })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-3">
          <h2 className="text-lg font-semibold text-ink-700">Informasi RFQ</h2>
          <dl className="space-y-2 text-sm">
            <InfoRow label="Nama" value={lead.full_name} />
            <InfoRow label="Perusahaan" value={lead.company_name} />
            <InfoRow label="Jabatan" value={lead.position ?? '-'} />
            <InfoRow label="Email" value={lead.email} />
            <InfoRow label="WhatsApp" value={lead.whatsapp} />
            <InfoRow label="Industri" value={industryLabel(lead.industry_type)} />
            <InfoRow label="Produk Diminati" value={lead.salt_types.join(', ')} />
            <InfoRow
              label="Volume"
              value={`${lead.volume_per_month} ton / ${frequencyLabel(lead.delivery_frequency)}`}
            />
            <InfoRow label="Kota Tujuan" value={lead.delivery_city} />
            <InfoRow label="Keterangan" value={lead.notes ?? '-'} />
          </dl>
        </div>

        <StatusPanel
          lead={lead}
          onStatusChanged={(newStatus: LeadStatus) => {
            setLead((prev) => (prev ? { ...prev, status: newStatus } : prev))
            handleStatusMutationSettled()
          }}
        />
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6">
        <AdminNotesEditor
          endpoint={`/rfq/leads/${lead.id}`}
          initialNotes={lead.admin_notes}
          onSaved={handleNotesSaved}
        />
      </div>

      <ProposalGeneratorPanel
        lead={lead}
        onLeadUpdated={(updated) => setLead(updated)}
      />

      <div className="bg-white border border-neutral-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-ink-700 mb-3">Histori Status</h2>
        <StatusHistoryTable history={history} />
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-neutral-500 shrink-0">{label}</dt>
      <dd className="text-neutral-800 text-right break-words">{value}</dd>
    </div>
  )
}
