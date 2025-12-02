import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const alt = 'Cool Voyage - Agence de voyage à Madagascar'
export const size = {
  width: 1200,
  height: 630,
}
 
export const contentType = 'image/png'
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(135deg, #059669 0%, #14b8a6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 180, marginBottom: 20 }}>🌴</div>
        <div style={{ fontSize: 80, fontWeight: 'bold', marginBottom: 10 }}>Cool Voyage</div>
        <div style={{ fontSize: 40 }}>Agence de voyage à Madagascar</div>
      </div>
    ),
    {
      ...size,
    }
  )
}


