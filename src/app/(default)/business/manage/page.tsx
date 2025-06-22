
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserProfile } from '@/lib/firebase';
import { getFirestore, collection, query, where, getDocs, orderBy, Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import type { UserProfile, Salon, Booking } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Edit3, Eye, List, CalendarCheck, Gift, MessageSquareText, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subMonths, startOfMonth } from 'date-fns';
import { Scissors, CalendarDays } from 'lucide-react'; // Import from lucide-react
import { bg } from 'date-fns/locale';
import { mapSalon, mapBooking } from '@/utils/mappers';

const NUM_MONTHS_FOR_CHARTS = 6; // Display data for the last 6 months

export default function BusinessManagePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userBusinesses, setUserBusinesses] = useState<Salon[]>([]);
  const [isFetchingBusinesses, setIsFetchingBusinesses] = useState(true);
  
  const [totalMonthlyReservationsData, setTotalMonthlyReservationsData] = useState<Array<{ month: string, count: number }>>([]);
  const [perSalonMonthlyReservationsData, setPerSalonMonthlyReservationsData] = useState<Record<string, Array<{ month: string, count: number }>>>({});
  const [loadingCharts, setLoadingCharts] = useState(true);

  const router = useRouter();
  const firestore = getFirestore();

  const monthYearFormatter = (date: Date) => format(date, 'LLL yy', { locale: bg });

  const generateMonthlyPlaceholders = (numMonths: number) => {
    const placeholders = [];
    for (let i = numMonths - 1; i >= 0; i--) {
      placeholders.push({ month: monthYearFormatter(subMonths(new Date(), i)), count: 0 });
    }
    return placeholders;
  };
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        setIsLoading(false);
        setIsFetchingBusinesses(false);
        setLoadingCharts(false);
      } else {
        const profile = await getUserProfile(user.uid);
        if (!profile || profile.role !== 'business') {
          router.push('/');
          setIsLoading(false);
          setIsFetchingBusinesses(false);
          setLoadingCharts(false);
        } else {
          setUserProfile(profile);
          setIsLoading(false); 
          
          // Fetch Businesses
          setIsFetchingBusinesses(true);
          const businessesCollection = collection(firestore, 'salons');
          const q = query(businessesCollection, where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
          
          try {
            const querySnapshot = await getDocs(q);
            const businesses: Salon[] = querySnapshot.docs.map(doc => mapSalon(doc.data(), doc.id));
            setUserBusinesses(businesses);

            if (businesses.length > 0) {
              setLoadingCharts(true);
              const salonIds = businesses.map(b => b.id);
              const bookingsRef = collection(firestore, 'bookings');
              const bookingsQuery = query(bookingsRef, where('salonId', 'in', salonIds));
              const bookingsSnapshot = await getDocs(bookingsQuery);
              const allBookings: Booking[] = bookingsSnapshot.docs.map(docSnap => mapBooking(docSnap.data()));

              const monthlyPlaceholders = generateMonthlyPlaceholders(NUM_MONTHS_FOR_CHARTS);

              const aggregatedTotal: Record<string, number> = {};
              allBookings.forEach(booking => {
                if (booking.createdAt) { // createdAt is string from mapper
                  try {
                    const date = new Date(booking.createdAt); 
                    if (!isNaN(date.getTime())) {
                      const monthKey = monthYearFormatter(date);
                      aggregatedTotal[monthKey] = (aggregatedTotal[monthKey] || 0) + 1;
                    }
                  } catch (e) { console.warn("Error parsing booking date for total chart", e); }
                }
              });
              setTotalMonthlyReservationsData(
                monthlyPlaceholders.map(p => ({ ...p, count: aggregatedTotal[p.month] || 0 }))
              );

              const perSalonAggregated: Record<string, Array<{ month: string, count: number }>> = {};
              businesses.forEach(salon => {
                const salonBookings = allBookings.filter(b => b.salonId === salon.id);
                const aggregatedSalonBookings: Record<string, number> = {};
                salonBookings.forEach(booking => {
                  if (booking.createdAt) { // createdAt is string
                    try {
                      const date = new Date(booking.createdAt);
                      if (!isNaN(date.getTime())) {
                        const monthKey = monthYearFormatter(date);
                        aggregatedSalonBookings[monthKey] = (aggregatedSalonBookings[monthKey] || 0) + 1;
                      }
                    } catch (e) { console.warn("Error parsing booking date for salon chart", e); }
                  }
                });
                perSalonAggregated[salon.id] = monthlyPlaceholders.map(p => ({ ...p, count: aggregatedSalonBookings[p.month] || 0 }));
              });
              setPerSalonMonthlyReservationsData(perSalonAggregated);
              setLoadingCharts(false);
            } else {
              setLoadingCharts(false); 
            }

          } catch (error) {
            console.error("Error fetching businesses or bookings:", error);
            setLoadingCharts(false);
          } finally {
             setIsFetchingBusinesses(false);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [router, firestore]);

  const salonNameToSlug = (name?: string) => name ? name.replace(/\s+/g, '_') : 'unknown-salon';

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
    return (
      <div className="container mx-auto py-10 px-6 text-center">
        <p>Грешка: Неуспешно зареждане на потребителски профил. Моля, опитайте да влезете отново.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10 px-6">
      {!isFetchingBusinesses && userBusinesses.length === 0 ? (
        <div className="text-center py-20">
          <List className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
          <h2 className="text-2xl font-semibold mb-3">Все още нямате регистрирани бизнеси.</h2>
          <p className="text-muted-foreground mb-6">
            Започнете, като добавите Вашия първи салон или студио.
          </p>
          <Button asChild size="lg">
            <Link href="/business/create">
              <PlusCircle className="mr-2 h-5 w-5" />
              Създай Първия си Бизнес
            </Link>
          </Button>
        </div>
      ) : (
        <>
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
                  <CardFooter className="flex justify-between flex-wrap gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {userBusinesses.length > 0 && (
                <Card className="mb-8 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                      Общо месечни резервации (за всички ваши салони)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px] p-4">
                    {loadingCharts ? <p>Зареждане на диаграма...</p> : totalMonthlyReservationsData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={totalMonthlyReservationsData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip
                            cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem' }}
                            labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                          />
                          <Legend iconSize={10} wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                          <Bar dataKey="count" fill="hsl(var(--primary))" name="Резервации" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-center text-muted-foreground">Няма данни за резервации.</p>}
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-8">
                {userBusinesses.map((business) => (
                  <div key={business.id} className="space-y-0"> {/* Removed space-y-4 to put chart dialog inside card footer */}
                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
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
                      <CardFooter className="p-4 border-t flex flex-wrap justify-start items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/salons/${salonNameToSlug(business.name)}`}>
                            <Eye className="mr-2 h-4 w-4" /> Преглед
                          </Link>
                        </Button>
                        <Button variant="default" size="sm" asChild>
                          <Link href={`/business/edit/${business.id}`}>
                            <Edit3 className="mr-2 h-4 w-4" /> Редактирай
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/business/manage/${business.id}/services`}>
                            <Scissors className="mr-2 h-4 w-4" /> Услуги
                          </Link>
                        </Button>
                         <Button variant="outline" size="sm" asChild>
                          <Link href={`/business/manage/${business.id}/availability`}>
                            <CalendarDays className="mr-2 h-4 w-4" /> Наличност
                          </Link>
                        </Button>
                        <Button variant="secondary" size="sm" asChild>
                          <Link href={`/business/salon-bookings/${business.id}`}>
                            <CalendarCheck className="mr-2 h-4 w-4" /> Резервации
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="border-purple-500 text-purple-600 hover:bg-purple-500/10 hover:text-purple-700 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-400/10 dark:hover:text-purple-300">
                          <Link href={`/business/salon-reviews/${business.id}`}>
                            <MessageSquareText className="mr-2 h-4 w-4" /> Отзиви
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary/10 hover:text-primary">
                          <Link href={`/business/promote/${business.id}`}>
                            <Gift className="mr-2 h-4 w-4" /> Промотирай
                          </Link>
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <LineChartIcon className="mr-2 h-4 w-4" /> Статистика
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[700px] md:max-w-[800px] lg:max-w-[900px]">
                            <DialogHeader>
                              <DialogTitle>Статистика за резервации: {business.name}</DialogTitle>
                              <DialogDescription>
                                Преглед на месечните резервации за последните {NUM_MONTHS_FOR_CHARTS} месеца.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="h-[350px] p-4 mt-4">
                              {loadingCharts ? <p>Зареждане на статистика...</p> : perSalonMonthlyReservationsData[business.id]?.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={perSalonMonthlyReservationsData[business.id]} margin={{ top: 5, right: 20, left: -25, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/30" />
                                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} width={30}/>
                                    <Tooltip
                                      cursor={{ strokeDasharray: '3 3' }}
                                      contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '0.375rem', fontSize: '0.75rem' }}
                                      labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: '500' }}
                                    />
                                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Резервации" />
                                  </LineChart>
                                </ResponsiveContainer>
                              ) : <p className="text-center text-sm text-muted-foreground pt-4">Няма данни за резервации за този салон.</p>}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardFooter>
                    </Card>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
    
    
    

    
