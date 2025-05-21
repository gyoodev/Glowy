
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { Booking, Salon } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import { AlertTriangle, CalendarX2, Info } from 'lucide-react';

export default function SalonBookingsPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;
  const firestore = getFirestore();

  const [salon, setSalon] = useState<Salon | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!currentUser || !businessId) {
      if (!businessId) setIsLoading(false); // No businessId, stop loading
      return;
    }

    const fetchSalonAndBookings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch salon details to verify ownership
        const salonRef = doc(firestore, 'salons', businessId);
        const salonSnap = await getDoc(salonRef);

        if (!salonSnap.exists()) {
          setError(`Салон с ID ${businessId} не е намерен.`);
          setSalon(null);
          setIsLoading(false);
          return;
        }

        const salonData = { id: salonSnap.id, ...salonSnap.data() } as Salon;
        setSalon(salonData);

        if (salonData.ownerId !== currentUser.uid) {
          setError('Нямате права за достъп до резервациите на този салон.');
          setIsOwner(false);
          setIsLoading(false);
          return;
        }
        setIsOwner(true);

        // Fetch bookings for this salon
        const bookingsQuery = query(
          collection(firestore, 'bookings'),
          where('salonId', '==', businessId),
          orderBy('date', 'desc'),
          orderBy('time', 'desc')
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const fetchedBookings: Booking[] = [];
        bookingsSnapshot.forEach((doc) => {
          fetchedBookings.push({ id: doc.id, ...doc.data() } as Booking);
        });
        setBookings(fetchedBookings);

      } catch (err: any) {
        console.error("Error fetching salon bookings:", err);
        setError('Възникна грешка при зареждане на резервациите.');
        if (err.code === 'permission-denied') {
            setError('Грешка: Нямате права за достъп до тези резервации. Моля, проверете Firestore правилата.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalonAndBookings();
  }, [currentUser, businessId, firestore, router]);

  const statusTranslations: Record<Booking['status'], string> = {
    confirmed: 'потвърдена',
    pending: 'чакаща',
    cancelled: 'отказана',
    completed: 'завършена',
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-6">
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <Card>
          <TableHeader>
            <TableRow>
              {[...Array(4)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(4)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-6 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Грешка</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.push('/business/manage')}>
          Обратно към управление на бизнеси
        </Button>
      </div>
    );
  }
  
  if (!isOwner && !isLoading) {
    // This state should ideally be caught by the error state if setError is called for permission issues
     return (
      <div className="container mx-auto py-10 px-6 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Достъп отказан</h2>
        <p className="text-muted-foreground mb-6">Нямате права за достъп до тази страница.</p>
        <Button onClick={() => router.push('/business/manage')}>
          Обратно към управление на бизнеси
        </Button>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-10 px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Резервации за: <span className="text-primary">{salon?.name || 'Зареждане...'}</span>
        </h1>
        <p className="text-lg text-muted-foreground">Преглед и управление на резервациите за Вашия салон.</p>
      </header>

      {bookings.length === 0 ? (
        <Card className="text-center py-12">
           <CardHeader>
            <CalendarX2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl font-semibold">Няма намерени резервации</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-muted-foreground">
              Все още няма направени резервации за този салон.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Списък с Резервации</CardTitle>
            <CardDescription>Общо {bookings.length} резервации.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Услуга</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Час</TableHead>
                  <TableHead>Клиент (ID)</TableHead>
                  <TableHead>Статус</TableHead>
                  {/* Add more heads if needed, e.g., Actions */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.serviceName}</TableCell>
                    <TableCell>{format(new Date(booking.date), 'PPP', { locale: bg })}</TableCell>
                    <TableCell>{booking.time}</TableCell>
                    <TableCell>
                        <Link href={`/admin/users?userId=${booking.userId}`} className="hover:underline text-primary" title="Виж профил на потребителя (админ)">
                         {booking.userId.substring(0, 8)}...
                       </Link>
                    </TableCell>
                    <TableCell className="capitalize">{statusTranslations[booking.status] || booking.status}</TableCell>
                    {/* Add actions cell if needed */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
        <div className="mt-8">
            <Button onClick={() => router.back()} variant="outline">
                <Info size={16} className="mr-2" /> Обратно
            </Button>
        </div>
    </div>
  );
}

