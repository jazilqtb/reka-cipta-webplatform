import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface InnerPageHeroProps {
  title: string
  subtitle?: string
  breadcrumb?: BreadcrumbItem[]
  className?: string
}

export function InnerPageHero({ title, subtitle, breadcrumb, className }: InnerPageHeroProps) {
  return (
    <section
      className={cn(
        'bg-ink-900 text-white py-16 md:py-24 px-4',
        'page-transition',
        className
      )}
    >
      <div className="max-w-5xl mx-auto">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-brand-teal-300/70">
            {breadcrumb.map((item, index) => (
              <span key={index} className="flex items-center gap-1">
                {index > 0 && <ChevronRight className="w-3 h-3" aria-hidden="true" />}
                {item.href ? (
                  <Link href={item.href} className="hover:text-brand-teal-200 transition-colors link-animated">
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-white">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">{title}</h1>

        {subtitle && (
          <p className="mt-4 text-lg text-brand-teal-100/80 max-w-2xl">{subtitle}</p>
        )}
      </div>
    </section>
  )
}
