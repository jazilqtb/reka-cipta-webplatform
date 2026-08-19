// lib/article-excerpt.ts
// Fallback excerpt kalau meta_description kosong (AR-04).
//
// KENAPA FILE TERPISAH DARI lib/article-content.ts (2026-08-19):
// Fungsi ini murni manipulasi string — nol kebutuhan DOM. Sebelumnya ia
// menumpang di lib/article-content.ts, yang baris atasnya meng-import
// `isomorphic-dompurify` → jsdom. Karena import di JS dievaluasi per
// MODUL (bukan per fungsi), ArticleCard yang cuma butuh excerpt ikut
// menyeret jsdom ke bundle server /artikel.
//
// Akibatnya di produksi Vercel: /artikel gagal 500 pada 100% request dgn
// ERR_REQUIRE_ESM — jsdom di-require() saat runtime (Next memperlakukannya
// sbg server-external package), dan salah satu dependensinya
// (@exodus/bytes) adalah ESM murni, yang hanya bisa di-require() oleh
// Node >= 20.19. Node di Vercel lebih tua dari itu.
//
// Memisahkan file ini membuat /artikel TIDAK PERNAH memuat jsdom, terlepas
// dari versi Node mana pun yang dipakai host. Jangan gabungkan kembali,
// dan jangan tambahkan import apa pun yang menyentuh DOM di file ini.

export function getArticleExcerpt(article: { meta_description: string | null; content: string }): string {
  if (article.meta_description) return article.meta_description

  const plainText = article.content.replace(/<[^>]*>/g, '').trim()
  if (plainText.length <= 160) return plainText

  const truncated = plainText.slice(0, 160)
  const lastSpace = truncated.lastIndexOf(' ')
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : 160)}…`
}
