
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Correct import for App Router
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserProfile } from '@/lib/firebase';
// import { useToast } from '@/hooks/use-toast'; // Temporarily removed for simplification

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  // const { toast } = useToast(); // Temporarily removed
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      let authorized = false;
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile && profile.role === 'admin') {
            authorized = true;
          } else {
            // console.warn(`AdminLayout: Access denied. User role: ${profile?.role || 'undefined'}. Redirecting to home.`);
            if (router) router.push('/');
          }
        } catch (error: any) {
          // console.error('AdminLayout: Error fetching profile:', error.message || error);
          if (router) router.push('/');
        }
      } else {
        // User is signed out
        // console.warn('AdminLayout: User not authenticated. Redirecting to login.');
        if (router) router.push('/login');
      }
      
      setIsAuthorized(authorized);
      setIsLoading(false); // Set loading false after all checks and potential redirects
    });

    return () => unsubscribe();
  }, [router]); // Dependency array only includes router

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Зареждане на административния панел...</div>;
  }

  if (!isAuthorized) {
    // This message is shown if not authorized and a redirect is likely in progress or has occurred.
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
