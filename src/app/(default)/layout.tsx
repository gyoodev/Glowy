"use client";
import { type ReactNode, useEffect } from 'react';
// Header and Footer are now provided by RootLayout
import { gsap } from 'gsap';

// Toaster is also provided by RootLayout

interface DefaultLayoutProps {
  children: ReactNode;
}

export default function DefaultLayout({ children }: DefaultLayoutProps) {
  useEffect(() => {
    gsap.fromTo(
      '*',
      { opacity: 0 },
      {
        opacity: 1,
        duration: 2,
        stagger: 0.1,
      }
    );
  }, []);
  return (
    <>
      {/* This layout now primarily passes children through.
          It can be used to add wrappers or context specific to the (default) group 
          that should appear *inside* the main Header/Footer structure. 
          For now, it's just a pass-through.
      */}
      {children}
    </>
  );
}
