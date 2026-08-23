import { renderOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image-template'

export const size = ogImageSize
export const contentType = ogImageContentType
export const alt = 'Tentang Kami — CV Reka Cipta Indonesia'

export default function Image() {
  return renderOgImage(
    'Tentang Kami',
    'Distributor garam SNI sejak 2020 — profil perusahaan dan legalitas'
  )
}
