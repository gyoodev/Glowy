'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserProfile } from '@/lib/firebase';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile && profile.role === 'admin') {
            setIsAdmin(true);
          } else {
            router.push('/'); // Redirect non-admins
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          router.push('/'); // Redirect on error
        } finally {
          setIsLoading(false);
        }
      } else {
        router.push('/'); // Redirect if not authenticated
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    // This case should ideally be handled by the redirect in useEffect,
    // but keeping a fallback message or component here is good practice.
    return <div className="flex justify-center items-center h-screen text-red-500">Access Denied</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Basic Admin Sidebar Placeholder */}
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
        <nav>
          <ul>
            <li className="mb-2"><Link href="/admin/dashboard" className="hover:text-gray-300">Dashboard</Link></li>
            <li className="mb-2"><Link href="/admin/users" className="hover:text-gray-300">Users</Link></li>
            <li className="mb-2"><Link href="/admin/salons" className="hover:text-gray-300">Salons</Link></li>
            <li className="mb-2"><Link href="/admin/bookings" className="hover:text-gray-300">Bookings</Link></li>
            <li className="mb-2"><Link href="/admin/contacts" className="hover:text-gray-300">Contact Entries</Link></li>
            {/* Add more admin navigation links here */}
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Basic Admin Header Placeholder */}
        <header className="flex justify-between items-center pb-4 border-b border-gray-300 mb-6">
          <h1 className="text-3xl font-semibold">Admin Content</h1>
          {/* Add admin header elements here */}
        </header>
        {children}
      </main>
    </div>
  );
}
