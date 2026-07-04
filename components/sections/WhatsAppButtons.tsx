// components/sections/WhatsAppButtons.tsx
// Epic 2 Slice 3 (E2-S3-FE-03) — Tombol WA yang link ke wa.me/...
// Server Component. Pattern Base UI: <Link className={cn(buttonVariants(...))}>
// — BUKAN <Button asChild><Link>, idiom Radix yang tidak jalan di project ini.

import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn, formatPhoneDisplay } from '@/lib/utils'
import { generateWALink } from '@/lib/wa-link'

interface WhatsAppButtonsProps {
  whatsapp1: string
  whatsapp2?: string
  defaultMessage: string
}

export function WhatsAppButtons({ whatsapp1, whatsapp2, defaultMessage }: WhatsAppButtonsProps) {
  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
        Chat langsung via WhatsApp
      </h3>

      <div className="mt-3 flex flex-col gap-3 md:flex-row">
        <Link
          href={generateWALink(whatsapp1, defaultMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ size: 'lg' }),
            'bg-green-500 hover:bg-green-600 text-white gap-2 h-11 px-4'
          )}
        >
          <MessageCircle className="w-5 h-5" aria-hidden="true" />
          WA {formatPhoneDisplay(whatsapp1)}
        </Link>

        {whatsapp2 && (
          <Link
            href={generateWALink(whatsapp2, defaultMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'bg-green-500 hover:bg-green-600 text-white gap-2 h-11 px-4'
            )}
          >
            <MessageCircle className="w-5 h-5" aria-hidden="true" />
            WA {formatPhoneDisplay(whatsapp2)}
          </Link>
        )}
      </div>
    </div>
  )
}
