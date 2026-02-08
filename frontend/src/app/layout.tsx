import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import '@/styles/globals.css'
import { ErrorBoundary } from '@/components/error-boundary'
import { ToastContainer } from '@/components/ui/toast'
import { PWAProvider } from '@/components/pwa-provider'
import { SkipLink } from '@/components/ui/skip-link'
import { PerformanceMonitor } from '@/components/performance-monitor'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PawPal - AI Pet Care Assistant',
  description: 'Comprehensive pet care management with AI-powered health insights',
  keywords: ['pet care', 'veterinary', 'AI assistant', 'pet health'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PawPal',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f97316',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="font-sans antialiased">
        <SkipLink />
        <PerformanceMonitor />
        <ErrorBoundary>
          <PWAProvider>
            <main id="main-content" role="main">
              {children}
            </main>
            <ToastContainer />
          </PWAProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
