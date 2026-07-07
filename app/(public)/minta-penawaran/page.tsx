// app/(public)/minta-penawaran/page.tsx — Halaman Minta Penawaran (/minta-penawaran)
// Epic 4 Customer-Facing (E4-CF-FE-02)
//
// Rendering : Static + revalidate 3600 — form structure statis, list
//             produk dari DB revalidate hourly.
// Data      : products via Supabase anon key (createPublic), Server
//             Component — WAJIB lib/supabase/public.ts (bukan server.ts)
//             supaya halaman tetap Static (○), bukan Dynamic (ƒ).

import type { Metadata } from 'next'
import { createPublic } from '@/lib/supabase/public'
import { InnerPageHero } from '@/components/sections/InnerPageHero'
import { RFQForm } from '@/components/rfq/RFQForm'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Minta Penawaran | CV Reka Cipta Indonesia',
  description:
    'Dapatkan proposal penawaran khusus untuk kebutuhan garam industri Anda. Isi form, tim kami hubungi dalam 1×24 jam.',
  alternates: {
    canonical: 'https://rekaciptaindonesia.com/minta-penawaran',
  },
  openGraph: {
    title: 'Minta Penawaran — CV Reka Cipta Indonesia',
    description: 'Dapatkan proposal penawaran khusus untuk kebutuhan garam industri Anda.',
    url: 'https://rekaciptaindonesia.com/minta-penawaran',
    type: 'website',
  },
}

async function getAvailableProducts(): Promise<Array<{ slug: string; name: string; code: string }>> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase
      .from('products')
      .select('slug, name, code')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error || !data) {
      console.error('[MintaPenawaran] Gagal fetch products:', error?.message)
      return []
    }

    return data
  } catch (err) {
    console.error('[MintaPenawaran] Exception saat fetch products:', err)
    return []
  }
}

export default async function MintaPenawaranPage() {
  const availableProducts = await getAvailableProducts()

  return (
    <main>
      <InnerPageHero
        title="Minta Penawaran Sekarang"
        subtitle="Dapatkan proposal khusus sesuai kebutuhan bisnis Anda"
        breadcrumb={[
          { label: 'Beranda', href: '/' },
          { label: 'Minta Penawaran' },
        ]}
      />
      <section className="container mx-auto max-w-3xl px-4 py-12 md:py-16">
        <RFQForm availableProducts={availableProducts} />
      </section>
    </main>
  )
}
