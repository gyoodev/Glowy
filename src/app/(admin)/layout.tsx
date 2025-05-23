
'use client';

import React, { type ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Changed from 'next/router'
import { auth, getUserProfile } from '@/lib/firebase'; // Changed to alias
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
// import { useToast } from '@/hooks/use-toast'; // No longer using toast here for simplicity

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  // const { toast } = useToast(); // No longer using toast here
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
            // toast({ title: 'Достъп отказан', description: 'Само администратори имат достъп до този панел.', variant: 'destructive' });
            router.push('/'); // Redirect to homepage if not admin
            setIsAuthorized(false);
          }
        } catch (error) {
          console.error('AdminLayout: Error fetching user profile:', error);
          // toast({ title: 'Грешка', description: 'Грешка при проверка на правата за достъп.', variant: 'destructive' });
          router.push('/'); // Redirect on error
          setIsAuthorized(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log('AdminLayout: No user authenticated. Redirecting to login.');
        // toast({ title: 'Необходимо е удостоверяване', description: 'Моля, влезте като администратор.', variant: 'default' });
        router.push('/login'); // Redirect to login if not authenticated
        setIsAuthorized(false);
        setIsLoading(false); // Ensure loading is false even if no user
      }
    });

    return () => {
      console.log('AdminLayout: useEffect cleanup');
      unsubscribe();
    };
  }, [router]); // Removed toast from dependency array

  if (isLoading) {
    console.log('AdminLayout: Rendering loading state...');
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <p className="text-lg">Зареждане на административен панел...</p>
        {/* You can add a spinner or skeleton loader here */}
      </div>
    );
  }

  if (!isAuthorized) {
    console.log('AdminLayout: Rendering unauthorized state (should have redirected)...');
    // This state should ideally not be reached if redirects work,
    // but it's a fallback.
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
        <h2 className="text-2xl font-bold mb-6 text-primary">Админ Панел</h2>
        <nav className="space-y-2">
          <Link href="/admin/dashboard" className="block py-2 px-3 rounded-md hover:bg-muted transition-colors">
            Табло
          </Link>
          <Link href="/admin/users" className="block py-2 px-3 rounded-md hover:bg-muted transition-colors">
            Потребители
          </Link>
          <Link href="/admin/business" className="block py-2 px-3 rounded-md hover:bg-muted transition-colors">
            Бизнеси (Салони)
          </Link>
          <Link href="/admin/bookings" className="block py-2 px-3 rounded-md hover:bg-muted transition-colors">
            Резервации
          </Link>
          <Link href="/admin/contacts" className="block py-2 px-3 rounded-md hover:bg-muted transition-colors">
            Запитвания
          </Link>
          {/* Add other admin links here */}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <header className="pb-4 border-b border-border mb-6">
          {/* Dynamic header title could be set via context or page props if needed */}
          <h1 className="text-3xl font-semibold">Административно Съдържание</h1>
        </header>
        {children}
      </main>
    </div>
  );
}
