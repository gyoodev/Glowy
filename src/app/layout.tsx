

import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import type { Metadata } from 'next';

import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';
import { CookieConsentBanner } from '@/components/layout/CookieConsentBanner';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import FirebaseConfigErrorPage from '@/components/layout/FirebaseConfigErrorPage';
import { PWAInstallBanner } from '@/components/layout/PWAInstallBanner';
import { Header } from '@/components/layout/header';

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
  icons: {
    icon: '/favicon/favicon.ico',
    apple: '/favicon/apple-touch-icon.png',
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // If firebase is not configured, show a dedicated error page with instructions.
  if (!isFirebaseConfigured) {
    return (
      <html lang="bg">
        <body>
          <FirebaseConfigErrorPage />
        </body>
      </html>
    );
  }

  // Otherwise, render the normal application layout.
  return (
    <html lang="bg" suppressHydrationWarning>
      <head>
        {/* Favicon links are still recommended to be placed here for broad compatibility */}
        <meta name="theme-color" content="#E6E6FA" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <Header />
        <main className="flex-1 bg-background">
          {children}
        </main>
        <Footer />
        <Toaster />
        <CookieConsentBanner />
        <PWAInstallBanner />
      </body>
    </html>
  );
}
