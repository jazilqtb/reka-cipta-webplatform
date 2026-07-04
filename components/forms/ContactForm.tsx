// components/forms/ContactForm.tsx
// Epic 2 Slice 3 (E2-S3-FE-04) — Form kontak publik.
// 'use client' — react-hook-form + Zod, submit ke FastAPI POST /contact/send.

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { apiFetch, ApiFetchError } from '@/lib/api'
import type { ContactRequest, ContactResponse } from '@/types/api'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const contactSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Format email tidak valid'),
  phone: z
    .string()
    .regex(/^(\+62|62|0)8\d{8,12}$/, 'Format WA Indonesia tidak valid')
    .optional()
    .or(z.literal('')),
  message: z.string().min(10, 'Pesan minimal 10 karakter').max(1000, 'Maks 1000 karakter'),
})

type ContactFormValues = z.infer<typeof contactSchema>

const MESSAGE_MAX = 1000

export function ContactForm() {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', phone: '', message: '' },
  })

  const messageLength = watch('message')?.length ?? 0

  async function onSubmit(values: ContactFormValues) {
    try {
      const payload: ContactRequest = {
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        message: values.message,
      }
      await apiFetch<ContactResponse>('/contact/send', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      toast.success('Pesan Anda berhasil terkirim. Kami akan merespons dalam 1 × 24 jam kerja.')
      reset()
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 429) {
        toast.warning('Terlalu banyak permintaan. Silakan tunggu beberapa saat.')
      } else {
        toast.error('Gagal mengirim pesan. Silakan coba lagi atau hubungi via WhatsApp.')
      }
    }
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 md:p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-ink-700">Kirim Pesan</h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-busy={isSubmitting}
        className="mt-6 space-y-5"
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">
            Nama Lengkap <span className="text-danger-600">*</span>
          </Label>
          <Input
            {...register('name')}
            id="name"
            type="text"
            disabled={isSubmitting}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-danger-600">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">
            Email <span className="text-danger-600">*</span>
          </Label>
          <Input
            {...register('email')}
            id="email"
            type="email"
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-danger-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Nomor WhatsApp</Label>
          <Input
            {...register('phone')}
            id="phone"
            type="tel"
            placeholder="08xxxxxxxxxx"
            disabled={isSubmitting}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
          {errors.phone && (
            <p id="phone-error" className="text-sm text-danger-600">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="message">
            Pesan <span className="text-danger-600">*</span>
          </Label>
          <Textarea
            {...register('message')}
            id="message"
            rows={5}
            maxLength={MESSAGE_MAX}
            disabled={isSubmitting}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'message-error' : undefined}
          />
          <div className="flex items-center justify-between">
            {errors.message ? (
              <p id="message-error" className="text-sm text-danger-600">
                {errors.message.message}
              </p>
            ) : (
              <span />
            )}
            <span className="text-xs text-neutral-400">
              {messageLength}/{MESSAGE_MAX}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'w-full md:w-auto md:ml-auto md:flex flex justify-center items-center gap-2',
            'h-11 px-6 bg-brand-teal-600 text-white text-sm font-semibold rounded-md',
            'hover:bg-brand-teal-500 active:bg-brand-teal-700 transition-colors duration-100',
            'disabled:opacity-60 disabled:cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Mengirim...
            </>
          ) : (
            'Kirim Pesan'
          )}
        </button>
      </form>
    </div>
  )
}
