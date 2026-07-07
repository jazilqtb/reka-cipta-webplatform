'use client'

// components/admin/lead/AdminNotesEditor.tsx
// Epic 4B Slice 1 (E4B-S1-FE-10, R-24) — auto-save catatan admin on-blur,
// debounce 500ms, race-safe via 3 refs (timeout/lastSaved/pendingValue).
//
// JANGAN pakai useEffect([notes]) untuk trigger save — closure stale.
// Save function selalu baca pendingValueRef.current, bukan state `notes`.

import { useRef, useState } from 'react'
import { updateLead, ApiFetchError } from '@/lib/api'
import { toast } from 'sonner'

interface Props {
  leadId: string
  initialNotes: string | null
  onSaved?: () => void
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function AdminNotesEditor({ leadId, initialNotes, onSaved }: Props) {
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef(initialNotes ?? '')
  const pendingValueRef = useRef(initialNotes ?? '')

  async function save() {
    if (pendingValueRef.current === lastSavedRef.current) return

    setSaveStatus('saving')
    try {
      await updateLead(leadId, { admin_notes: pendingValueRef.current })
      lastSavedRef.current = pendingValueRef.current
      setSaveStatus('saved')
      onSaved?.()

      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
      idleTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      setSaveStatus('error')
      if (err instanceof ApiFetchError && err.status === 401) return
      toast.error('Gagal menyimpan catatan')
    }
  }

  function handleBlur() {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    pendingValueRef.current = notes
    saveTimeoutRef.current = setTimeout(save, 500)
  }

  return (
    <div>
      <label htmlFor="admin-notes" className="block mb-2 text-sm font-medium text-ink-700">
        Catatan Admin
      </label>
      <textarea
        id="admin-notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleBlur}
        rows={4}
        maxLength={2000}
        className="w-full rounded-md border border-neutral-300 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600"
        placeholder="Catatan internal — tidak terlihat oleh customer..."
      />
      <p className="mt-1 text-xs text-neutral-500" role="status">
        {saveStatus === 'saving' && 'Menyimpan...'}
        {saveStatus === 'saved' && '✓ Tersimpan'}
        {saveStatus === 'error' && '⚠ Gagal menyimpan'}
        {saveStatus === 'idle' && ' '}
      </p>
    </div>
  )
}
