import { renderOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image-template'

export const size = ogImageSize
export const contentType = ogImageContentType
export const alt = 'Katalog Produk Garam Industri — CV Reka Cipta Indonesia'

export default function Image() {
  return renderOgImage(
    'Katalog Produk Garam Industri',
    '5 varian garam bersertifikat SNI untuk kebutuhan industri Anda'
  )
}
