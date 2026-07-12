// components/admin/supplier/SupplierInfoCard.tsx
// Epic 5 Admin (E5-ADM-FE-08) — kartu detail informasi supplier (read-only),
// dipakai di SupplierDetailView.

import { SUPPLIER_SALT_TYPE_LABELS, CAPACITY_UNIT_LABELS } from '@/lib/constants/supplier-salt-types'
import type { Supplier } from '@/types/api'

function formatWhatsApp(raw: string): string {
  // +6281234567890 -> +62 812-3456-7890
  const match = raw.match(/^\+62(\d{3})(\d{4})(\d+)$/)
  if (!match) return raw
  return `+62 ${match[1]}-${match[2]}-${match[3]}`
}

export function SupplierInfoCard({ supplier }: { supplier: Supplier }) {
  const saltTypes = supplier.salt_types_available.map((t) => SUPPLIER_SALT_TYPE_LABELS[t] || t).join(', ')
  const capacityFmt = new Intl.NumberFormat('id-ID').format(supplier.capacity_per_month)
  const unitLabel = CAPACITY_UNIT_LABELS[supplier.capacity_unit] || supplier.capacity_unit

  return (
    <div className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6">
      <Section title="Informasi Usaha">
        <Field label="Nama Usaha" value={supplier.business_name} />
        <Field label="Lokasi" value={`${supplier.location_city}, ${supplier.location_province}`} />
      </Section>

      <Section title="Produk Garam">
        <Field label="Jenis Garam" value={saltTypes} />
        <Field label="Kapasitas" value={`${capacityFmt} ${unitLabel} / bulan`} />
      </Section>

      <Section title="Kontak">
        <Field label="WhatsApp" value={formatWhatsApp(supplier.whatsapp)} />
        <Field label="Email" value={supplier.email || '-'} />
        <Field label="Keterangan" value={supplier.additional_notes || '-'} multiline />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 border-b border-neutral-100 pb-2 font-semibold text-ink-700">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Field({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className={multiline ? 'space-y-1' : 'flex gap-2'}>
      <span className="min-w-[100px] text-sm text-neutral-500">{label}</span>
      <span className={`text-sm text-neutral-900 ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value}</span>
    </div>
  )
}
