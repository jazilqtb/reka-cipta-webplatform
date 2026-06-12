// app/(public)/loading.tsx
// Epic 2 Slice 1 (E2-S1-FE-01)
//
// Skeleton route-level untuk semua halaman (public) — anatominya
// meniru Beranda (halaman utama group ini): hero penuh → stats
// 4 kolom → kartu produk. Pakai class .skeleton dari globals.css
// (shimmer — E1-UX-08 §2.3, JANGAN redeclare).
//
// Catatan: dengan ISR (revalidate 3600) loading ini jarang
// terlihat di production — muncul saat regenerasi atau navigasi
// client-side pertama. Tetap wajib ada sebagai fallback.

export default function PublicLoading() {
  return (
    <div aria-busy="true" aria-label="Memuat halaman">
      {/* Hero — tinggi menyerupai hero asli agar tidak layout shift */}
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <div className="skeleton h-6 w-36 rounded-full" />        {/* badge */}
        <div className="skeleton h-12 w-full max-w-2xl" />        {/* headline baris 1 */}
        <div className="skeleton h-12 w-full max-w-xl" />         {/* headline baris 2 */}
        <div className="skeleton h-5 w-full max-w-lg" />          {/* sub-headline */}
        <div className="mt-2 flex gap-3">
          <div className="skeleton h-11 w-44 rounded-lg" />       {/* CTA primary */}
          <div className="skeleton h-11 w-36 rounded-lg" />       {/* CTA secondary */}
        </div>
      </div>

      {/* Stats Bar — 2×2 mobile, 4 kolom desktop (struktur asli) */}
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-4 py-12 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 p-4">
            <div className="skeleton h-12 w-20" />                {/* angka */}
            <div className="skeleton h-4 w-24" />                 {/* label */}
          </div>
        ))}
      </div>

      {/* Products — 2 kolom mobile, 5 desktop (struktur asli) */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 pb-16 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="skeleton aspect-[4/3] w-full rounded-md" /> {/* foto 4:3 */}
            <div className="skeleton h-5 w-3/4" />                {/* nama */}
            <div className="skeleton h-4 w-1/2" />                {/* spec */}
          </div>
        ))}
      </div>
    </div>
  )
}
