// lib/env.ts
// Type-safe environment variable access
// Throws at startup if required vars are missing
//
// ⚠️ PENTING: Next.js (Webpack/Turbopack) HANYA bisa meng-inline 
// environment variables ke browser bundle jika diakses secara STATIS.
// Akses dinamis (process.env[key]) akan menghasilkan undefined di browser!

// ─── Public Env (Aman untuk Client Components) ─────────────
// Akses statis wajib agar nilai di-inline ke browser bundle.
export const publicEnv = {
  supabaseUrl: (() => {
    const value = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!value) throw new Error(`Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL\nCheck .env.local.example for all required variables.`)
    return value
  })(),
  
  supabaseAnonKey: (() => {
    const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!value) throw new Error(`Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY\nCheck .env.local.example for all required variables.`)
    return value
  })(),
  
  apiUrl: (() => {
    const value = process.env.NEXT_PUBLIC_API_URL
    if (!value) throw new Error(`Missing required environment variable: NEXT_PUBLIC_API_URL\nCheck .env.local.example for all required variables.`)
    return value
  })(),
  
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? '',
} as const

// ─── Server Env (HANYA untuk Server Components / Route Handlers) ─
// JANGAN import serverEnv di file yang ada 'use client'-nya!
export const serverEnv = {
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ?? '',
  revalidationSecret: process.env.REVALIDATION_SECRET ?? '',
} as const
