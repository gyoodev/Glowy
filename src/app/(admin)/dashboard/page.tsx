'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserProfile } from '@/lib/firebase';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userProfile = await getUserProfile(user.uid);
          if (userProfile?.role === 'admin') {
            setIsAdmin(true);
          } else {
            router.push('/'); // Redirect non-admins
          }
        } catch (error) {
          console.error('Error checking admin role:', error);
          router.push('/'); // Redirect on error
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/login'); // Redirect if not logged in
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <div>Loading admin panel...</div>; // Basic loading state
  }

  if (!isAdmin) {
    return null; // Or a specific "Access Denied" component if you prefer
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      {/* Admin dashboard content goes here */}
      <p>Welcome to the admin dashboard. More features will be added here.</p>
    </div>
  );
}