// constants/articleCategories.ts
//
// CP1 (2026-08-19) — sumber tunggal label kategori artikel.
//
// MASALAH YANG DITUTUP: label yang sama dideklarasikan ulang di LIMA
// tempat. Ketika "Edukasi Garam" diganti jadi "Wawasan Industri" atas
// permintaan klien, tiga tempat di portal publik ikut berubah tapi DUA
// tempat di admin tertinggal — jadi admin menampilkan "Edukasi Garam"
// untuk artikel yang di situs publik tertulis "Wawasan Industri".
// Ditemukan lewat audit visual produksi, bukan dari kode.
//
// Selama nilainya masih literal yang tersebar, kelas bug ini akan
// berulang setiap kali copywriting berubah. Satu konstanta menutupnya.

import type { ArticleCategory } from '@/types/api'

export const ARTICLE_CATEGORY_LABEL: Record<ArticleCategory, string> = {
  education: 'Wawasan Industri',
  company_news: 'Berita Perusahaan',
}

/** Untuk <select> di form admin — urutan sengaja dikunci di sini. */
export const ARTICLE_CATEGORY_OPTIONS: Array<{ value: ArticleCategory; label: string }> = [
  { value: 'education', label: ARTICLE_CATEGORY_LABEL.education },
  { value: 'company_news', label: ARTICLE_CATEGORY_LABEL.company_news },
]
