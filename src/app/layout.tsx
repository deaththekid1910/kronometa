import type { Metadata, Viewport } from 'next'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import './globals.css'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import PWAInstallButton from '@/components/PWAInstallButton'

export const metadata: Metadata = {
  title: 'KronoMeta',
  description: 'Gestiona metas, hábitos y tiempo con cronómetros persistentes y gamificación.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/apple-icon-180.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'KronoMeta',
  },
}

export const viewport: Viewport = {
  themeColor: '#00F5FF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <ServiceWorkerRegister />
        <PWAInstallButton />
        {children}
      </body>
    </html>
  )
}