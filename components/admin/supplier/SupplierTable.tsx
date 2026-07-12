// components/admin/supplier/SupplierTable.tsx
// Epic 5 Admin (E5-ADM-FE-04, R-57) — tabel supplier, BUKAN Kanban (master
// data, bukan pipeline flow — lihat R-57 di guide). Nama component eksplisit
// `SupplierTable`/`SupplierRow`, tidak generic `SupplierList`.

import Link from 'next/link'
import { Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { StatusBadge } from './StatusBadge'
import { SaltTypesCell } from './SaltTypesCell'
import type { Supplier } from '@/types/api'

export function SupplierTable({ suppliers }: { suppliers: Supplier[] }) {
  if (suppliers.length === 0) {
    return (
      <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-12 text-center">
        <p className="text-neutral-500">Tidak ada supplier sesuai filter</p>
        <Link href="/admin/suppliers" className="text-sm font-medium text-brand-teal-600 hover:underline">
          Reset filter
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50">
          <tr>
            <Th>Nama Usaha</Th>
            <Th>Lokasi</Th>
            <Th>Jenis Garam</Th>
            <Th>Kapasitas</Th>
            <Th>Status</Th>
            <Th>Daftar</Th>
            <Th className="text-right">Aksi</Th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <SupplierRow key={s.id} supplier={s} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SupplierRow({ supplier }: { supplier: Supplier }) {
  const capacityFmt = new Intl.NumberFormat('id-ID').format(supplier.capacity_per_month)

  return (
    <tr className="border-b border-neutral-100 transition-colors last:border-b-0 hover:bg-neutral-50">
      <Td>
        <Link
          href={`/admin/suppliers/${supplier.id}`}
          className="font-medium text-ink-700 hover:text-brand-teal-600"
        >
          {supplier.business_name}
        </Link>
      </Td>
      <Td>
        {supplier.location_city}, {supplier.location_province}
      </Td>
      <Td>
        <SaltTypesCell types={supplier.salt_types_available} />
      </Td>
      <Td>
        {capacityFmt} {supplier.capacity_unit}
      </Td>
      <Td>
        <StatusBadge status={supplier.status} />
      </Td>
      <Td className="text-xs text-neutral-500">
        {formatDistanceToNow(new Date(supplier.created_at), { locale: idLocale, addSuffix: true })}
      </Td>
      <Td className="text-right">
        <Link
          href={`/admin/suppliers/${supplier.id}`}
          aria-label={`Lihat detail ${supplier.business_name}`}
          className="inline-flex rounded p-2 hover:bg-neutral-100"
        >
          <Eye className="h-4 w-4 text-neutral-500" />
        </Link>
      </Td>
    </tr>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left font-semibold text-neutral-700 ${className ?? ''}`}>{children}</th>
  )
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className ?? ''}`}>{children}</td>
}
