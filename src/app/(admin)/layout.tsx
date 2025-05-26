// This is now a Server Component by default (no 'use client')
import React, { type ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  console.log('ADMIN LAYOUT (/admin/layout.tsx): Attempting to render as a Server Component. Timestamp:', new Date().toISOString());

  return (
    <html lang="bg">
      <body>
        <div style={{ border: '2px solid red', padding: '20px', margin: '20px' }}>
          <h1 style={{ color: 'red', fontSize: '24px' }}>Admin Layout (Server Component Test)</h1>
          <nav style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
            <a href="/admin" style={{ marginRight: '10px' }}>Admin Home (Test)</a>
            {/* Add other basic links here if needed for testing, ensure they are simple hrefs for now */}
          </nav>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
