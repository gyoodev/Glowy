"use client";
import { type ReactNode, useEffect } from 'react';
// Header and Footer, and Toaster are now provided by RootLayout
// The GSAP import is no longer needed as it's not being used.
// import '@/lib/gsap'; 
//
// Toaster is also provided by RootLayout

interface DefaultLayoutProps {
  children: ReactNode;
}

export default function DefaultLayout({ children }: DefaultLayoutProps) {
  // useEffect logic for GSAP animations is removed
  return (
    <>
      {/* This layout primarily passes children through.
          It can be used to add wrappers or context specific to the (default) group 
          that should appear *inside* the main Header/Footer structure. 
          For now, it's just a pass-through.
      */}
      {children}
    </>
  );
}
