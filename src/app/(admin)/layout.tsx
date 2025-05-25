// src/app/(admin)/layout.tsx (Ultra-simplified for 404 debug)
import type { ReactNode } from 'react';
import React from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  console.log('AdminLayout (/admin) attempting to render - ultra simple version 2');
  return (
    <html lang="bg">
      <body>
        <div style={{ border: '2px solid red', padding: '10px', minHeight: '100vh' }}>
          <header style={{ padding: '1rem', backgroundColor: '#eee', borderBottom: '1px solid #ddd' }}>
            <h1>Ultra-Simple Admin Panel Header</h1>
            <p><a href="/">Go to Main Site (Root /)</a></p>
            <p><a href="/home">Go to Salon Directory (/home)</a></p>
          </header>
          <main style={{ padding: '1rem', borderTop: '1px solid #ddd', marginTop: '1rem' }}>
            <h2>Admin Content Area:</h2>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
