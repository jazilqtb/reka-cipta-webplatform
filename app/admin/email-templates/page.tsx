// app/admin/email-templates/page.tsx — Template Pesan (Email + WhatsApp)
// Epic 4B Slice 3B (E4B-S3B-FE-01)
//
// Server Component tipis, sama pola dengan app/admin/proposal-settings.

import { AdminHeader } from '@/components/layout/AdminHeader'
import { EmailTemplatesTabs } from '@/components/admin/settings/EmailTemplatesTabs'

export const metadata = {
  title: 'Template Pesan',
}

export default function AdminEmailTemplatesPage() {
  return (
    <>
      <AdminHeader title="Template Pesan" />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="page-transition mx-auto max-w-4xl space-y-4">
          {/* DIPERTAHANKAN: menjelaskan bahwa template WhatsApp berbeda PER
              STATUS lead — hubungan yang tidak terbaca dari tab manapun. */}
          <p className="text-sm text-neutral-600">
            Isi email konfirmasi RFQ dan template pesan WhatsApp, yang berbeda untuk
            tiap status lead.
          </p>

          <EmailTemplatesTabs />
        </div>
      </main>
    </>
  )
}
