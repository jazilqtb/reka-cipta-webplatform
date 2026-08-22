'use client'

// components/admin/lead/LeadArchiveActions.tsx — CP1 ronde 4
//
// ═══ KENAPA "SEMBUNYIKAN", BUKAN "HAPUS" ═══
//
// Lead berhenti menjadi entitas berdiri sendiri sejak CP1 ronde 3. Satu
// lead sekarang menggantung pada rfqs -> rfq_items, ditambah tasks dan
// lead_status_history. `rfqs.legacy_lead_id` memakai ON DELETE SET NULL,
// jadi menghapus barisnya tidak meninggalkan foreign key menggantung —
// tapi meninggalkan baris `rfqs` yang MASIH HIDUP tanpa asal-usul, yang
// tetap terhitung di statistik dan tidak bisa dijelaskan dari mana asalnya.
//
// Karena itu perilaku baku adalah menyembunyikan: barisnya utuh, bisa
// dipulihkan, dan berhenti terhitung di mana pun.
//
// ═══ KENAPA HAPUS PERMANEN TETAP ADA, TAPI SULIT DIJANGKAU ═══
//
// Data uji seperti `wergew` memang pantas benar-benar hilang. Tapi
// urutannya dipaksa: sembunyikan dulu, baru bisa dihapus — dan penjaganya
// ada di FUNGSI DATABASE, bukan di komponen ini. Tombol bisa dilewati;
// fungsi database tidak.
//
// Konfirmasinya menuntut MENGETIK nama perusahaan. Dialog "Anda yakin?"
// dijawab "ya" secara refleks setelah pemakaian ketiga; mengetik nama
// menuntut pembacaan, dan pembacaan itulah konfirmasi yang sebenarnya.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArchiveIcon, ArrowCounterClockwiseIcon, TrashIcon, CircleNotchIcon } from '@phosphor-icons/react/ssr'
import { archiveLead, restoreLead, purgeLead, ApiFetchError } from '@/lib/api'
import type { RFQLead } from '@/types/api'

interface Props {
  lead: RFQLead
  /** Dipanggil setelah tindakan berhasil. Pemanggil yang memutuskan apakah
   *  perlu memuat ulang daftar atau berpindah halaman. */
  onChanged: (action: 'archived' | 'restored' | 'purged') => void
  /** `panel` = versi ringkas untuk panel samping; `page` = versi halaman
   *  penuh dengan penjelasan. Isinya sama; yang berbeda hanya ruangnya. */
  layout?: 'panel' | 'page'
}

function messageFor(err: unknown, fallback: string): string {
  if (err instanceof ApiFetchError) {
    if (err.status === 0) return 'Permintaan tidak sampai ke server. Isian Anda tidak berubah.'
    if (err.status === 409) return err.message
    if (err.status === 401) return 'Sesi Anda berakhir. Masuk lagi lalu ulangi.'
  }
  return fallback
}

