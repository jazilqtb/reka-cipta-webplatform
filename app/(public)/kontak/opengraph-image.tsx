import { renderOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image-template'

export const size = ogImageSize
export const contentType = ogImageContentType
export const alt = 'Hubungi CV Reka Cipta Indonesia'

export default function Image() {
  return renderOgImage(
    'Hubungi Kami',
    'Respons kurang dari 24 jam — kantor Surabaya, chat WhatsApp langsung'
  )
}
