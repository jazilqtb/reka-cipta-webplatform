import { TextLineSkeleton } from '@/components/ui/skeletons'

export default function KontakLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <div className="h-72 bg-ink-900 animate-pulse" />

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Info kontak skeleton */}
          <div className="md:col-span-2 space-y-4">
            <TextLineSkeleton width="w-1/2" />
            <TextLineSkeleton width="w-full" />
            <TextLineSkeleton width="w-full" />
            <TextLineSkeleton width="w-3/4" />
          </div>

          {/* Form skeleton */}
          <div className="md:col-span-3 bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 space-y-4">
            <TextLineSkeleton width="w-1/3" />
            <TextLineSkeleton width="w-full" />
            <TextLineSkeleton width="w-full" />
            <TextLineSkeleton width="w-full" />
            <TextLineSkeleton width="w-full" />
          </div>
        </div>

        {/* Maps skeleton */}
        <div className="aspect-video bg-neutral-200 rounded-2xl animate-pulse mt-12" />
      </div>
    </div>
  )
}
