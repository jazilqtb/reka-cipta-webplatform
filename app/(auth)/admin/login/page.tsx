'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { EyeIcon, EyeSlashIcon, CircleNotchIcon, WarningCircleIcon, ShieldWarningIcon } from '@phosphor-icons/react/ssr'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/brand/Logo'

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password tidak boleh kosong'),
})

type LoginValues = z.infer<typeof loginSchema>

// CHECKPOINT 1 (2026-08-15) — throttle percobaan login.
//
// CATATAN JUJUR SOAL BATASNYA: ini kontrol sisi KLIEN, jadi bukan
// proteksi brute-force sungguhan — penyerang bisa memanggil endpoint
// Supabase langsung tanpa membuka halaman ini. Pertahanan nyata ada di
// rate limit bawaan Supabase Auth (per IP, sisi server). Yang ini
// berguna untuk: (a) menghentikan percobaan berulang dari operator yang
// salah ketik, (b) memberi sinyal jelas ke pengguna sah.
// Ambangnya sengaja longgar (5 percobaan / 60 detik) supaya pengujian
// otomatis yang sah tidak terlihat seperti serangan — sesuai permintaan.
const MAX_ATTEMPTS = 5
const COOLDOWN_SECONDS = 60

// Query param dibaca via useSyncExternalStore — pola yang SAMA dengan
// ContactForm.tsx & CategoryFilterTabs.tsx di repo ini. Alasannya sama:
// useSearchParams() memaksa Next.js bailout ke client-side-only rendering
// dan menghapus halaman dari HTML statis. Versi pertama patch ini pakai
// useEffect + setState, yang ditolak React Compiler
// (react-hooks/set-state-in-effect) — pola ini lolos lint sekaligus benar.
function subscribeToUrl(cb: () => void) {
  window.addEventListener('popstate', cb)
  return () => window.removeEventListener('popstate', cb)
}
function getDenied(): boolean {
  return new URLSearchParams(window.location.search).get('denied') === '1'
}
function getServerDenied(): boolean {
  return false
}

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  // useState, BUKAN useRef: React Compiler melarang membaca ref selama
  // render, dan handleSubmit(onSubmit) dipanggil saat render.
  const [attempts, setAttempts] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  // Ditolak oleh app/admin/layout.tsx: sesi valid tapi bukan admin.
  const denied = useSyncExternalStore(subscribeToUrl, getDenied, getServerDenied)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const onSubmit = async (data: LoginValues) => {
    if (cooldown > 0) return
    setAuthError(null)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      const next = attempts + 1
      if (next >= MAX_ATTEMPTS) {
        setAttempts(0)
        setCooldown(COOLDOWN_SECONDS)
        setAuthError(`Terlalu banyak percobaan. Coba lagi dalam ${COOLDOWN_SECONDS} detik.`)
        return
      }
      setAttempts(next)
      // Selalu pesan generik — tidak membedakan email vs password salah
      setAuthError('Kredensial tidak valid. Silakan coba lagi.')
      return
    }

    setAttempts(0)
    router.push('/admin/dashboard')
    router.refresh()
  }

  async function handleSignOut() {
    await createClient().auth.signOut()
    window.location.href = '/admin/login'
  }

  return (
    <div className="relative min-h-dvh bg-ink-900 flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* Decorative blob */}
      <div
        className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-teal-600/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="bg-dot-grid absolute inset-0 opacity-50 pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-white rounded-md shadow-lg p-8 space-y-6">
        {/* Header */}
        {/* Logo resmi, bukan monogram "RC", dan nama lengkap perusahaan.
            Halaman ini satu-satunya sisa yang masih menulis "Reka Cipta"
            saja setelah sidebar dibetulkan di ronde sebelumnya — dan ini
            justru layar pertama yang dilihat siapa pun yang masuk. */}
        <div className="space-y-3 text-center">
          <Logo variant="light" height={34} asLink={false} className="mx-auto" />
          <div>
            <h1 className="font-ui text-base font-semibold text-ink-700">
              CV Reka Cipta Indonesia
            </h1>
            <p className="font-ui mt-0.5 text-sm font-medium tracking-wide text-neutral-500">
              Panel Admin
            </p>
          </div>
        </div>

        <hr className="border-neutral-100" />

        {/* Ditolak: punya sesi valid, tapi tidak ada di allowlist admin.
            Wajib ada tombol keluar — tanpa itu user terjebak (sesi tetap
            aktif, tapi setiap /admin/* memantulkannya balik ke sini). */}
        {denied && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger-100 bg-danger-50 p-3 text-sm text-danger-700"
          >
            <ShieldWarningIcon size={16} weight="duotone" aria-hidden="true" className="mt-0.5 shrink-0 text-danger-600" />
            <div className="space-y-2">
              <p>Akun Anda tidak memiliki akses ke panel admin.</p>
              <button
                type="button"
                onClick={handleSignOut}
                className="font-semibold underline underline-offset-2 hover:text-danger-800"
              >
                Keluar dari akun ini
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          onChange={() => authError && setAuthError(null)}
          className="space-y-4"
          noValidate
        >
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="font-ui block text-sm font-semibold text-ink-700">
              Email
            </label>
            <input
              {...register('email')}
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@rekaciptaindonesia.com"
              disabled={isSubmitting}
              className={[
                'w-full h-11 px-3.5 py-2.5 text-sm text-neutral-900 bg-white rounded-md',
                'placeholder:text-neutral-400 transition-colors duration-150',
                'focus:outline-none focus:shadow-focus',
                'disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed',
                errors.email
                  ? 'border border-danger-600 focus:shadow-focus-error'
                  : 'border border-ink-900/15 hover:border-brand-teal-500/40 focus:border-brand-teal-500',
              ].join(' ')}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-danger-600 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="font-ui block text-sm font-semibold text-ink-700">
              Password
            </label>
            <div className="relative">
              <input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                disabled={isSubmitting}
                className={[
                  'w-full h-11 px-3.5 py-2.5 pr-11 text-sm text-neutral-900 bg-white rounded-md',
                  'placeholder:text-neutral-400 transition-colors duration-150',
                  'focus:outline-none focus:shadow-focus',
                  'disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed',
                  errors.password
                    ? 'border border-danger-600 focus:shadow-focus-error'
                    : 'border border-ink-900/15 hover:border-brand-teal-500/40 focus:border-brand-teal-500',
                ].join(' ')}
                aria-invalid={errors.password ? 'true' : 'false'}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus-visible:outline-none focus-visible:text-brand-teal-600 transition-colors duration-100"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeSlashIcon size={20} weight="duotone" /> : <EyeIcon size={20} weight="duotone" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-danger-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Auth error */}
          {authError && (
            <div
              role="alert"
              aria-live="polite"
              className="flex items-start gap-2 p-3 bg-danger-50 border border-danger-100 rounded-lg text-sm text-danger-700"
            >
              <WarningCircleIcon size={16} weight="duotone" aria-hidden="true" className="text-danger-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || cooldown > 0}
            className="font-ui w-full flex items-center justify-center gap-2 h-12 bg-brand-teal-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-brand-teal-500 hover:shadow-md active:bg-brand-teal-700 active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus transition-all duration-100 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-brand-teal-600 disabled:hover:shadow-sm disabled:active:scale-100"
          >
            {isSubmitting ? (
              <>
                <CircleNotchIcon size={20} weight="bold" className="animate-spin" aria-hidden="true" />
                Memproses...
              </>
            ) : cooldown > 0 ? (
              `Tunggu ${cooldown} detik`
            ) : (
              'Masuk'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
