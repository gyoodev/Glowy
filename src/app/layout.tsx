
import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import type { Metadata } from 'next';

import ClientLayoutContent from '@/components/layout/ClientLayoutContent';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';
import { CookieConsentBanner } from '@/components/layout/CookieConsentBanner';

export const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Glaura - Открий своя блясък',
    template: '%s | Glaura',
  },
  description: 'Открийте най-добрите салони за красота и услуги във Вашия град. Запазете час лесно и бързо с Glaura. Фризьорски салони, маникюр, спа и други.',
  keywords: ['салон за красота', 'фризьор', 'маникюр', 'педикюр', 'козметик', 'спа', 'резервация на час', 'Glaura', 'салони в софия', 'салони в пловдив', 'салони в бургас'],
  authors: [{ name: 'GKDEV', url: 'https://gkdev.org' }],
  creator: 'GKDEV',
  publisher: 'Glaura',
  manifest: '/manifest.json',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg" suppressHydrationWarning>
      <head>
        {/* Favicon links are still recommended to be placed here for broad compatibility */}
        <link rel="icon" href="/favicon/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" />
        <meta name="theme-color" content="#E6E6FA" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <ClientLayoutContent>
          <main className="flex-1 bg-background">
            {children}
          </main>
        </ClientLayoutContent>
        <Footer />
        <Toaster />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
