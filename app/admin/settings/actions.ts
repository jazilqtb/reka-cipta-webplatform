'use server'

// app/admin/settings/actions.ts
// Epic 2 Slice 3 (E2-S3-CACHE-01) — Server Action revalidate halaman
// publik setelah admin save. STUB di Phase 11 — implementasi asli
// (revalidatePath + auth check) ditambahkan di Phase 12.

export async function revalidateSettings() {
  return { revalidated: false, timestamp: new Date().toISOString() }
}
