
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
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true); // Set loading to true at the start of the check
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          toast({ title: 'Проверка на потребител', description: 'Потребителят е удостоверен, проверка на ролята...' });
          const profile = await getUserProfile(user.uid);
          if (profile && profile.role === 'admin') {
            toast({ title: 'Достъп разрешен', description: 'Потребителят е администратор.', variant: 'default' });
            setIsAdmin(true);
          } else if (profile) {
            toast({
              title: 'Достъп отказан',
              description: `Ролята на потребителя е '${profile.role || 'недефинирана'}'. Необходима е роля 'admin'. Пренасочване към началната страница.`,
              variant: 'destructive',
            });
            router.push('/');
          } else {
            toast({
              title: 'Грешка при извличане на профил',
              description: 'Не може да се зареди потребителският профил. Пренасочване към началната страница.',
              variant: 'destructive',
            });
            router.push('/');
          }
        } else {
          toast({
            title: 'Необходимо е удостоверяване',
            description: 'Потребителят не е удостоверен. Пренасочване към страницата за вход.',
            variant: 'default',
          });
          router.push('/login');
        }
      } catch (error) {
        console.error('Грешка при проверка на админ права в AdminLayout:', error);
        toast({
          title: 'Грешка при проверка на правата',
          description: 'Възникна грешка при опит за валидиране на вашите права. Пренасочване към началната страница.',
          variant: 'destructive',
        });
        router.push('/');
      } finally {
        setIsLoading(false); // Ensure loading is set to false after all checks
      }
    });

    return () => unsubscribe();
  }, [router, toast]); // Added toast as dependency because it's used

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Зареждане на административния панел...</div>;
  }

  if (!isAdmin) {
    // This state should ideally be covered by the redirect in useEffect,
    // but it's a good fallback. The toasts in useEffect should give more context.
    return <div className="flex justify-center items-center h-screen text-red-500">Проверка на достъпа...</div>;
  }

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
