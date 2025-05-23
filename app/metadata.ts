import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "i-Qlab - Baca, Tadabbur dan Tajwid Interactive 🚀",
  description: "Aplikasi pencarian ayat Al-Quran yang mudah digunakan. Temukan ayat-ayat Al-Quran dengan cepat dan mudah dalam bahasa Indonesia.",
  keywords: "Al-Quran, Quran, Islam, Ayat, Pencarian Quran, Muslim, Digital Quran, Alquran Digital, Baca Quran Online, Baca Quran Gratis, Baca Quran Online, Belajar Quran Online, Tadabbur Online, Tajwid Online",
  authors: [{ name: "i-Qlab" }],
  creator: "DigiTea",
  publisher: "DigiTea",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://waquran.app'),
  alternates: {
    canonical: 'https://waquran.app',
  },
  openGraph: {
    title: "waQuran App - Aplikasi Pencarian Ayat Al-Quran",
    description: "Aplikasi pencarian ayat Al-Quran yang mudah digunakan. Temukan ayat-ayat Al-Quran dengan cepat dan mudah dalam bahasa Indonesia.",
    url: 'https://waquran.app',
    siteName: 'waQuran App',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'waQuran App Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "waQuran App - Aplikasi Pencarian Ayat Al-Quran",
    description: "Aplikasi pencarian ayat Al-Quran yang mudah digunakan. Temukan ayat-ayat Al-Quran dengan cepat dan mudah dalam bahasa Indonesia.",
    images: ['/og-image.png'],
    creator: '@waquran',
    site: '@waquran',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification',
    yandex: 'your-yandex-verification',
  },
  category: 'education',
  classification: 'Islamic Application',
}; 