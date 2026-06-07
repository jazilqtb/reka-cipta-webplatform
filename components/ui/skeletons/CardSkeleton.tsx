import { ImageSkeleton } from './ImageSkeleton'
import { TextLineSkeleton } from './TextLineSkeleton'

interface CardSkeletonProps {
  hasImage?: boolean
  lines?: number
  className?: string
}

export function CardSkeleton({
  hasImage = true,
  lines = 3,
  className = '',
}: CardSkeletonProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-neutral-100 overflow-hidden ${className}`}
      role="status"
      aria-label="Memuat konten..."
    >
      {hasImage && <ImageSkeleton aspectRatio="video" className="rounded-none" />}
      <div className="p-4 space-y-3">
        <TextLineSkeleton width="w-3/4" />
        {Array.from({ length: lines - 1 }).map((_, i) => (
          <TextLineSkeleton
            key={i}
            width={i === lines - 2 ? 'w-1/2' : 'w-full'}
          />
        ))}
      </div>
    </div>
  )
}
