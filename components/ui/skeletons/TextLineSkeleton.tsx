interface TextLineSkeletonProps {
  width?: string
  className?: string
}

export function TextLineSkeleton({
  width = 'w-full',
  className = '',
}: TextLineSkeletonProps) {
  return (
    <div
      className={`skeleton h-4 rounded ${width} ${className}`}
      role="status"
      aria-label="Memuat..."
    />
  )
}
