import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const size = {
  width: 192,
  height: 192,
}
 
export const contentType = 'image/png'
 
export default function Icon192() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(135deg, #059669 0%, #14b8a6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '20%',
        }}
      >
        🌴
      </div>
    ),
    {
      ...size,
    }
  )
}


