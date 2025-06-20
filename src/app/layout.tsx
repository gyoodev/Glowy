
import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase';


import ClientLayoutContent from '@/components/layout/ClientLayoutContent'; // Import the new client component
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';
import { CookieConsentBanner } from '@/components/layout/CookieConsentBanner';
import { Mirage } from 'ldrs/react'; // For the preloader
import 'ldrs/react/Mirage.css'; // Styles for the preloader


export const geistSans = Geist({
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
}>) {
  // The isLoading state for settings is no longer needed here as metadata is handled server-side.
  // The Mirage loader is kept as a general page loading indicator if desired,
  // but it won't be tied to metadata fetching anymore.
  // If you want a persistent loader, you might need a client component with its own state.
  // For now, let's assume a quick initial load or that children handle their own loading states.

  return (
    <html lang="bg">
 <head>
 <link rel="icon" href="/favicon/favicon.ico" sizes="any" />
 <link rel="icon" href="/favicon/icon.svg" type="image/svg+xml" />
 <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" />
 </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        {/* 
          The preloader was here. If you still want a preloader for initial page load
          that hides after the main content is ready, it would need to be a client component
          and manage its visibility state. The metadata fetching doesn't cause a delay here anymore.
        */}
        {/* <div className="flex flex-col items-center justify-center min-h-screen w-full bg-white/80 backdrop-blur-md fixed inset-0 z-50">
          <Mirage size="60" speed="2.5" color="hsl(var(--primary))" />
             Glaura ✨
          </div>
       </div> */}

        <ClientLayoutContent>
        </ClientLayoutContent>

        <main className="flex-1 bg-background">
        </main>
        <Footer />
        <Toaster />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
