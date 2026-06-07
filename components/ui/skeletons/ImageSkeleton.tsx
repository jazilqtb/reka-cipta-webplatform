interface ImageSkeletonProps {
  aspectRatio?: 'square' | 'video' | 'portrait'
  className?: string
}

export function ImageSkeleton({
  aspectRatio = 'video',
  className = '',
}: ImageSkeletonProps) {
  const ratioClass = {
    square:   'aspect-square',
    video:    'aspect-video',
    portrait: 'aspect-[3/4]',
  }[aspectRatio]

  return (
    <div
      className={`skeleton rounded-lg ${ratioClass} ${className}`}
      role="status"
      aria-label="Memuat gambar..."
    />
  )
}
