// lib/data/tasks.ts — CP4 ronde 3

import { createClient } from '@/lib/supabase/server'

export type TaskParentKind = 'company' | 'contact' | 'rfq' | 'supplier' | 'shipment'

export interface TaskRow {
  id: string
  title: string
  notes: string | null
  dueOn: string | null
  status: 'open' | 'done' | 'cancelled'
  parentKind: TaskParentKind | null
  parentId: string | null
  parentLabel: string
  /** < 0 terlewat · 0 hari ini · > 0 akan datang · null tanpa tenggat */
  daysUntilDue: number | null
}

export const PARENT_COLUMN: Record<TaskParentKind, string> = {
  company: 'company_id',
  contact: 'contact_id',
  rfq: 'rfq_id',
  supplier: 'supplier_id',
  shipment: 'shipment_id',
}

/** Selisih hari dihitung dari TANGGAL, bukan dari selisih milidetik.
 *
 *  Kalau dihitung dari milidetik, tugas yang jatuh tempo hari ini pukul
 *  00:00 akan terbaca "terlewat 1 hari" pada pukul 09:00 — dan daftar
 *  "terlewat" yang salah membuat orang berhenti mempercayainya. */
export function daysUntil(dueOn: string | null): number | null {
  if (!dueOn) return null
  const today = new Date()
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const [y, m, d] = dueOn.split('-').map(Number)
  return Math.round((Date.UTC(y, m - 1, d) - t) / 86400000)
}

function labelOf(r: Record<string, unknown>): { kind: TaskParentKind | null; id: string | null; label: string } {
  const pick = (v: unknown) => (v as { name?: string; business_name?: string; full_name?: string } | null)
  if (r.company_id)  return { kind: 'company',  id: r.company_id as string,  label: pick(r.companies)?.name ?? 'Perusahaan' }
  if (r.contact_id)  return { kind: 'contact',  id: r.contact_id as string,  label: pick(r.contacts)?.full_name ?? 'Kontak' }
  if (r.rfq_id)      return { kind: 'rfq',      id: r.rfq_id as string,      label: 'RFQ' }
  if (r.supplier_id) return { kind: 'supplier', id: r.supplier_id as string, label: pick(r.supplier_registrations)?.business_name ?? 'Supplier' }
  if (r.shipment_id) return { kind: 'shipment', id: r.shipment_id as string, label: 'Pengiriman' }
  return { kind: null, id: null, label: '—' }
}

const SELECT =
  'id, title, notes, due_on, status, company_id, contact_id, rfq_id, supplier_id, shipment_id,' +
  ' companies(name), contacts(full_name), supplier_registrations(business_name)'

function toRow(r: Record<string, unknown>): TaskRow {
  const p = labelOf(r)
  return {
    id: r.id as string,
    title: r.title as string,
    notes: (r.notes as string | null) ?? null,
    dueOn: (r.due_on as string | null) ?? null,
    status: r.status as TaskRow['status'],
    parentKind: p.kind,
    parentId: p.id,
    parentLabel: p.label,
    daysUntilDue: daysUntil((r.due_on as string | null) ?? null),
  }
}

/** Tugas terbuka, diurutkan paling mendesak lebih dulu. Yang tanpa tenggat
 *  ditaruh paling belakang — bukan dibuang: ia tetap pekerjaan, hanya tidak
 *  bersaing dengan yang punya tanggal. */
export async function getOpenTasks(limit = 100): Promise<TaskRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select(SELECT)
    .eq('status', 'open')
    .order('due_on', { ascending: true, nullsFirst: false })
    .limit(limit)
  if (error || !data) return []
  return (data as unknown as Record<string, unknown>[]).map(toRow)
}

export async function getTasksFor(kind: TaskParentKind, id: string): Promise<TaskRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select(SELECT)
    .eq(PARENT_COLUMN[kind], id)
    .order('status', { ascending: true })
    .order('due_on', { ascending: true, nullsFirst: false })
  if (error || !data) return []
  return (data as unknown as Record<string, unknown>[]).map(toRow)
}

export interface TaskBuckets {
  overdue: TaskRow[]
  today: TaskRow[]
  upcoming: TaskRow[]
  undated: TaskRow[]
}

export function bucketTasks(tasks: TaskRow[]): TaskBuckets {
  const b: TaskBuckets = { overdue: [], today: [], upcoming: [], undated: [] }
  for (const t of tasks) {
    if (t.daysUntilDue === null) b.undated.push(t)
    else if (t.daysUntilDue < 0) b.overdue.push(t)
    else if (t.daysUntilDue === 0) b.today.push(t)
    else b.upcoming.push(t)
  }
  return b
}
