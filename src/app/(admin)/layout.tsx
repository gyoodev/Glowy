
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Corrected import for App Router
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserProfile } from '../../lib/firebase'; // Changed from @/lib/firebase
import { useToast } from '../../hooks/use-toast'; // Changed from @/hooks/use-toast

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    console.log('AdminLayout: useEffect triggered.');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('AdminLayout: onAuthStateChanged triggered. User:', user ? user.uid : 'null');
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          console.log('AdminLayout: Fetched profile:', profile);
          if (profile && profile.role === 'admin') {
            console.log('AdminLayout: User is admin. Authorizing.');
            setIsAuthorized(true);
          } else {
            console.warn(`AdminLayout: Access denied. User role: ${profile?.role || 'undefined'}. Redirecting to home.`);
            // toast({
            //   title: 'Достъп отказан',
            //   description: 'Нямате администраторски права. Пренасочване към началната страница.',
            //   variant: 'destructive',
            // });
            setIsAuthorized(false); // Ensure this is set before redirect
            if (router) router.push('/');
          }
        } catch (error: any) {
          console.error('AdminLayout: Error fetching profile:', error.message || error);
          // toast({
          //   title: 'Грешка при проверка на права',
          //   description: 'Неуспешно извличане на потребителски профил. Пренасочване към началната страница.',
          //   variant: 'destructive',
          // });
          setIsAuthorized(false); // Ensure this is set before redirect
          if (router) router.push('/');
        } finally {
          console.log('AdminLayout: Setting isLoading to false (user authenticated path).');
          setIsLoading(false);
        }
      } else {
        console.warn('AdminLayout: User not authenticated. Redirecting to login.');
        // toast({
        //   title: 'Не сте влезли',
        //   description: 'Моля, влезте, за да получите достъп до административния панел.',
        //   variant: 'default',
        // });
        setIsAuthorized(false);
        setIsLoading(false); // Ensure isLoading is set to false before redirect
        if (router) router.push('/login');
      }
    });

    return () => {
      console.log('AdminLayout: useEffect cleanup.');
      unsubscribe();
    };
  }, [router]); // Removed toast from dependencies

  if (isLoading) {
    console.log('AdminLayout: Rendering loading state.');
    return <div className="flex justify-center items-center h-screen">Зареждане на административния панел... (AdminLayout Loading)</div>;
  }

  if (!isAuthorized) {
    console.log('AdminLayout: Rendering unauthorized state or redirecting.');
    return <div className="flex justify-center items-center h-screen">Нямате достъп или се пренасочвате... (AdminLayout Unauthorized)</div>;
  }

  console.log('AdminLayout: Rendering authorized admin content.');
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-2xl font-bold mb-6">Админ панел</h2>
        <nav>
          <ul>
            <li className="mb-2"><Link href="/admin/dashboard" className="hover:text-gray-300">Табло</Link></li>
            <li className="mb-2"><Link href="/admin/users" className="hover:text-gray-300">Потребители</Link></li>
            <li className="mb-2"><Link href="/admin/business" className="hover:text-gray-300">Бизнеси (Салони)</Link></li>
            <li className="mb-2"><Link href="/admin/bookings" className="hover:text-gray-300">Резервации</Link></li>
            <li className="mb-2"><Link href="/admin/contacts" className="hover:text-gray-300">Запитвания</Link></li>
          </ul>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 bg-background text-foreground">
        <header className="flex justify-between items-center pb-4 border-b border-gray-300 dark:border-gray-700 mb-6">
          <h1 className="text-3xl font-semibold">Административно съдържание</h1>
          {/* You can add user profile/logout for admin here if needed */}
        </header>
        {children}
      </main>
    </div>
  );
}
