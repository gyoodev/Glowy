// src/app/(admin)/page.tsx (Formerly /admin/dashboard/page.tsx)
'use client';
import React from 'react'; // Added explicit React import

// This page now assumes AdminLayout has already verified the user is an admin.
export default function AdminIndexPage() {
  console.log('AdminIndexPage: ATTEMPTING TO RENDER (ULTRA-SIMPLIFIED)');
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Минимално Табло - Админ Начало</h1>
      <p>Ако виждате това, значи /admin/page.tsx и /admin/layout.tsx се рендират.</p>
      <p className="mt-4 text-red-500">Това е главната страница на административния панел.</p>
    </div>
  );
}
