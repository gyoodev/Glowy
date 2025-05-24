
'use client';

import React, { type ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, getUserProfile } from '@/lib/firebase'; // Corrected relative path
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
// Removed toast import as it's not used after simplification
import { PanelLeft, Users, Briefcase, CalendarCheck, Mail, Newspaper, LayoutDashboard } from 'lucide-react'; // Added Newspaper for Newsletter

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    console.log('AdminLayout: useEffect triggered');
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      console.log('AdminLayout: onAuthStateChanged, user:', user ? user.uid : 'null');
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          console.log('AdminLayout: Fetched profile:', profile);
          if (profile && profile.role === 'admin') {
            console.log('AdminLayout: User is admin. Authorizing access.');
            setIsAuthorized(true);
          } else {
            console.warn('AdminLayout: User is not admin or profile not found. Role:', profile?.role);
            router.push('/');
            setIsAuthorized(false);
          }
        } catch (error) {
          console.error('AdminLayout: Error fetching user profile:', error);
          router.push('/');
          setIsAuthorized(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log('AdminLayout: No user authenticated. Redirecting to login.');
        router.push('/login');
        setIsAuthorized(false);
        setIsLoading(false);
      }
    });

    return () => {
      console.log('AdminLayout: useEffect cleanup');
      unsubscribe();
    };
  }, [router]);

  if (isLoading) {
    console.log('AdminLayout: Rendering loading state...');
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <p className="text-lg">Зареждане на административен панел...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    console.log('AdminLayout: Rendering unauthorized state (should have redirected)...');
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <p className="text-lg text-destructive">Нямате достъп или се пренасочвате...</p>
      </div>
    );
  }

  console.log('AdminLayout: Rendering authorized admin content.');
  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-64 bg-card p-4 shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-primary flex items-center">
          <PanelLeft className="mr-2 h-6 w-6" /> Админ Панел
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
        {/* Header removed as it's implicit in the page content being wrapped */}
        {children}
      </main>
    </div>
  );
}
