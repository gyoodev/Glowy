import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import {Footer} from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/header';
import LoadingScreenAnimation from '@/components/layout/LoadingScreenAnimation';

const geistSans = Geist({
  variable: '--font-geist-sans',
  // weight: 'variable',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>,
) {
  return (
    <html lang="bg">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <LoadingScreenAnimation />
        <Header />
        <main className="flex-1 bg-background">
          {children}
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}