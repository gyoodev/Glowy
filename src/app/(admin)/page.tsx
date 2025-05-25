// src/app/(admin)/page.tsx (Ultra-simplified for 404 debug)
import React from 'react';

export default function AdminIndexPage() {
  console.log('AdminIndexPage (/admin) attempting to render - ultra simple version 2');
  return (
    <div style={{ border: '2px solid blue', padding: '10px' }}>
      <h1>Admin Panel Index - Ultra Simple</h1>
      <p>If you are seeing this, the /admin route and its basic layout/page are rendering.</p>
      <p>The 404 issue likely stems from the build process on Netlify or a routing misconfiguration there.</p>
    </div>
  );
}
