
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserProfile } from '@/lib/firebase';
// Removed unused useToast import

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
            // This is a secondary check; AdminLayout should primarily handle this.
            // Consider removing toast here if AdminLayout handles it comprehensively
            // toast({
            //   title: 'Достъп отказан',
            //   description: 'Нямате права за достъп до таблото.',
            //   variant: 'destructive',
            // });
            router.push('/');
          }
        } catch (error) {
          console.error('Грешка при проверка на админ роля в таблото:', error);
          // toast({
          //   title: 'Грешка',
          //   description: 'Възникна грешка при проверка на вашите права.',
          //   variant: 'destructive',
          // });
          router.push('/');
        } finally {
          setLoading(false);
        }
      } else {
        // This is a secondary check.
        // toast({
        //   title: 'Необходимо е удостоверяване',
        //   description: 'Моля, влезте.',
        //   variant: 'default',
        // });
        router.push('/login');
        setLoading(false); // Ensure loading is set to false if user is null
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <div className="container mx-auto py-10 text-center">Зареждане на административното табло...</div>;
  }

  if (!isAdmin) {
    // This should ideally not be reached if AdminLayout is working correctly.
    return <div className="container mx-auto py-10 text-center text-red-500">Достъп отказан. Пренасочване...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Административно табло</h1>
      <p>Добре дошли в административното табло. Тук ще бъдат добавени още функции.</p>
    </div>
  );
}
