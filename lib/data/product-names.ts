// lib/data/product-names.ts
// Peta slug produk -> nama produk, diambil DI SERVER.
//
// RFQ menyimpan `salt_types` sebagai slug. Menerjemahkannya dengan menebak
// dari slug akan salah: "garam-ghpt" jadi "Garam Ghpt", padahal namanya
// "Garam Halus Pakan Ternak". Jadi petanya diambil dari tabel products.
//
// Dipisah ke modul sendiri di CP4 karena helper ini tadinya hidup sebagai
// fungsi privat di app/admin/leads/page.tsx — dan halaman detail lead
// (app/admin/leads/[id]/page.tsx) tidak bisa memakainya. Akibatnya
// operator yang membuka lead di PONSEL membaca slug mentah
// ("garam-halus-yodium, garam-kasar-industri") sementara operator di
// desktop membaca chip bernama benar, untuk lead yang sama persis.

import { createPublic } from '@/lib/supabase/public'

export async function getProductNames(): Promise<Record<string, string>> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase.from('products').select('slug, name')
    if (error || !data) return {}
    return Object.fromEntries(data.map((p) => [p.slug as string, p.name as string]))
  } catch {
    return {}
  }
}
