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
      <AdminHeader title="Template Pesan" breadcrumb="Template Pesan" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6 page-transition">
          <p className="text-sm text-neutral-600">
            Kelola isi email konfirmasi RFQ dan template pesan WhatsApp per status lead.
          </p>

          <EmailTemplatesTabs />
        </div>
      </main>
    </>
  )
}
