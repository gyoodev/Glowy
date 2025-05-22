'use client';

import React from 'react';

// This page now assumes AdminLayout has already verified the user is an admin.
export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Административно табло</h1>
      <p>Добре дошли в административното табло. Тук ще бъдат добавени още функции.</p>
      {/* Test content to ensure the page itself can render if reached */}
      <p className="mt-4 p-4 border border-dashed border-primary text-primary">
        Ако виждате това, значи страницата /admin/dashboard/page.tsx се рендира.
        Проблемът с 404 вероятно е свързан с билд процеса в Netlify или с рутирането.
      </p>
    </div>
  );
}
