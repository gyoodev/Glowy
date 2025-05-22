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
  const [isAuthorized, setIsAuthorized] = useState(false); // Use a dedicated state for authorization
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true); // Explicitly set loading at the start of the effect
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      let authorized = false; // Local variable to determine authorization within this effect run
      try {
        if (user) {
          toast({ title: 'AdminLayout: Потребителят е удостоверен.', description: 'Проверка на ролята...', duration: 2000 });
          const profile = await getUserProfile(user.uid);
          if (profile && profile.role === 'admin') {
            toast({ title: 'AdminLayout: Достъп разрешен.', description: 'Потребителят е администратор.', variant: 'default', duration: 2000 });
            authorized = true;
          } else {
            toast({
              title: 'AdminLayout: Достъп отказан.',
              description: `Ролята на потребителя е '${profile?.role || 'недефинирана'}'. Необходима е роля 'admin'. Пренасочване към началната страница.`,
              variant: 'destructive',
              duration: 5000,
            });
            router.push('/');
          }
        } else {
          toast({
            title: 'AdminLayout: Необходимо е удостоверяване.',
            description: 'Потребителят не е удостоверен. Пренасочване към страницата за вход.',
            variant: 'default',
            duration: 3000,
          });
          router.push('/login');
        }
      } catch (error) {
        console.error('AdminLayout: Грешка при проверка на админ права:', error);
        toast({
          title: 'AdminLayout: Грешка при проверка на правата.',
          description: `Възникна грешка: ${(error as Error).message}. Пренасочване към началната страница.`,
          variant: 'destructive',
          duration: 5000,
        });
        router.push('/');
      } finally {
        setIsAuthorized(authorized); // Update the authorization state
        setIsLoading(false); // Stop loading after all checks and potential redirects
      }
    });

    return () => unsubscribe();
  }, [router, toast]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Зареждане на административния панел...</div>;
  }

  if (!isAuthorized) {
    // If not authorized (and not loading), it means a redirect should have occurred or is in progress.
    // This message is a fallback or will be shown briefly during client-side redirect.
    return <div className="flex justify-center items-center h-screen">Пренасочване... (Проверка на правата)</div>;
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
