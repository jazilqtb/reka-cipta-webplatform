// app/admin/loading.tsx
// CHECKPOINT 1 (2026-08-15) — loading state root untuk SELURUH /admin/*.
//
// MASALAH YANG DITUTUP: audit menemukan NOL loading.tsx di seluruh
// surface admin. Setiap halaman admin adalah Server Component async
// yang menunggu Supabase, jadi selama fetch berjalan pengguna melihat
// halaman SEBELUMNYA tanpa indikasi apa pun bahwa ada yang sedang
// dimuat — terasa seperti klik yang tidak merespons.
//
// Memakai .skeleton dari globals.css (sudah ada, dipakai portal publik)
// supaya animasi shimmer-nya sama persis dengan sisi publik.

export default function AdminLoading() {
  return (
    <main className="flex-1 overflow-y-auto p-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat halaman…</span>

      <div className="mx-auto max-w-[1440px] space-y-6">
        {/* Judul halaman */}
        <div className="space-y-2">
          <div className="skeleton h-7 w-56 rounded-md" />
          <div className="skeleton h-4 w-80 rounded-md" />
        </div>

        {/* Baris kartu — bentuknya meniru layout admin yang paling umum
            (dashboard 4 kartu / header filter) supaya pergeseran layout
            saat konten asli masuk seminimal mungkin. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-neutral-100 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-9 w-9 rounded-lg" />
              </div>
              <div className="skeleton h-8 w-16 rounded" />
            </div>
          ))}
        </div>

        {/* Blok konten utama */}
        <div className="rounded-xl border border-neutral-100 bg-white p-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-10 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
