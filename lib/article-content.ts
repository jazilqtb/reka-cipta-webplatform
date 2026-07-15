// lib/article-content.ts
// Epic 6 Slice 1 — sanitasi HTML artikel (AR-05, XSS defense) dan fallback
// excerpt kalau meta_description kosong (AR-04).

import DOMPurify from 'isomorphic-dompurify'

export function sanitizeArticleContent(rawHtml: string): string {
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['p', 'h2', 'h3', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'img', 'br', 'blockquote'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel'],
  })
}

export function getArticleExcerpt(article: { meta_description: string | null; content: string }): string {
  if (article.meta_description) return article.meta_description

  const plainText = article.content.replace(/<[^>]*>/g, '').trim()
  if (plainText.length <= 160) return plainText

  const truncated = plainText.slice(0, 160)
  const lastSpace = truncated.lastIndexOf(' ')
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : 160)}…`
}
