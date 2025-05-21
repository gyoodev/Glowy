
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserProfile } from '@/lib/firebase';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { UserProfile, Salon } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit3, Eye, List } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

export default function BusinessManagePage() {
  const [isLoading, setIsLoading] = useState(true); // For initial auth check
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userBusinesses, setUserBusinesses] = useState<Salon[]>([]);
  const [isFetchingBusinesses, setIsFetchingBusinesses] = useState(true);
  const router = useRouter();
  const firestore = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        setIsLoading(false); // Ensure loading stops if no user
      } else {
        const profile = await getUserProfile(user.uid);
        if (!profile || profile.role !== 'business') {
          router.push('/');
          setIsLoading(false); // Ensure loading stops if not business user
        } else {
          setUserProfile(profile);
          // Fetch businesses only after confirming user is a business user
          const businessesCollection = collection(firestore, 'salons');
          const q = query(businessesCollection, where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
          
          try {
            const querySnapshot = await getDocs(q);
            const businesses: Salon[] = [];
            querySnapshot.forEach((doc) => {
              businesses.push({ id: doc.id, ...doc.data() } as Salon);
            });
            setUserBusinesses(businesses);
          } catch (error) {
            console.error("Error fetching businesses:", error);
            // You might want to show a toast or error message here
          } finally {
             setIsFetchingBusinesses(false);
          }
          setIsLoading(false); // Overall auth loading, set here after profile check and business fetch attempt
        }
      }
    });

    return () => unsubscribe();
  }, [router, firestore]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-6 text-center">
        <p>Зареждане на потребителски данни...</p>
        <Skeleton className="h-12 w-1/2 mx-auto mt-4" />
        <Skeleton className="h-8 w-1/3 mx-auto mt-2" />
      </div>
    );
  }

  if (!userProfile) {
    // This case should ideally be handled by the redirects in useEffect
    // Or if loading is done and still no profile (e.g. error fetching profile)
    return (
      <div className="container mx-auto py-10 px-6 text-center">
        <p>Грешка: Неуспешно зареждане на потребителски профил. Моля, опитайте да влезете отново.</p>
      </div>
    );
  }
  
  const salonNameToSlug = (name: string) => name.replace(/\s+/g, '_');

  return (
    <div className="container mx-auto py-10 px-6">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Управление на Бизнеси</h1>
          <p className="text-lg text-muted-foreground">Добре дошли, {userProfile.name}! Тук можете да управлявате Вашите салони.</p>
        </div>
        <Button asChild size="lg">
          <Link href="/business/create">
            <PlusCircle className="mr-2 h-5 w-5" />
            Създай Нов Бизнес
          </Link>
        </Button>
      </header>

      {isFetchingBusinesses ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="shadow-lg">
              <CardHeader>
                <Skeleton className="h-48 w-full rounded-md" />
                <Skeleton className="h-6 w-3/4 mt-4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-2" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : userBusinesses.length === 0 ? (
        <div className="text-center py-20">
          <List className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
          <h2 className="text-2xl font-semibold mb-3">Все още нямате регистрирани бизнеси.</h2>
          <p className="text-muted-foreground mb-6">
            Започнете, като добавите Вашия първи салон или студио.
          </p>
          <Button asChild size="lg">
            <Link href="/business/create">
              <PlusCircle className="mr-2 h-5 w-5" />
              Създай Нов Бизнес
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userBusinesses.map((business) => (
            <Card key={business.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <CardHeader className="p-0">
                <Link href={`/salons/${salonNameToSlug(business.name)}`} aria-label={`Преглед на ${business.name}`}>
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={business.heroImage || 'https://placehold.co/400x200.png'}
                      alt={`Изображение на ${business.name}`}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-t-lg"
                      data-ai-hint="salon exterior modern"
                    />
                  </div>
                </Link>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <Link href={`/salons/${salonNameToSlug(business.name)}`} className="hover:underline">
                  <CardTitle className="mb-2 text-xl font-semibold">{business.name}</CardTitle>
                </Link>
                <CardDescription className="text-sm text-muted-foreground line-clamp-3">
                  {business.description}
                </CardDescription>
              </CardContent>
              <CardFooter className="p-4 border-t flex justify-between items-center">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/salons/${salonNameToSlug(business.name)}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Преглед
                  </Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link href={`/business/edit/${business.id}`}>
 <Edit3 className="mr-2 h-4 w-4" />
                    Редактирай
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
