import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Refresh session di setiap request (wajib untuk @supabase/ssr)
  const { supabaseResponse, user } = await updateSession(request)

  const isAdminPath = pathname.startsWith('/admin')
  const isLoginPath = pathname === '/admin/login'

  // RULE 1: /admin/* (bukan /admin/login) + tidak ada session → redirect ke login
  if (isAdminPath && !isLoginPath && !user) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirected', 'true')
    return NextResponse.redirect(loginUrl)
  }

  // RULE 2: /admin/login + session aktif → redirect ke dashboard
  //
  // CHECKPOINT 1 (2026-08-15) — pengecualian `denied`.
  // app/admin/layout.tsx menolak user yang PUNYA sesi valid tapi TIDAK
  // terdaftar di public.admin_users, lalu mengarahkannya ke
  // /admin/login?denied=1. Tanpa pengecualian ini, RULE 2 akan
  // memantulkannya kembali ke /admin/dashboard, layout menolak lagi,
  // dan seterusnya — INFINITE REDIRECT LOOP (persis kelas bug yang
  // diperingatkan CLAUDE.md soal isolasi route group (auth)/admin).
  // Dengan `denied=1`, halaman login boleh dirender meski ada sesi,
  // supaya user bisa membaca pesan penolakan dan keluar dari akunnya.
  const isDenied = request.nextUrl.searchParams.get('denied') === '1'
  if (isLoginPath && user && !isDenied) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/admin/:path*',
    // Exclude static files dan internal Next.js routes
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
