import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/layout/AdminShell'

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

  // CHECKPOINT 1 (2026-08-15) — GERBANG OTORISASI.
  //
  // Sebelum ini, "punya sesi Supabase" = "admin". Signup publik di
  // project ini AKTIF (terverifikasi via GET /auth/v1/settings ->
  // disable_signup=false), jadi siapa pun bisa mendaftar lalu masuk
  // /admin/*. Cek keanggotaan allowlist ditaruh DI SINI (bukan di
  // middleware) karena:
  //   - middleware jalan di SETIAP request termasuk aset; query DB di
  //     sana menambah latensi ke seluruh situs, bukan cuma /admin.
  //   - layout ini membungkus SEMUA halaman /admin/*, jadi cakupannya
  //     sama persis tanpa biaya di rute publik.
  // Ini lapisan RENDER. Lapisan DATA dijaga terpisah oleh RLS
  // (public.is_admin()) dan backend require_admin — jadi melewati
  // gerbang ini pun tidak memberi akses data.
  const { data: adminRow, error: adminErr } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  // Fail CLOSED: query gagal != boleh masuk.
  if (adminErr || !adminRow) {
    redirect('/admin/login?denied=1')
  }

  // CP1 — lebar sidebar dibaca dari cookie DI SERVER supaya render pertama
  // sudah benar. Kalau state ini hanya hidup di localStorage, sidebar akan
  // berkedip dari lebar ke sempit di setiap muat halaman.
  const cookieStore = await cookies()
  const initialCollapsed = cookieStore.get('admin_sidebar')?.value === 'collapsed'

  return (
    <AdminShell userEmail={user.email ?? ''} initialCollapsed={initialCollapsed}>
      {children}
    </AdminShell>
  )
}
