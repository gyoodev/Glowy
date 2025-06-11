
'use client';

import dynamic from 'next/dynamic';

// Dynamically import the actual Header component with ssr: false
// and ensure the named export 'Header' is correctly resolved.
const Header = dynamic(() => import('@/components/layout/header').then((mod) => mod.Header), { ssr: false });

export default function ClientDynamicHeader() {
  // This client component simply renders the dynamically imported Header
  return <Header />;
}
