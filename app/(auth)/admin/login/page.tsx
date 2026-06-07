'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password tidak boleh kosong'),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginValues) => {
    setAuthError(null)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      // Selalu pesan generik — tidak membedakan email vs password salah
      setAuthError('Kredensial tidak valid. Silakan coba lagi.')
      return
    }

    router.push('/admin/dashboard')
    router.refresh()
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
      <div className="relative z-10 w-full max-w-sm bg-white rounded-xl shadow-2xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="h-12 w-12 rounded-xl bg-brand-teal-600 flex items-center justify-center mx-auto">
            <span className="text-white text-base font-bold">RC</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-ink-700">Reka Cipta</h1>
            <p className="text-sm font-medium text-neutral-500 tracking-wide mt-0.5">
              Admin Panel
            </p>
          </div>
        </div>

        <hr className="border-neutral-100" />

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          onChange={() => authError && setAuthError(null)}
          className="space-y-4"
          noValidate
        >
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
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
                  : 'border border-neutral-300 hover:border-neutral-400 focus:border-brand-teal-600',
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
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
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
                    : 'border border-neutral-300 hover:border-neutral-400 focus:border-brand-teal-600',
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
              <AlertCircle size={16} aria-hidden="true" className="text-danger-500 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 h-11 bg-brand-teal-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-brand-teal-500 hover:shadow-md active:bg-brand-teal-700 active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus transition-all duration-100 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-brand-teal-600 disabled:hover:shadow-sm disabled:active:scale-100"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                Memproses...
              </>
            ) : (
              'Masuk'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
