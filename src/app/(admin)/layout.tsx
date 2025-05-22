
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Corrected import for App Router
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserProfile } from '@/lib/firebase';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
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
            setIsAuthorized(false);
            router.push('/');
          }
        } catch (error: any) {
          console.error('AdminLayout: Error fetching profile:', error.message || error);
          setIsAuthorized(false);
          router.push('/');
        } finally {
          console.log('AdminLayout: Setting isLoading to false (user authenticated path).');
          setIsLoading(false);
        }
      } else {
        console.warn('AdminLayout: User not authenticated. Redirecting to login.');
        setIsAuthorized(false);
        console.log('AdminLayout: Setting isLoading to false (user not authenticated path).');
        setIsLoading(false); // Ensure isLoading is set to false before redirect
        router.push('/login');
      }
    });

    return () => {
      console.log('AdminLayout: useEffect cleanup.');
      unsubscribe();
    };
  }, [router]); // router dependency is correct

  if (isLoading) {
    console.log('AdminLayout: Rendering loading state.');
    return <div className="flex justify-center items-center h-screen">Зареждане на административния панел... (AdminLayout Loading)</div>;
  }

  if (!isAuthorized) {
    console.log('AdminLayout: Rendering unauthorized state or redirecting.');
    // This message is shown if not authorized AND a redirect is likely in progress or has occurred.
    return <div className="flex justify-center items-center h-screen">Нямате достъп или се пренасочвате... (AdminLayout Unauthorized)</div>;
  }

  // If loading is false and isAuthorized is true, render the layout
  console.log('AdminLayout: Rendering authorized admin content.');
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
