
import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from "@/components/ui/toaster";
import { CookieConsentBanner } from '@/components/layout/CookieConsentBanner';
import '@/lib/gsap'; // Import GSAP setup

import { Mirage } from 'ldrs/react'; // For the preloader
import 'ldrs/react/Mirage.css'; // Styles for the preloader


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Dynamically generate metadata by fetching from Firestore
export async function generateMetadata(): Promise<Metadata> {
  const firestore = getFirestore(auth.app);
  const settingsRef = doc(firestore, 'settings', 'websiteSettings');
  let settingsData: Record<string, any> = {};

  try {
    const snapshot = await getDoc(settingsRef);
    if (snapshot.exists()) {
      settingsData = snapshot.data();
    } else {
      console.log("Metadata: No 'websiteSettings' document found in Firestore. Using fallback values.");
    }
  } catch (error) {
    console.error('Metadata: Error fetching website settings from Firestore:', error);
    // Fallback to default settings if Firestore fetch fails
  }

  const siteTitle = settingsData.siteName || 'Glowy ✨';
  const siteDescriptionText = settingsData.siteDescription || 'Открийте най-добрите салони за красота и услуги близо до Вас.';
  const siteKeywordsText = settingsData.siteKeywords || 'салон, красота, резервации, маникюр, фризьор, спа';
  const siteAuthorText = settingsData.siteAuthor || 'Glowy';
  const canonicalUrlLink = settingsData.canonicalUrl || 'https://glowy.netlify.app/'; // Make sure your PRD/requirements state this URL
  const ogImageUrl = settingsData.ogImage || 'https://glowy.netlify.app/og-image.jpg'; // Default OG image

  return {
    title: siteTitle,
    description: siteDescriptionText,
    keywords: siteKeywordsText,
    authors: [{ name: siteAuthorText }],
    openGraph: {
      title: settingsData.ogTitle || siteTitle,
      description: settingsData.ogDescription || siteDescriptionText,
      url: canonicalUrlLink,
      images: ogImageUrl ? [{ url: ogImageUrl }] : [],
      type: 'website', // Common practice to specify OG type
    },
    twitter: {
      card: (settingsData.twitterCard as "summary" | "summary_large_image" | "app" | "player") || 'summary_large_image',
      title: settingsData.twitterTitle || settingsData.ogTitle || siteTitle,
      description: settingsData.twitterDescription || settingsData.ogDescription || siteDescriptionText,
      images: ogImageUrl ? [ogImageUrl] : [],
    },
    alternates: {
      canonical: canonicalUrlLink,
    },
    // Add other metadata fields as needed, e.g., icons
    // icons: {
    //   icon: '/favicon.ico', // Example
    //   apple: '/apple-touch-icon.png', // Example
    // },
  };
}


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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        {/* 
          The preloader was here. If you still want a preloader for initial page load
          that hides after the main content is ready, it would need to be a client component
          and manage its visibility state. The metadata fetching doesn't cause a delay here anymore.
        */}
        {/* <div className="flex flex-col items-center justify-center min-h-screen w-full bg-white/80 backdrop-blur-md fixed inset-0 z-50">
           <Mirage size="60" speed="2.5" color="hsl(var(--primary))" />
           <div className="mt-4 text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
             Glowy ✨
           </div>
        </div> */}
        
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
