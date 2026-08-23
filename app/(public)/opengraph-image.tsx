import { renderOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image-template'

export const size = ogImageSize
export const contentType = ogImageContentType
export const alt = 'CV Reka Cipta Indonesia — Distributor Garam Industri Bersertifikat SNI'

export default function Image() {
  return renderOgImage(
    'Distributor Garam Industri Bersertifikat SNI',
    'Melayani sektor makanan, pengasinan, water treatment, dan pakan ternak'
  )
}
