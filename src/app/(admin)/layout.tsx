// src/app/(admin)/layout.tsx (Ultra-simplified for 404 debug)
import type { ReactNode } from 'react';
import React from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  console.log('AdminLayout (/admin) attempting to render - ultra simple version, NO HTML/BODY TAGS');
  return (
    <div style={{ border: '2px solid purple', padding: '10px', margin: '10px', backgroundColor: '#f0f0f0' }}>
      <header style={{ padding: '1rem', backgroundColor: '#ddd', borderBottom: '1px solid #ccc' }}>
        <h1>Ultra-Simple Admin Panel Wrapper</h1>
        <nav>
          <a href="/" style={{ marginRight: '10px' }}>Go to Main Site (Root /)</a>
          <a href="/home" style={{ marginRight: '10px' }}>Go to Salon Directory (/home)</a>
          <a href="/admin" style={{ marginRight: '10px' }}>Admin Index</a>
          <a href="/admin/users" style={{ marginRight: '10px' }}>Admin Users</a>
          <a href="/admin/bookings" style={{ marginRight: '10px' }}>Admin Bookings</a>
          <a href="/admin/business" style={{ marginRight: '10px' }}>Admin Businesses</a>
          <a href="/admin/contacts" style={{ marginRight: '10px' }}>Admin Contacts</a>
          <a href="/admin/newsletter" style={{ marginRight: '10px' }}>Admin Newsletter</a>
        </nav>
      </header>
      <main style={{ padding: '1rem', borderTop: '1px solid #ccc', marginTop: '1rem', backgroundColor: 'white' }}>
        <h2>Admin Content Area:</h2>
        {children}
      </main>
    </div>
  );
}
