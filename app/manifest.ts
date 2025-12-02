import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cool Voyage - Agence de voyage à Madagascar',
    short_name: 'Cool Voyage',
    description: 'Découvrez Madagascar avec Cool Voyage. Voyages organisés à prix abordables vers Ambila Lemaintso, Manambato, Sainte-Marie et le Grand Sud.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#059669',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}


