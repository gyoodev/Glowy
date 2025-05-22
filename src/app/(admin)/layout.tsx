
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserProfile } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      let newAuthorizedState = false;
      try {
        if (user) {
          // toast({ title: 'AdminLayout: User authenticated.', description: `UID: ${user.uid}`, duration: 1500 });
          const profile = await getUserProfile(user.uid);
          if (profile && profile.role === 'admin') {
            // toast({ title: 'AdminLayout: Достъп разрешен.', description: 'Потребителят е администратор.', duration: 1500 });
            newAuthorizedState = true;
          } else {
            console.warn(`AdminLayout: Access denied. User role: ${profile?.role || 'undefined'}. Redirecting to home.`);
            // toast({ title: 'AdminLayout: Достъп отказан.', description: 'Не сте администратор. Пренасочване към начална страница.', variant: 'destructive', duration: 3000 });
            if (router.pathname !== '/') {
              router.push('/');
            }
          }
        } else {
          // User is signed out
          console.warn('AdminLayout: User not authenticated. Redirecting to login.');
          // toast({ title: 'AdminLayout: Не сте удостоверени.', description: 'Пренасочване към страница за вход.', duration: 3000 });
          if (router.pathname !== '/login') {
            router.push('/login');
          }
        }
      } catch (error: any) {
        console.error('AdminLayout: Error during auth check:', error.message || error);
        // toast({ // Temporarily commenting out toast in catch to reduce complexity
        //   title: 'AdminLayout: Грешка при проверка на правата.',
        //   description: `Възникна грешка при удостоверяване. Моля, опитайте отново. (${error.message || 'Неизвестна грешка'})`,
        //   variant: 'destructive',
        //   duration: 5000,
        // });
        if (router.pathname !== '/') {
          router.push('/');
        }
      } finally {
        setIsAuthorized(newAuthorizedState);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]); // Removed toast from dependency array

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Зареждане на административния панел...</div>;
  }

  if (!isAuthorized) {
    // This state implies a redirect should have already been initiated or is in progress.
    // Or the user simply isn't authorized and an error message is displayed.
    // This could be the "error on dashboard page check auth" message if interpreted by user.
    return <div className="flex justify-center items-center h-screen">Нямате достъп или се пренасочвате...</div>;
  }

  // If loading is false and isAuthorized is true, render the layout
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-2xl font-bold mb-6">Админ панел</h2>
        <nav>
          <ul>
            <li className="mb-2"><Link href="/admin/dashboard" className="hover:text-gray-300">Табло</Link></li>
            <li className="mb-2"><Link href="/admin/users" className="hover:text-gray-300">Потребители</Link></li>
            <li className="mb-2"><Link href="/admin/salons" className="hover:text-gray-300">Салони</Link></li>
            <li className="mb-2"><Link href="/admin/bookings" className="hover:text-gray-300">Резервации</Link></li>
            <li className="mb-2"><Link href="/admin/contacts" className="hover:text-gray-300">Запитвания</Link></li>
          </ul>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        <header className="flex justify-between items-center pb-4 border-b border-gray-300 mb-6">
          <h1 className="text-3xl font-semibold">Административно съдържание</h1>
        </header>
        {children}
      </main>
    </div>
  );
}
