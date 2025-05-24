import { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'QuranChat - Chat dengan Al-Quran',
  description: 'Chat dengan Al-Quran untuk mempelajari dan memahami kitab suci dengan lebih mudah.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'QuranChat',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'QuranChat',
    title: 'QuranChat - Chat dengan Al-Quran',
    description: 'Chat dengan Al-Quran untuk mempelajari dan memahami kitab suci dengan lebih mudah.',
  },
  twitter: {
    card: 'summary',
    title: 'QuranChat - Chat dengan Al-Quran',
    description: 'Chat dengan Al-Quran untuk mempelajari dan memahami kitab suci dengan lebih mudah.',
  },
}; 