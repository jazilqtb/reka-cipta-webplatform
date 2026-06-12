# Keputusan Desain — Epic 2 Slice 1 Beranda
Dikunci pada Fase 0 · Juni 2026

## Hero Section
- Teks headline: "Mitra Distribusi Garam SNI Anda: Transparan, Cepat, dan Terverifikasi"
- Foto: placeholder bg-teal-900 (foto real pending dari klien → public/images/hero/)
- Animasi: Framer Motion fadeInUp stagger (diinstall Fase 3)
- Layout: centered

## Stats Bar
- Values: Jenis Garam=5 (static), Mitra Aktif=6, Kota=9, Distribusi=353 TON
- SVG Map: Opsi A — placeholder rect (SVG path Jawa: TODO post-launch)
- Slide interval: 8000ms

## Products Preview
- 5 produk confirmed (nama, spec, SNI status — lihat PRODUCTS_PREVIEW const)
- Mobile: horizontal snap scroll w-[75vw]

## HowItWorks
- Scroll-driven sticky, Framer Motion useScroll+useTransform
- Background: placeholder bg-ink-900 (foto pending: public/images/how-it-works-bg.jpg)

## Industries Grid
- Icons: Lucide React fallback → custom SVG TODO (pending dari klien)
- Folder siap: public/icons/industries/

## Credibility Marquee
- 5 klien confirmed (boleh tampil di website: [KONFIRMASI KE KLIEN])
- CSS .marquee-track ditambahkan di FE-07

## CTA Section
- bg-brand-teal-600, Primary: bg-white text-teal, Secondary: border-white text-white

## SEO
- Domain: rekaciptaindonesia.com
- OG image: public/og-image.svg (placeholder, ganti JPG sebelum launch)

## Pending dari klien (tidak blocking development)
1. Foto hero (3 buah, 1920×1080px)
2. Foto how-it-works background (1920×1080px)
3. Foto produk (5 buah, 800×600px)
4. SVG icons industri (6 buah, 48×48px line-art)
5. Konfirmasi boleh tampil nama klien di website publik
6. Domain production final

## Update Konfirmasi (sebelum Fase 1)
- SVG Map           : Opsi A — placeholder rect ✅
- Industries icons  : Lucide React fallback (custom SVG TODO) ✅
- Marquee CSS       : BELUM ADA di globals.css → ditambahkan di FE-07 ✅
- Klien marquee     : Boleh ditampilkan di website publik ✅
