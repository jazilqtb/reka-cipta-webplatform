'use client'

// components/admin/settings/HistoryPanel.tsx
// Epic 4B Slice 3A (E4B-S3A-FE-01) — Riwayat 10 versi terakhir
// proposal_settings + rollback (R-41). Snapshot dibuat otomatis oleh DB
// trigger setiap kali PromptEditor/LayoutCustomizer save (lihat migration
// 20260711100000_create_proposal_settings.sql).

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getProposalSettingsHistory, rollbackProposalSettings, ApiFetchError } from '@/lib/api'
import type { ProposalSettings, ProposalSettingsHistoryEntry } from '@/types/api'

interface Props {
  onRestored: (settings: ProposalSettings) => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function snapshotPreview(entry: ProposalSettingsHistoryEntry): string {
  const role = typeof entry.snapshot.prompt_role === 'string' ? entry.snapshot.prompt_role : ''
  return role.length > 80 ? `${role.slice(0, 80)}…` : role || '(role kosong)'
}

export function HistoryPanel({ onRestored }: Props) {
  const [entries, setEntries] = useState<ProposalSettingsHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [rollingBackId, setRollingBackId] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const data = await getProposalSettingsHistory()
        if (!cancelled) setEntries(data)
      } catch {
        // Riwayat gagal dimuat bukan fatal — prompt editor tetap fungsional
        // tanpa panel ini, jadi cukup silent-empty di sini.
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleRollback(id: number) {
    if (!window.confirm('Rollback ke versi ini? Versi saat ini akan tersimpan sebagai riwayat baru.')) {
      return
    }
    setRollingBackId(id)
    try {
      const restored = await rollbackProposalSettings(id)
      onRestored(restored)
      toast.success('Berhasil rollback ke versi terpilih.')
    } catch (err) {
      const msg = err instanceof ApiFetchError ? err.message : 'Gagal rollback.'
      toast.error(msg)
    } finally {
      setRollingBackId(null)
    }
  }

  if (isLoading) return null
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h3 className="text-sm font-semibold text-ink-700">Riwayat Perubahan</h3>
        <p className="mt-1 text-xs text-neutral-500">Belum ada riwayat — riwayat muncul setelah perubahan pertama disimpan.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <h3 className="text-sm font-semibold text-ink-700">Riwayat Perubahan</h3>
          <p className="mt-0.5 text-xs text-neutral-500">{entries.length} versi tersimpan — klik untuk lihat & rollback.</p>
        </div>
        <span className="text-xs text-neutral-400">{expanded ? 'Tutup' : 'Buka'}</span>
      </button>

      {expanded && (
        <ul className="mt-4 space-y-2" role="list">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3"
            >
              <div className="min-w-0">
                <p className="text-xs text-neutral-500">{formatDate(entry.created_at)}</p>
                <p className="text-sm text-neutral-700 truncate">{snapshotPreview(entry)}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRollback(entry.id)}
                disabled={rollingBackId !== null}
                className="shrink-0 h-8 px-3 rounded-md border border-neutral-300 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rollingBackId === entry.id ? 'Memproses...' : 'Rollback'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
