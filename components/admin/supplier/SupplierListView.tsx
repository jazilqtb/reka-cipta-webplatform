'use client'

// components/admin/supplier/SupplierListView.tsx
// Epic 5 Admin (E5-ADM-FE-06) — fetch-on-mount (pattern LeadsKanbanBoard —
// apiFetch(auth:true) butuh browser Supabase client, tidak bisa dipanggil
// dari Server Component, lihat komentar lib/api.ts). Filter status+search
// dibaca dari URL (R-58), refetch setiap URL berubah.

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { listSuppliers, ApiFetchError } from '@/lib/api'
import { TextLineSkeleton } from '@/components/ui/skeletons'
import { FilterPanel } from './FilterPanel'
import { SupplierTable } from './SupplierTable'
import type { Supplier, SupplierStatus } from '@/types/api'
import { AdminState } from '@/components/admin/ui/AdminState'

const VALID_STATUSES: SupplierStatus[] = ['new', 'verified', 'active', 'inactive']

export function SupplierListView() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // R-58: validate status dari URL — defense in depth kalau ada
  // ?status=hacked di URL, default ke undefined (semua status).
  const filters = useMemo(() => {
    const rawStatus = searchParams.get('status')
    const status = rawStatus && VALID_STATUSES.includes(rawStatus as SupplierStatus)
      ? (rawStatus as SupplierStatus)
      : undefined
    return { status, search: searchParams.get('search') ?? undefined }
  }, [searchParams])

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  async function fetchSuppliers() {
    setIsLoading(true)
    setIsError(false)
    try {
      const data = await listSuppliers(filters)
      setSuppliers(data.suppliers)
      setTotal(data.total)
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 401) {
        router.push('/admin/login')
        return
      }
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSuppliers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.search])

  return (
    <div className="space-y-4">
      <FilterPanel />

      {isLoading ? (
        <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <TextLineSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-8 text-center">
          <AdminState tone="error" title="Gagal memuat data supplier" description="Periksa koneksi lalu coba lagi." />
          <button
            type="button"
            onClick={fetchSuppliers}
            className="h-9 rounded-md bg-brand-teal-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-teal-500"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          <SupplierTable suppliers={suppliers} />
          <p className="text-sm text-neutral-500">Total: {total} supplier</p>
        </>
      )}
    </div>
  )
}
