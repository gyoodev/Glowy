// This is now a Server Component by default (no 'use client')
import React from 'react';

export default function AdminIndexPage() {
  console.log('ADMIN INDEX PAGE (/admin/page.tsx): Attempting to render as a Server Component. Timestamp:', new Date().toISOString());

  return (
    <div style={{ border: '2px solid blue', padding: '20px', margin: '20px' }}>
      <h1 style={{ color: 'blue', fontSize: '24px' }}>Admin Index Page (Server Component Test)</h1>
      <p>If you see this, the /admin route is working with a Server Component.</p>
    </div>
  );
}
