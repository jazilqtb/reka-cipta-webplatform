'use client'

// components/admin/settings/EmailTemplatesTabs.tsx
// Epic 4B Slice 3B (E4B-S3B-FE-01) — Tab switcher Email / WhatsApp untuk
// /admin/email-templates. Simple local state (bukan Base UI Tabs — belum
// ada component ini di components/ui/, dan cuma 2 tab jadi tidak worth
// nambah dependency baru).

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { EmailTemplateEditor } from './EmailTemplateEditor'
import { WATemplateEditor } from './WATemplateEditor'

type Tab = 'email' | 'whatsapp'

export function EmailTemplatesTabs() {
  const [tab, setTab] = useState<Tab>('email')

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-1">
        <TabButton active={tab === 'email'} onClick={() => setTab('email')}>
          Email
        </TabButton>
        <TabButton active={tab === 'whatsapp'} onClick={() => setTab('whatsapp')}>
          WhatsApp
        </TabButton>
      </div>

      {tab === 'email' ? <EmailTemplateEditor /> : <WATemplateEditor />}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-9 px-4 rounded-md text-sm font-medium transition-colors',
        active ? 'bg-brand-teal-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'
      )}
    >
      {children}
    </button>
  )
}
