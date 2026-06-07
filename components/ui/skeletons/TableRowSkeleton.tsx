interface TableRowSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export function TableRowSkeleton({
  rows = 5,
  columns = 4,
  className = '',
}: TableRowSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Memuat data...">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center gap-4 p-4 bg-white rounded-lg border border-neutral-100"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <TextLineSkeleton
              key={colIdx}
              width={colIdx === 0 ? 'w-1/4' : colIdx === columns - 1 ? 'w-1/6' : 'w-full'}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// Import needed inside this file
import { TextLineSkeleton } from './TextLineSkeleton'
