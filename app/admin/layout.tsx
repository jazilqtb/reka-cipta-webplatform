import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/layout/AdminSidebar'

export const metadata = {
  title: {
    default: 'Admin — CV Reka Cipta Indonesia',
    template: '%s — Admin Reka Cipta',
  },
  robots: 'noindex, nofollow',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Double guard — middleware sudah handle ini, ini safety net
  if (!user) {
    redirect('/admin/login')
  }

  return (
    <div className="flex min-h-dvh bg-neutral-50">
      <AdminSidebar userEmail={user.email ?? ''} />
      <div className="flex-1 flex flex-col lg:ml-[240px]">
        {children}
      </div>
    </div>
  )
}
