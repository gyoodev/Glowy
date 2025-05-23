'use client';

import React, { type ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

// Extremely simplified layout for testing route group rendering
export default function AdminLayout({ children }: AdminLayoutProps) {
  console.log('AdminLayout: Rendering (simplified for 404 debug)');
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-2xl font-bold mb-6">Админ Панел (Тест)</h2>
        <nav>
          <ul>
            <li className="mb-2"><a href="/admin/dashboard">Тест Табло</a></li>
            {/* Add other links here if needed for testing, using simple <a> tags for now */}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 bg-background text-foreground">
        <header className="pb-4 border-b border-gray-300 dark:border-gray-700 mb-6">
          <h1 className="text-3xl font-semibold">Админ Съдържание (Тест)</h1>
        </header>
        {children}
      </main>
    </div>
  );
}