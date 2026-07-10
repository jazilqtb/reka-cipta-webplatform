// app/admin/proposal-settings/page.tsx — Pengaturan Prompt & Layout Proposal
// Epic 4B Slice 3A/3C (E4B-S3A-FE-01)
//
// Server Component tipis: auth check sudah di-handle app/admin/layout.tsx.
// Data fetching + form ada di PromptEditor ('use client') — sama pola
// dengan SettingsForm (Epic 2 Slice 3) / LeadsKanbanBoard (Epic 4B Slice 1).
//
// NOTE: implemented ahead of Slice 3 trigger criteria (task breakdown
// "Trigger Criteria" section) per instruksi eksplisit supaya kode siap
// begitu Anthropic API key tersedia. Route ini reachable dari sidebar
// tapi belum pernah divalidasi end-to-end dengan API key asli.

import { AdminHeader } from '@/components/layout/AdminHeader'
import { PromptEditor } from '@/components/admin/settings/PromptEditor'

export const metadata = {
  title: 'Pengaturan Proposal — Admin RCI',
}

export default function AdminProposalSettingsPage() {
  return (
    <>
      <AdminHeader title="Pengaturan Proposal" breadcrumb="Pengaturan Proposal" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6 page-transition">
          <p className="text-sm text-neutral-600">
            Kelola instruksi AI (prompt) dan tampilan PDF untuk fitur Generate Proposal di halaman
            detail lead.
          </p>

          <PromptEditor />
        </div>
      </main>
    </>
  )
}
