'use client';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { useState, useEffect, StrictMode } from 'react';
import {Footer} from '@/components/layout/footer';
// import { ClerkProvider } from '@clerk/nextjs'; // ClerkProvider removed if not used
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
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

interface WebsiteSettings {
  siteName?: string;
  siteDescription?: string;
  siteKeywords?: string;
  siteAuthor?: string;
}

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
  const [settings, setSettings] = useState<WebsiteSettings>({});
  const [isLoading, setIsLoading] = useState(true);

  const firestore = getFirestore(auth.app);
  const settingsDocRef = doc(firestore, 'settings', 'websiteSettings');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as WebsiteSettings);
        } else {
          console.log("No settings document found, using defaults for metatags.");
        }
      } catch (error) {
        console.error('Error fetching settings for metatags:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [settingsDocRef]);

  const { siteName = 'Glowy ✨', siteDescription = 'Your favorite salon and beauty service booking platform.', siteKeywords = 'salon, beauty, booking, appointments', siteAuthor = 'Glowy' } = settings;



  return (
    <html lang="bg">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        {/* Removed LoadingScreenAnimation as per prior discussion (commented out in its file) */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-screen w-full bg-white/80 backdrop-blur-md fixed inset-0 z-50">
             <Mirage size="60" speed="2.5" color="hsl(var(--primary))" />
             <title>{siteName}</title>
             <meta name="description" content={siteDescription} />
             <meta name="keywords" content={siteKeywords} />
             <meta name="author" content={siteAuthor} />
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
