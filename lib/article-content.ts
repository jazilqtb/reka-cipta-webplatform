// lib/article-content.ts
// Epic 6 Slice 1 — sanitasi HTML artikel (AR-05, XSS defense).
//
// getArticleExcerpt() ada di lib/article-excerpt.ts. Lihat header file itu.
//
// CP0 (2026-08-19) — `isomorphic-dompurify` DIGANTI `sanitize-html`.
// Alasannya bukan preferensi: isomorphic-dompurify menarik jsdom, dan jsdom
// TIDAK BISA di-require saat runtime di Vercel. Dikonfirmasi lewat endpoint
// diagnostik di produksi: Node v24.18.0 (yang mendukung require(esm)) tetap
// melempar ERR_REQUIRE_ESM — html-encoding-sniffer@6 me-require
// @exodus/bytes yang ESM murni. Jadi ini bukan soal versi Node, melainkan
// cara Next 16/Turbopack meng-externalize jsdom di runtime Vercel.
//
// Akibatnya /artikel gagal 500 (sudah diperbaiki dgn memisah modul), dan
// /artikel/[slug] untuk artikel BARU — yang dirender on-demand karena
// dynamicParams default true — juga 500. Yang terakhir ini tidak bisa
// diperbaiki dengan memisah modul, karena halaman itu memang butuh
// menyanitasi HTML. Maka jsdom harus benar-benar hilang.
//
// sanitize-html memakai htmlparser2 — parser HTML murni, nol implementasi
// DOM, jalan di Node mana pun. jsdom kini nol di dependency tree.
//
// BEDA PERILAKU YANG DISENGAJA vs DOMPurify:
// - allowedAttributes dibuat PER-TAG, bukan global. DOMPurify ALLOWED_ATTR
//   berlaku ke semua tag, jadi `href` ikut diizinkan di <img>. Per-tag lebih
//   ketat dan lebih mudah diaudit.
// - allowedSchemes dieksplisitkan. Ini yang memblokir javascript:.
// - data: URI TIDAK diizinkan di <img>. Gambar artikel selalu diunggah ke
//   Supabase Storage lewat uploadArticleContentImage(), jadi selalu https.

import sanitizeHtml from 'sanitize-html'

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'h2', 'h3', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'img', 'br', 'blockquote'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  // Isi tag terlarang tetap dipertahankan (setara KEEP_CONTENT DOMPurify),
  // KECUALI tag yang isinya bukan teks untuk dibaca — script/style dibuang
  // beserta isinya, bukan diratakan jadi teks biasa.
  nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript'],
}

export function sanitizeArticleContent(rawHtml: string): string {
  return sanitizeHtml(rawHtml, OPTIONS)
}
