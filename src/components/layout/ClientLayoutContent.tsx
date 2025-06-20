'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const ClientDynamicHeader = dynamic(() => import('@/components/layout/ClientDynamicHeader'), { ssr: false });

interface ClientLayoutContentProps {
  children: React.ReactNode;
}

const ClientLayoutContent: React.FC<ClientLayoutContentProps> = ({ children }) => {
  return (
    <>
      <ClientDynamicHeader />
      {children}
    </>
  );
};

export default ClientLayoutContent;