import type { Metadata } from 'next';
import Script from 'next/script';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
  preload: true,
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-jost',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://lavishorganic.in'
  ),
  title: {
    default: 'LavishOrganic — 100% Organic Skincare & Wellness | Made in India',
    template: '%s | LavishOrganic',
  },
  description:
    'Discover LavishOrganic — premium certified organic skincare, hair care, and wellness products. Cruelty-free, dermatologist tested, made in India. Shop face care, body care, and Ayurvedic hair oils.',
  keywords: [
    'organic skincare India',
    'natural beauty products',
    'cruelty-free skincare',
    'ayurvedic hair care',
    'organic face wash',
    'vitamin c serum',
    'natural body lotion',
    'LavishOrganic',
  ],
  authors: [{ name: 'LavishOrganic' }],
  creator: 'LavishOrganic',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://lavishorganic.in',
    siteName: 'LavishOrganic',
    title: 'LavishOrganic — Premium Organic Skincare',
    description:
      '100% organic, cruelty-free skincare made in India. Discover our collection of face care, body care, hair care & wellness products.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'LavishOrganic — Organic Skincare & Wellness',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LavishOrganic — Organic Skincare & Wellness',
    description:
      '100% organic, cruelty-free skincare made in India. Shop face care, body care, and Ayurvedic hair care.',
    images: ['/og-image.jpg'],
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
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icon-192x192.png',
  },
};

import { PWAInstallPrompt } from '@/components/store/PWAInstallPrompt';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jost.variable}`}
      suppressHydrationWarning
    >
      <body className="font-body bg-cream text-charcoal antialiased">
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-RV435264ZX" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RV435264ZX');
          `}
        </Script>
        {children}
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
