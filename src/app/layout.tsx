import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import {Footer} from '@/components/layout/footer';
// import { ClerkProvider } from '@clerk/nextjs'; // ClerkProvider removed if not used
import { Header } from '@/components/layout/header';
import { Toaster } from "@/components/ui/toaster"; // Toaster needs to be here for useToast
import { CookieConsentBanner } from '@/components/layout/CookieConsentBanner'; // Import CookieConsentBanner
import '@/lib/gsap'; // Import GSAP setup

const geistSans = Geist({
  variable: '--font-geist-sans',
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
        {/* Removed LoadingScreenAnimation as per prior discussion (commented out in its file) */}
        <Header />
        <main className="flex-1 bg-background">
          {children}
        </main>
        <Footer />
        <Toaster />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
