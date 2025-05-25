import { type ReactNode } from 'react';
// Header and Footer are now provided by RootLayout
// Toaster is also provided by RootLayout

interface DefaultLayoutProps {
  children: ReactNode;
}

export default function DefaultLayout({ children }: DefaultLayoutProps) {
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
