// lib/constants/lead-status.ts
// Epic 4B Slice 1 (E4B-S1-FE-07) — 6 status pipeline Kanban, hardcoded.
// Mirror dari backend/schemas/rfq.py LEAD_STATUSES — jaga sinkron.

import type { LeadStatus } from '@/types/api'

export const LEAD_STATUSES: LeadStatus[] = [
  'new', 'contacted', 'sample_sent',
  'negotiation', 'deal', 'lost',
]

export const LABEL_MAP: Record<LeadStatus, string> = {
  new: 'Baru',
  contacted: 'Dihubungi',
  sample_sent: 'Sampel Dikirim',
  negotiation: 'Negosiasi',
  deal: 'Deal',
  lost: 'Tidak Jadi',
}

// Dipakai sebagai kelas Tailwind langsung (border per column accent).
// Hanya pakai token dari globals.css (FROZEN) — tidak ada amber/orange,
// jadi sample_sent pakai warning-600 dan negotiation pakai sand-600.
export const COLUMN_ACCENT_MAP: Record<LeadStatus, string> = {
  new: 'border-t-brand-teal-600',
  contacted: 'border-t-info-600',
  sample_sent: 'border-t-warning-600',
  negotiation: 'border-t-sand-600',
  deal: 'border-t-success-600',
  lost: 'border-t-neutral-400',
}
