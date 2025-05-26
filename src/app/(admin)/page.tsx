import React from 'react';

// No 'use client' - this will be a Server Component by default
export default function AdminIndexPage() {
  console.log("AdminIndexPage: RENDERING (ULTRA-SIMPLIFIED, SERVER COMPONENT)");
  return (
    <div style={{ border: '2px dashed blue', padding: '10px', margin: '10px', backgroundColor: '#eeeeff' }}>
      <h2 style={{color: 'blue', fontSize: '20px', fontWeight: 'bold'}}>Simplified Admin Index Page</h2>
      <p>If you see this, the basic routing for /admin and rendering of Server Components for this segment is working.</p>
    </div>
  );
}
