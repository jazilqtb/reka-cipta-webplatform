// components/blocks/TeamMember.tsx
// RONDE Tahap 7 (2026-08) — "samakan DNA desain /tentang-kami": Badge
// shadcn (outline generik) diganti .tag-pill (bahasa badge teks kecil
// yg SAMA dipakai di seluruh situs — SNI, nomor lab, dst). .photo-teal-
// hover DIPERTAHANKAN — pattern approved (Design System §19.5), bukan
// bagian dari keluhan manapun.
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { TeamMember as TeamMemberType } from '@/constants/company-profile'

interface TeamMemberProps {
  member: TeamMemberType
}

export function TeamMember({ member }: TeamMemberProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="flex flex-col items-center text-center">
      {/* Foto dengan hover effect atau fallback avatar */}
      <div className={cn('photo-teal-hover aspect-square w-full overflow-hidden rounded-xl')}>
        {!imgError ? (
          <Image
            src={member.photoPath}
            alt={`Foto ${member.name}`}
            width={240}
            height={240}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-brand-teal-600">
            <span className="text-3xl font-bold text-white">{member.initials}</span>
          </div>
        )}
      </div>

      {/* Nama */}
      <p className="font-ui mt-3 text-sm font-semibold text-ink-700">{member.name}</p>

      {/* Jabatan */}
      <span className="tag-pill mt-1.5">{member.position}</span>
    </div>
  )
}
