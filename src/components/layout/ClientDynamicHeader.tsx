
'use client';

import dynamic from 'next/dynamic';

// Dynamically import the actual Header component with ssr: false
const Header = dynamic(() => import('@/components/layout/header'), { ssr: false });

export default function ClientDynamicHeader() {
  // This client component simply renders the dynamically imported Header
  return <Header />;
}
