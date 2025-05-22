
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile && profile.role === 'admin') {
            setIsAdmin(true);
            setIsLoading(false); // Set loading to false only after confirming admin status
          } else {
            toast({
              title: 'Достъп отказан',
              description: 'Нямате необходимите права за достъп до административния панел.',
              variant: 'destructive',
            });
            router.push('/');
            setIsLoading(false); // Also set loading to false before redirecting
          }
        } catch (error) {
          console.error('Грешка при извличане на потребителски профил за админ проверка:', error);
          toast({
            title: 'Грешка при проверка на правата',
            description: 'Възникна грешка при опит за валидиране на вашите права.',
            variant: 'destructive',
          });
          router.push('/');
          setIsLoading(false); // Also set loading to false on error
        }
      } else {
        toast({
          title: 'Необходимо е удостоверяване',
          description: 'Моля, влезте, за да получите достъп до административния панел.',
          variant: 'default',
        });
        router.push('/login');
        setIsLoading(false); // Set loading to false if no user
      }
    });

    return () => unsubscribe();
  }, [router, toast]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Зареждане на административния панел...</div>;
  }

  if (!isAdmin) {
    // This state should ideally be covered by the redirect in useEffect.
    return <div className="flex justify-center items-center h-screen text-red-500">Достъп отказан. Пренасочване...</div>;
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
