'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// The Header component is now rendered on the server, but its interactive parts can be client components.
import { Header } from '@/components/layout/header';


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
