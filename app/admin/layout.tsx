import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
    <html lang="id">
      <body className="antialiased bg-neutral-50">
        {/* Admin shell — Sidebar + Header akan ditambah di Fase 8 */}
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
