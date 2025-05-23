import type { Metadata, Viewport } from "next";
import { Inter, Poppins, Amiri } from "next/font/google";
import "./globals.css";
import ClientLayout from "./components/ClientLayout";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: 'swap',
  preload: true,
  variable: "--font-poppins",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: 'swap',
  preload: true,
  variable: "--font-amiri",
});

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="waQuran" />
        <meta name="msvalidate.01" content="your-bing-verification" />
        <meta name="description" content="Aplikasi pencarian ayat Al-Quran yang mudah digunakan. Temukan ayat-ayat Al-Quran dengan cepat dan mudah dalam bahasa Indonesia." />
        <meta name="keywords" content="Al-Quran, Quran, Islam, Ayat, Pencarian Quran, Muslim, Digital Quran, Alquran Digital, Baca Quran Online" />
        <meta name="author" content="waQuran Team" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="Indonesian" />
        <meta name="revisit-after" content="7 days" />
        <meta name="generator" content="Next.js" />
      </head>
      <body className={`${inter.className} ${poppins.variable} ${amiri.variable} font-poppins`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
