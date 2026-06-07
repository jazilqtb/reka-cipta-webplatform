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
  if (isLoginPath && user) {
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
