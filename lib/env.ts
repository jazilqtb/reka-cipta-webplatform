// Type-safe environment variable access
// Throws at startup if required vars are missing

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Check .env.local.example for all required variables.`
    )
  }
  return value
}

function optionalEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback
}

// Public (safe to expose to browser)
export const publicEnv = {
  supabaseUrl: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  apiUrl: requireEnv('NEXT_PUBLIC_API_URL'),
  sentryDsn: optionalEnv('NEXT_PUBLIC_SENTRY_DSN'),
} as const

// Server-only (never expose to browser — no NEXT_PUBLIC_ prefix)
export const serverEnv = {
  supabaseServiceKey: optionalEnv('SUPABASE_SERVICE_KEY'),
  revalidationSecret: optionalEnv('REVALIDATION_SECRET'),
} as const
