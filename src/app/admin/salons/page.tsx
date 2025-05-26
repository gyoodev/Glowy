
'use client';

import React from 'react';

// This page is currently a placeholder.
// For actual salon management, you might want to redirect to /admin/business,
// or implement specific admin-only salon management features here.
export default function AdminSalonsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Админ - Управление на Салони</h1>
      <p className="text-muted-foreground">
        Тази страница е заместител. Основното управление на бизнеси (салони) се намира в{' '}
        <a href="/admin/business" className="text-primary hover:underline">
          Управление на бизнеси (Салони)
        </a>.
      </p>
      {/* Future content for admin-specific salon management if different from business owner view */}
    </div>
  );
}
