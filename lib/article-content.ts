// lib/article-content.ts
// Epic 6 Slice 1 — sanitasi HTML artikel (AR-05, XSS defense).
//
// getArticleExcerpt() DIPINDAH ke lib/article-excerpt.ts (2026-08-19).
// Alasannya ada di header file itu: import DOMPurify di bawah menyeret
// jsdom ke setiap bundle yang menyentuh modul ini, dan itu membuat
// /artikel gagal 500 di produksi. Jangan pindahkan kembali ke sini.

import DOMPurify from 'isomorphic-dompurify'

export function sanitizeArticleContent(rawHtml: string): string {
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['p', 'h2', 'h3', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'img', 'br', 'blockquote'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel'],
  })
}
