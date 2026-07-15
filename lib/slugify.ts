// lib/slugify.ts
// Epic 6 Admin Slice 1 (E6-ADM-S1-FE-01) — preview slug di form, sinkron
// logika dengan backend/utils/slugify.py (slugify_title). Otoritas final
// tetap backend (uniqueness check ada di server), ini cuma UX preview instan.

export function slugifyTitle(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}
