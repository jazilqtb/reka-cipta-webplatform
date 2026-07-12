'use client'

// components/admin/supplier/SupplierDetailView.tsx
// Epic 5 Admin (E5-ADM-FE-09) — fetch-on-mount detail supplier (pattern
// LeadDetailView, client-side karena butuh apiFetch auth:true). R-56: TIDAK
// ada StatusHistoryTable section — supplier tidak punya status history.

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupplier, ApiFetchError } from '@/lib/api'
import { revalidateSupplierRoutes } from '@/app/actions/supplier'
import { TextLineSkeleton } from '@/components/ui/skeletons'
import { AdminNotesEditor } from '@/components/admin/shared/AdminNotesEditor'
import { StatusBadge } from './StatusBadge'
import { SupplierInfoCard } from './SupplierInfoCard'
import { SupplierStatusPanel } from './SupplierStatusPanel'
import { SupplierWATemplateButton } from './SupplierWATemplateButton'
import { MetadataCard } from './MetadataCard'
import type { Supplier, SupplierStatus } from '@/types/api'

export function SupplierDetailView({ supplierId }: { supplierId: string }) {
  const router = useRouter()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isError, setIsError] = useState(false)

  // silent=true dipakai setelah mutation (status/notes) — tidak toggle
  // isLoading supaya tidak flash skeleton seluruh halaman (pattern LeadDetailView).
  const fetchDetail = useCallback(
    async (silent = false) => {
      if (!silent) {
        setIsLoading(true)
        setIsError(false)
        setNotFound(false)
      }
      try {
        const data = await getSupplier(supplierId)
        setSupplier(data)
      } catch (err) {
        if (err instanceof ApiFetchError && err.status === 401) {
          router.push('/admin/login')
          return
        }
        if (silent) return
        if (err instanceof ApiFetchError && err.status === 404) {
          setNotFound(true)
        } else {
          setIsError(true)
        }
      } finally {
        if (!silent) setIsLoading(false)
      }
    },
    [supplierId, router]
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDetail()
  }, [fetchDetail])

  async function handleStatusChanged(newStatus: SupplierStatus) {
    setSupplier((prev) => (prev ? { ...prev, status: newStatus } : prev))
    try {
      await revalidateSupplierRoutes(supplierId)
    } catch {
      // Non-fatal — list masih akan up-to-date setelah navigasi ulang.
    }
  }

  async function handleNotesSaved() {
    try {
      await revalidateSupplierRoutes(supplierId)
    } catch {
      // Non-fatal.
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <TextLineSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <p className="text-neutral-600">Supplier tidak ditemukan.</p>
        <Link
          href="/admin/suppliers"
          className="inline-block h-9 rounded-md bg-brand-teal-600 px-4 text-sm font-semibold leading-9 text-white transition-colors hover:bg-brand-teal-500"
        >
          Kembali ke Daftar Supplier
        </Link>
      </div>
    )
  }

  if (isError || !supplier) {
    return (
      <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <p className="text-neutral-600">Gagal memuat data supplier.</p>
        <button
          type="button"
          onClick={() => fetchDetail()}
          className="h-9 rounded-md bg-brand-teal-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-teal-500"
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
              <Link href="/admin/suppliers" className="hover:text-neutral-600 hover:underline">
                Supplier
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-neutral-600">{supplier.business_name}</li>
          </ol>
        </nav>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-ink-700">{supplier.business_name}</h1>
          <StatusBadge status={supplier.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SupplierInfoCard supplier={supplier} />
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <AdminNotesEditor
              endpoint={`/supplier/${supplier.id}`}
              initialNotes={supplier.admin_notes}
              onSaved={handleNotesSaved}
            />
          </div>
        </div>

        <div className="space-y-6">
          <SupplierStatusPanel supplier={supplier} onStatusChanged={handleStatusChanged} />
          <SupplierWATemplateButton
            supplierId={supplier.id}
            currentStatus={supplier.status}
            whatsapp={supplier.whatsapp}
            businessName={supplier.business_name}
          />
          <MetadataCard createdAt={supplier.created_at} updatedAt={supplier.updated_at} />
        </div>
      </div>
    </div>
  )
}
