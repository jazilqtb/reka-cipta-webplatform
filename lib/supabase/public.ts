// lib/supabase/public.ts
// Epic 2 Slice 1 — Stateless Supabase client untuk fetch data PUBLIK
// di Server Components.
//
// Mengapa terpisah dari lib/supabase/server.ts?
// - server.ts memanggil cookies() → menandai halaman 'Dynamic' →
//   ISR/SSG mati. Cocok untuk auth (cek session admin, dll.).
// - Halaman publik (Beranda, Tentang Kami, Kontak) hanya butuh
//   READ data via RLS anon — tidak butuh cookies sama sekali.
// - Memakai @supabase/supabase-js (vanilla client) di sini agar
//   tidak ada akses cookies → halaman tetap Static (○) + ISR.
//
// Aturan pakai:
// - Halaman publik fetch data via RLS public-read → createPublic()
// - Halaman/komponen yg butuh session user → createClient() server.ts
// - Operasi tulis admin via FastAPI (service-role) → core/supabase.py
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createPublic() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Stateless — tidak baca/tulis storage cookies/localStorage.
        // Wajib false agar tidak menyentuh dynamic API di Server Component.
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
