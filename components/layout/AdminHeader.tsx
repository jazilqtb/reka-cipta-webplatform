import { Bell, ChevronRight } from 'lucide-react'

interface AdminHeaderProps {
  title: string
  breadcrumb?: string
}

export function AdminHeader({ title, breadcrumb }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-neutral-200 px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900 leading-tight">
          {title}
        </h1>
        {breadcrumb && (
          <nav aria-label="Breadcrumb" className="mt-0.5">
            <ol className="flex items-center gap-1.5 text-xs text-neutral-400" role="list">
              <li>Admin</li>
              <li aria-hidden="true">
                <ChevronRight size={12} />
              </li>
              <li className="text-neutral-600 font-medium">{breadcrumb}</li>
            </ol>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          className="relative flex items-center justify-center h-9 w-9 rounded-lg text-neutral-500 hover:bg-neutral-100 active:bg-neutral-200 focus-visible:outline-none focus-visible:shadow-focus transition-colors duration-100"
          aria-label="Notifikasi"
        >
          <Bell size={20} />
        </button>
      </div>
    </header>
  )
}
