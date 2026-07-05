// lib/storage.ts
// Epic 3 Slice 1 — helper Supabase Storage public URL.
//
// Tabel yang menyimpan referensi file di bucket public (mis.
// products.photo_path) hanya menyimpan PATH RELATIF, bukan URL absolut —
// project ref tidak boleh hardcoded di data. Full URL selalu dikonstruksi
// di sini dari NEXT_PUBLIC_SUPABASE_URL env var. Ref: ARCHITECTURE.md §12.4.

import { publicEnv } from '@/lib/env'

export function getPublicStorageUrl(bucket: string, path: string): string {
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}
