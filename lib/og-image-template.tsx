import { ImageResponse } from 'next/og'

export const ogImageSize = { width: 1200, height: 630 }
export const ogImageContentType = 'image/png'

export function renderOgImage(title: string, subtitle: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          backgroundColor: '#151A1F',
          backgroundImage: 'linear-gradient(180deg, #151A1F 0%, #0B0E12 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{ width: 10, height: 10, backgroundColor: '#1A6EA8' }} />
          <span style={{ color: '#B3C9DA', fontSize: 28, letterSpacing: 2, textTransform: 'uppercase' }}>
            CV Reka Cipta Indonesia
          </span>
        </div>
        <div style={{ display: 'flex', color: '#FFFFFF', fontSize: 64, fontWeight: 700, lineHeight: 1.15, maxWidth: 980 }}>
          {title}
        </div>
        <div style={{ display: 'flex', color: '#E0E4EA', fontSize: 30, marginTop: 28, maxWidth: 900 }}>
          {subtitle}
        </div>
      </div>
    ),
    { ...ogImageSize }
  )
}
