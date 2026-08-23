'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'light' | 'dark'
  /** Bungkus dengan <Link href="/"> jika true. Default true. */
  asLink?: boolean
  /** Tinggi logo dalam px. Default 40. Lebar otomatis menyesuaikan. */
  height?: number
  className?: string
  /** Override URL logo (dari lib/data/logo.ts, diambil di Server
   *  Component pemanggil). Kalau tidak diisi, jatuh ke berkas statis
   *  /logo/logo-{variant}.png. */
  src?: string
}

export function Logo({
  variant = 'light',
  asLink = true,
  height = 40,
  className,
  src: srcProp,
}: LogoProps) {
  const [imgError, setImgError] = useState(false)

  const src = srcProp || (variant === 'dark' ? '/logo/logo-dark.png' : '/logo/logo-light.png')

  const fallbackTextClass = variant === 'dark'
    ? 'text-white'
    : 'text-steel-800'

  const content = imgError ? (
    <div
      className={cn(
        'flex items-center justify-center font-extrabold tracking-tight',
        fallbackTextClass,
        className
      )}
      style={{ height, fontSize: height * 0.6 }}
      aria-label="CV Reka Cipta Indonesia"
    >
      RCI
    </div>
  ) : (
    <Image
      src={src}
      alt="CV Reka Cipta Indonesia"
      height={height}
      width={height * 4}
      onError={() => setImgError(true)}
      className={cn('h-auto w-auto object-contain', className)}
      style={{ height, maxHeight: height }}
      priority
    />
  )

  if (!asLink) return content

  return (
    <Link
      href="/"
      aria-label="Kembali ke beranda CV Reka Cipta Indonesia"
      className="inline-flex items-center"
    >
      {content}
    </Link>
  )
}
