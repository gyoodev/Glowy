// This is a drastically simplified layout for debugging the 404 issue.
// It removes all authentication and client-side hooks.
import type { ReactNode } from 'react';
import React from 'react'; // Added explicit React import
import Link from 'next/link';
import { PanelLeft, Users, Briefcase, CalendarCheck, Mail, Newspaper, LayoutDashboard } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  console.log('AdminLayout: Rendering (ultra-simplified for 404 debug)');

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-64 bg-card p-4 shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-primary flex items-center">
          <PanelLeft className="mr-2 h-6 w-6" /> Админ Панел (Debug)
        </h2>
        <nav className="space-y-1">
          <Link href="/admin/dashboard" className="flex items-center py-2.5 px-3 rounded-md hover:bg-muted transition-colors text-sm">
            <LayoutDashboard className="mr-2 h-4 w-4" /> Табло
          </Link>
          <Link href="/admin/users" className="flex items-center py-2.5 px-3 rounded-md hover:bg-muted transition-colors text-sm">
            <Users className="mr-2 h-4 w-4" /> Потребители
          </Link>
          <Link href="/admin/business" className="flex items-center py-2.5 px-3 rounded-md hover:bg-muted transition-colors text-sm">
            <Briefcase className="mr-2 h-4 w-4" /> Бизнеси (Салони)
          </Link>
          <Link href="/admin/bookings" className="flex items-center py-2.5 px-3 rounded-md hover:bg-muted transition-colors text-sm">
            <CalendarCheck className="mr-2 h-4 w-4" /> Резервации
          </Link>
          <Link href="/admin/contacts" className="flex items-center py-2.5 px-3 rounded-md hover:bg-muted transition-colors text-sm">
            <Mail className="mr-2 h-4 w-4" /> Запитвания
          </Link>
          <Link href="/admin/newsletter" className="flex items-center py-2.5 px-3 rounded-md hover:bg-muted transition-colors text-sm">
            <Newspaper className="mr-2 h-4 w-4" /> Бюлетин
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
