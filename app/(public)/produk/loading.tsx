import { CardSkeleton } from '@/components/ui/skeletons'

export default function ProdukLoading() {
  return (
    <div className="min-h-screen">
      <div className="h-72 animate-pulse bg-ink-900" />
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} lines={3} />
          ))}
        </div>
      </div>
    </div>
  )
}
