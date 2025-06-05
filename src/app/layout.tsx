'use client';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { useState, useEffect } from 'react';
import {Footer} from '@/components/layout/footer';
// import { ClerkProvider } from '@clerk/nextjs'; // ClerkProvider removed if not used
import { Header } from '@/components/layout/header';
import { Toaster } from "@/components/ui/toaster"; // Toaster needs to be here for useToast
import { CookieConsentBanner } from '@/components/layout/CookieConsentBanner'; // Import CookieConsentBanner
import '@/lib/gsap'; // Import GSAP setup

import { Mirage } from 'ldrs/react';
import 'ldrs/react/Mirage.css';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set isLoading to false after component mounts
    setIsLoading(false);
  }, []);

  return (
    <html lang="bg">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        {/* Removed LoadingScreenAnimation as per prior discussion (commented out in its file) */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-screen w-full bg-white/80 backdrop-blur-md fixed inset-0 z-50">
             <Mirage size="60" speed="2.5" color="hsl(var(--primary))" />
             <div className="mt-4 text-2xl font-bold text-primary">
               Glowy ✨
             </div>
          </div>
        ) : (
         <>
        <Header />
        <main className="flex-1 bg-background">
          {children}
        </main>
        <Footer />
        <Toaster />
        <CookieConsentBanner />
         </>
        )}
      </body>
    </html>
  );
}
