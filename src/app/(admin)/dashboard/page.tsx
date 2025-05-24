
// src/app/(admin)/dashboard/page.tsx (Ultra-simplified for 404 debug - v2)
import React from 'react'; // Explicitly import React

export default function AdminDashboardPage() {
  console.log('AdminDashboardPage: ATTEMPTING TO RENDER (ULTRA-SIMPLIFIED)');
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Минимално Табло</h1>
      <p>Ако виждате това, значи /admin/dashboard/page.tsx и /admin/layout.tsx се рендират.</p>
      <p className="mt-4 text-red-500">Ако все още получавате 404, проблемът е най-вероятно в Netlify build/routing конфигурацията.</p>
    </div>
  );
}
