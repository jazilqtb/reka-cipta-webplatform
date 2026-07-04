'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
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
      <div className={cn('photo-teal-hover w-full aspect-square rounded-xl overflow-hidden')}>
        {!imgError ? (
          <Image
            src={member.photoPath}
            alt={`Foto ${member.name}`}
            width={240}
            height={240}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-brand-teal-600 flex items-center justify-center">
            <span className="text-white text-3xl font-bold">{member.initials}</span>
          </div>
        )}
      </div>

      {/* Nama */}
      <p className="font-semibold text-ink-700 mt-3 text-sm">{member.name}</p>

      {/* Jabatan */}
      <Badge
        variant="outline"
        className="mt-1 text-brand-teal-700 border-brand-teal-300 text-xs"
      >
        {member.position}
      </Badge>
    </div>
  )
}
