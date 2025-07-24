'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// The Header component is now rendered completely on the client.
// This means it won't contribute to the initial server-rendered HTML,
// which can improve the "Time to First Byte" (TTFB) and "First Contentful Paint" (FCP).
// It will be loaded and rendered by the client-side JavaScript bundle.
const Header = dynamic(() => import('@/components/layout/header').then(mod => mod.Header), {
  ssr: false,
  loading: () => <header className="h-16 border-b" />, // Simple placeholder during load
});


interface ClientLayoutContentProps {
  children: React.ReactNode;
}

const ClientLayoutContent: React.FC<ClientLayoutContentProps> = ({ children }) => {
  return (
    <>
      <Header />
      {children}
    </>
  );
};

export default ClientLayoutContent;