export function LeadArchiveActions({ lead, onChanged, layout = 'page' }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<null | 'archive' | 'restore' | 'purge'>(null)
  const [confirmingPurge, setConfirmingPurge] = useState(false)
  const [typed, setTyped] = useState('')

  const isArchived = !!lead.archived_at
  const nameMatches = typed.trim().toLowerCase() === lead.company_name.trim().toLowerCase()

  async function handleArchive() {
    setBusy('archive')
    try {
      await archiveLead(lead.id)
      /* Pemulihan ditawarkan DI DALAM notifikasi keberhasilan, bukan hanya
         di halaman arsip. Penyesalan atas tindakan merusak hampir selalu
         datang dalam hitungan detik — jalan kembalinya harus ada di detik
         itu juga, bukan setelah menemukan halaman arsipnya dulu. */
      toast.success(`${lead.company_name} disembunyikan.`, {
        action: {
          label: 'Batalkan',
          onClick: async () => {
            try {
              await restoreLead(lead.id)
              toast.success('Dipulihkan.')
              onChanged('restored')
              router.refresh()
            } catch (err) {
              toast.error(messageFor(err, 'Gagal memulihkan.'))
            }
          },
        },
      })
      onChanged('archived')
      router.refresh()
    } catch (err) {
      toast.error(messageFor(err, 'Gagal menyembunyikan lead.'))
    } finally {
      setBusy(null)
    }
  }

  async function handleRestore() {
    setBusy('restore')
    try {
      await restoreLead(lead.id)
      toast.success(`${lead.company_name} dikembalikan ke daftar aktif.`)
      onChanged('restored')
      router.refresh()
    } catch (err) {
      toast.error(messageFor(err, 'Gagal memulihkan lead.'))
    } finally {
      setBusy(null)
    }
  }

  async function handlePurge() {
    setBusy('purge')
    try {
      await purgeLead(lead.id)
      toast.success(`${lead.company_name} dihapus permanen.`)
      onChanged('purged')
    } catch (err) {
      toast.error(messageFor(err, 'Gagal menghapus permanen.'))
    } finally {
      setBusy(null)
      setConfirmingPurge(false)
      setTyped('')
    }
  }

  const compact = layout === 'panel'

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {!isArchived ? (
        <>
          <button
            type="button"
            onClick={handleArchive}
            disabled={busy !== null}
            /* Aksi merusak BUKAN aksi menyimpan (§4.7 aturan 5): sekunder,
               bergaris, tidak pernah berbentuk tombol primary. */
            className="font-ui inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-ink-900/15 bg-white px-3 text-sm font-medium text-steel-700 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === 'archive' ? (
              <CircleNotchIcon size={16} weight="bold" className="animate-spin" aria-hidden="true" />
            ) : (
              <ArchiveIcon size={16} weight="regular" aria-hidden="true" />
            )}
            Sembunyikan lead
          </button>
          {!compact && (
            <p className="text-xs text-neutral-500">
              Lead hilang dari daftar dan berhenti terhitung di statistik. Datanya tetap utuh
              dan bisa dikembalikan kapan saja dari filter <strong>Arsip</strong>.
            </p>
          )}
        </>
      ) : (
        <>
          <div className="rounded-md border border-warning-200 bg-warning-50 p-3">
            <p className="text-sm font-medium text-warning-700">Lead ini disembunyikan</p>
            <p className="mt-0.5 text-xs text-steel-700">
              Ia tidak muncul di daftar aktif dan tidak dihitung di statistik mana pun.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRestore}
            disabled={busy !== null}
            className="font-ui inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-ink-900/15 bg-white px-3 text-sm font-medium text-steel-700 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === 'restore' ? (
              <CircleNotchIcon size={16} weight="bold" className="animate-spin" aria-hidden="true" />
            ) : (
              <ArrowCounterClockwiseIcon size={16} weight="regular" aria-hidden="true" />
            )}
            Kembalikan ke daftar aktif
          </button>

          {/* Hapus permanen — sengaja paling bawah, paling kecil, dan
              menuntut satu langkah tambahan sebelum tombolnya bahkan
              tampil. */}
          {!confirmingPurge ? (
            <button
              type="button"
              onClick={() => setConfirmingPurge(true)}
              className="text-xs text-danger-700 underline underline-offset-2 hover:text-danger-600 focus-visible:outline-none focus-visible:shadow-focus"
            >
              Hapus permanen…
            </button>
          ) : (
            <div className="space-y-2 rounded-md border border-danger-200 bg-danger-50 p-3">
              <p className="text-sm font-medium text-danger-700">
                Hapus permanen — tidak bisa dibatalkan
              </p>
              <p className="text-xs text-steel-700">
                Ini menghapus lead beserta RFQ, rincian volume, tugas, dan histori statusnya.
                Perusahaan dan kontaknya <strong>tidak</strong> ikut terhapus — keduanya bisa
                dipakai RFQ lain.
              </p>
              <label className="block text-xs text-steel-700" htmlFor={`purge-confirm-${lead.id}`}>
                Ketik <strong className="mono-tech">{lead.company_name}</strong> untuk memastikan:
              </label>
              <input
                id={`purge-confirm-${lead.id}`}
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                className="h-9 w-full rounded-md border border-ink-900/15 bg-white px-2.5 text-sm text-steel-700 focus-visible:shadow-focus focus-visible:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePurge}
                  disabled={!nameMatches || busy !== null}
                  className="font-ui inline-flex h-9 items-center gap-1.5 rounded-md bg-danger-700 px-3 text-sm font-medium text-white transition-colors hover:bg-danger-600 focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy === 'purge' ? (
                    <CircleNotchIcon size={16} weight="bold" className="animate-spin" aria-hidden="true" />
                  ) : (
                    <TrashIcon size={16} weight="regular" aria-hidden="true" />
                  )}
                  Hapus permanen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingPurge(false)
                    setTyped('')
                  }}
                  className="font-ui inline-flex h-9 items-center rounded-md border border-ink-900/15 bg-white px-3 text-sm font-medium text-steel-700 transition-colors hover:bg-neutral-50 focus-visible:shadow-focus focus-visible:outline-none"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
