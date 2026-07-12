import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hahuplay.com';
const TITLE = 'HahuPlay — The Grand Prize Draw';
const DESCRIPTION =
  'One ticket enters every draw — the house, the car, the phone. Verified payments, provable draws, published winners. 18+ only.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: '%s · HahuPlay' },
  description: DESCRIPTION,
  keywords: ['lottery', 'raffle', 'Ethiopia', 'Addis Ababa', 'prize draw', 'ሀሁ', 'HahuPlay'],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'HahuPlay',
    locale: 'en_US',
    images: [{ url: '/photo_1_2026-07-11_23-07-32.jpg', width: 1280, height: 960, alt: 'The grand prize house' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/photo_1_2026-07-11_23-07-32.jpg'],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#071b14',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
      </head>
      <body className="bg-paper-50 font-sans text-ink-900 antialiased">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
