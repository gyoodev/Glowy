import React from 'react';

// No 'use client' - this will be a Server Component by default
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  console.log("AdminLayout: RENDERING (ULTRA-SIMPLIFIED, SERVER COMPONENT)");
  return (
    <div style={{ border: '2px dashed red', padding: '10px', margin: '10px', backgroundColor: '#ffeeee' }}>
      <h1 style={{color: 'red', fontSize: '24px', fontWeight: 'bold'}}>Simplified Admin Layout Shell</h1>
      <nav>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', gap: '10px', margin: '10px 0' }}>
          <li style={{padding: '5px', backgroundColor: '#ddd'}}>Admin Nav Link 1 (Static)</li>
          <li style={{padding: '5px', backgroundColor: '#ddd'}}>Admin Nav Link 2 (Static)</li>
        </ul>
      </nav>
      <hr style={{ margin: '10px 0', borderColor: 'red' }} />
      <main>{children}</main>
    </div>
  );
}
