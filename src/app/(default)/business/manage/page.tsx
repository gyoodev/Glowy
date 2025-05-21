
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
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userBusinesses, setUserBusinesses] = useState<Salon[]>([]);
  const [isFetchingBusinesses, setIsFetchingBusinesses] = useState(true);
  const router = useRouter();
  const firestore = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login'); // Redirect to login if not authenticated
      } else {
        const profile = await getUserProfile(user.uid);
        if (!profile || profile.role !== 'business') {
          router.push('/'); // Redirect to homepage if not a business user
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
            // Handle error (e.g., show toast)
          } finally {
             setIsFetchingBusinesses(false);
          }
        }
      }
      setIsLoading(false); // Overall auth loading
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
    // This case should ideally be handled by the redirect, but as a fallback
    return (
      <div className="container mx-auto py-10 px-6 text-center">
        <p>Грешка: Неуспешно зареждане на потребителски профил. Моля, опитайте да влезете отново.</p>
      </div>
    );
  }

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
        <div className="text-center py-12 bg-card rounded-lg shadow-md">
          <List className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-2xl font-semibold text-foreground mb-2">Все още нямате създадени бизнеси</h3>
          <p className="text-muted-foreground mb-6">Започнете, като добавите Вашия първи салон.</p>
          <Button asChild>
            <Link href="/business/create">
              <PlusCircle className="mr-2 h-5 w-5" />
              Създай Първия си Бизнес
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userBusinesses.map((business) => (
            <Card key={business.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <CardHeader className="p-0">
                <Link href={`/salons/${business.id}`} aria-label={`Преглед на ${business.name}`}>
                  <div className="relative h-48 w-full">
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
                <Link href={`/salons/${business.id}`} className="hover:underline">
                  <CardTitle className="mb-2 text-xl font-semibold">{business.name}</CardTitle>
                </Link>
                <CardDescription className="text-sm text-muted-foreground line-clamp-3">
                  {business.description}
                </CardDescription>
              </CardContent>
              <CardFooter className="p-4 border-t flex justify-between items-center">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/salons/${business.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Преглед
                  </Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  {/* TODO: Implement edit page for businesses /business/edit/[businessId] */}
                  <Link href={`#`}> {/* Replace # with actual edit link */}
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
