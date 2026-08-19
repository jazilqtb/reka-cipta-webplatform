// app/admin/loading.tsx
// Loading state root untuk SELURUH /admin/*.
//
// Setiap halaman admin adalah Server Component async yang menunggu
// Supabase; tanpa ini pengguna melihat halaman SEBELUMNYA tanpa indikasi
// apa pun bahwa ada yang sedang dimuat — terasa seperti klik yang tidak
// merespons.
//
// CP1 (2026-08-19) — kerangka dibuat NETRAL.
// Sebelumnya ia meniru dashboard: baris 4 kartu statistik. Karena file ini
// berlaku untuk seluruh /admin/*, halaman yang sama sekali tidak punya
// kartu statistik pun ikut menampilkannya. Audit visual produksi
// menangkapnya di /admin/articles — pengguna melihat 4 kartu berkedip yang
// lalu lenyap digantikan tabel. Itu BUKAN mengurangi pergeseran layout,
// melainkan menambahnya, sekaligus menjanjikan isi yang keliru.
//
// Bentuk netral (judul + satu blok konten) jujur untuk semua halaman:
// ia menyatakan "sedang memuat" tanpa berpura-pura tahu bentuk isinya.

export default function AdminLoading() {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat halaman…</span>

      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="space-y-2">
          <div className="skeleton h-6 w-48 rounded-md" />
          <div className="skeleton h-4 w-64 rounded-md" />
        </div>

        <div className="rounded-xl border border-ink-900/[0.07] bg-white p-5">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-9 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
