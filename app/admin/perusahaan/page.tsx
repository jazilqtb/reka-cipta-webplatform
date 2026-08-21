// app/admin/perusahaan/page.tsx — CP1 ronde 3
// Daftar perusahaan + tinjauan duplikat + riwayat penggabungan.

import Link from 'next/link'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { AdminPageHeader, AdminCard } from '@/components/admin/ui/AdminPrimitives'
import { AdminState } from '@/components/admin/ui/AdminState'
import { DuplicateReview, type CandidateRow } from '@/components/admin/company/DuplicateReview'
import { MergeHistory } from '@/components/admin/company/MergeHistory'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Perusahaan' }

export default async function AdminCompaniesPage() {
  const supabase = await createClient()

  /* Satu query untuk perusahaan + jumlah RFQ-nya. Alternatifnya mengambil
     daftar perusahaan lalu menghitung RFQ satu per satu — N+1 yang persis
     jadi kandidat penyebab lambat di CP6. */
  const [{ data: companies }, { data: cands }, { data: merges }] = await Promise.all([
    supabase
      .from('companies')
      .select('id, name, email_domain, city, industry_type, created_at, rfqs(id)')
      .is('merged_into_id', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('company_merge_candidates')
      .select('id, score, reason, company_a_id, company_b_id')
      .eq('status', 'pending')
      .order('score', { ascending: false }),
    supabase
      .from('company_merges')
      .select('id, created_at, surviving_id, merged_id, snapshot')
      .is('undone_at', null)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const list = (companies ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    emailDomain: c.email_domain as string | null,
    city: c.city as string | null,
    industry: c.industry_type as string | null,
    createdAt: c.created_at as string,
    rfqCount: Array.isArray(c.rfqs) ? c.rfqs.length : 0,
  }))
  const byId = new Map(list.map((c) => [c.id, c]))

  const candidates: CandidateRow[] = (cands ?? [])
    .map((c) => {
      const a = byId.get(c.company_a_id as string)
      const b = byId.get(c.company_b_id as string)
      if (!a || !b) return null
      return {
        id: c.id as string,
        score: Number(c.score),
        reason: c.reason as string,
        a: { id: a.id, name: a.name, rfqCount: a.rfqCount, createdAt: a.createdAt },
        b: { id: b.id, name: b.name, rfqCount: b.rfqCount, createdAt: b.createdAt },
      }
    })
    .filter((x): x is CandidateRow => x !== null)

  const history = (merges ?? []).map((m) => ({
    id: m.id as string,
    createdAt: m.created_at as string,
    survivingName: byId.get(m.surviving_id as string)?.name ?? '(tidak ditemukan)',
    mergedName:
      ((m.snapshot as { merged_company?: { name?: string } })?.merged_company?.name) ??
      '(tidak diketahui)',
  }))

  return (
    <>
      <AdminHeader title="Perusahaan" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="page-transition mx-auto max-w-5xl space-y-5">
          <AdminPageHeader
            title="Perusahaan"
            description="Satu perusahaan menampung seluruh RFQ dan kontaknya — termasuk permintaan berulang dari pelanggan yang sama."
          />

          <DuplicateReview candidates={candidates} />

          <AdminCard className="p-0">
            <h2 className="font-ui border-b border-ink-900/[0.06] px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-400">
              Semua perusahaan · {list.length}
            </h2>
            {list.length === 0 ? (
              <AdminState
                title="Belum ada perusahaan"
                description="Perusahaan dibuat otomatis saat RFQ pertama masuk."
              />
            ) : (
              <ul role="list" className="divide-y divide-ink-900/[0.06]">
                {list.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/admin/leads?company=${c.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="font-ui block truncate text-sm font-medium text-ink-700">{c.name}</span>
                        <span className="mono-tech block truncate text-xs text-neutral-500">
                          {[c.industry, c.city, c.emailDomain].filter(Boolean).join(' · ') || '—'}
                        </span>
                      </span>
                      <span className="mono-tech shrink-0 text-xs text-neutral-500">
                        {c.rfqCount} RFQ
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <MergeHistory items={history} />
        </div>
      </main>
    </>
  )
}
