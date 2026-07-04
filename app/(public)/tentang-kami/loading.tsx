import { TextLineSkeleton } from '@/components/ui/skeletons'

export default function TentangKamiLoading() {
  return (
    <div className="min-h-screen">
      <div className="h-72 bg-ink-900 animate-pulse" />
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <TextLineSkeleton key={i} width={i % 3 === 0 ? '50%' : '100%'} />
        ))}
      </div>
    </div>
  )
}
