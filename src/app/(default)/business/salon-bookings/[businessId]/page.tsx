'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc, orderBy, Timestamp, addDoc, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import type { Booking, Salon, UserProfile } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import { auth, getUserProfile, firestore as db } from '@/lib/firebase';
import { AlertTriangle, CalendarX2, Info, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExtendedBooking extends Booking {
  clientProfile?: UserProfile | null;
}

export default function SalonBookingsPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = typeof params?.businessId === 'string' ? params.businessId : null;
  const firestore = getFirestore();
  const { toast } = useToast();

  const [salon, setSalon] = useState<Salon | null>(null);
  const [bookings, setBookings] = useState<ExtendedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatusFor, setIsUpdatingStatusFor] = useState<string | null>(null);

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
    if (!businessId) {
      setError('Невалиден ID на бизнес.');
      setIsLoading(false);
      return;
    }
    if (!currentUser) {
      return;
    }

    const fetchSalonAndBookings = async () => {
      setIsLoading(true);
      setError(null);
      try {
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

        const bookingsQuery = query(
          collection(firestore, 'bookings'),
          where('salonId', '==', businessId),
          orderBy('createdAt', 'desc')
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        
        const fetchedBookingsPromises = bookingsSnapshot.docs.map(async (bookingDoc) => {
          const data = bookingDoc.data();
          let clientProfileData: UserProfile | null = null;
          if (data.userId) {
            try {
              clientProfileData = await getUserProfile(data.userId);
            } catch (profileError) {
              console.warn(`Could not fetch profile for userId ${data.userId}:`, profileError);
            }
          }
          return {
            id: bookingDoc.id,
            ...data,
            clientName: clientProfileData?.name || clientProfileData?.displayName || data.clientName || 'Клиент',
            clientPhoneNumber: clientProfileData?.phoneNumber || data.clientPhoneNumber || 'Няма номер',
            clientEmail: clientProfileData?.email || data.clientEmail || 'Няма имейл',
            clientProfile: clientProfileData,
          } as ExtendedBooking;
        });

        const resolvedBookings = await Promise.all(fetchedBookingsPromises);
        setBookings(resolvedBookings);

      } catch (err: any) {
        console.error("Error fetching salon bookings:", err);
        setError('Възникна грешка при зареждане на резервациите.');
        if (err.code === 'permission-denied') {
          setError('Грешка: Нямате права за достъп до тези данни. Моля, проверете Firestore правилата.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalonAndBookings();
  }, [currentUser, businessId, firestore]);

  const handleStatusChange = async (bookingId: string, newStatus: Booking['status'], booking: ExtendedBooking) => {
    setIsUpdatingStatusFor(bookingId);
    const oldStatus = booking.status;
    try {
      const bookingRef = doc(firestore, 'bookings', bookingId);
      await updateDoc(bookingRef, { status: newStatus });
      
      // If the new status is 'cancelled', add the time slot back to availability
      if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
        const salonRef = doc(firestore, 'salons', booking.salonId);
        const dateKey = format(new Date(booking.date), 'yyyy-MM-dd');
        await updateDoc(salonRef, {
            [`availability.${dateKey}`]: arrayUnion(booking.time)
        });
        toast({
            title: 'Часът е освободен',
            description: `Часът ${booking.time} на ${dateKey} е добавен обратно към наличните.`,
        });
      }


      setBookings(prevBookings =>
        prevBookings.map(b => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      toast({
        title: 'Статусът е актуализиран',
        description: `Статусът на резервацията беше успешно променен на '${statusTranslations[newStatus]}'.`,
      });

      if (newStatus !== oldStatus && booking.userId) {
        const notificationMessage = `Статусът на Вашата резервация за '${booking.serviceName}' в '${booking.salonName}' на ${format(new Date(booking.date), 'dd.MM.yyyy', { locale: bg })} в ${booking.time} беше променен на '${statusTranslations[newStatus]}'.`;
        await addDoc(collection(db, 'notifications'), {
          userId: booking.userId,
          message: notificationMessage,
          link: `/account`, 
          read: false,
          createdAt: Timestamp.fromDate(new Date()),
          type: 'booking_status_change_customer',
          relatedEntityId: bookingId,
        });
      }
      
      // Send email notification to client
      if (booking.clientEmail && newStatus !== oldStatus) {
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
          const response = await fetch(`${appUrl}/api/send-email/booking-status-change-client`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clientEmail: booking.clientEmail,
              clientName: booking.clientName || 'Клиент',
              salonName: booking.salonName,
              serviceName: booking.serviceName,
              bookingDate: format(new Date(booking.date), 'dd.MM.yyyy', { locale: bg }),
              bookingTime: booking.time,
              newStatus: statusTranslations[newStatus],
            }),
          });

          if (!response.ok) {
            console.error('Failed to send booking status change email:', response.status, response.statusText);
          } else {
            console.log('Booking status change email sent successfully.');
          }
        } catch (emailError) {
          console.error('Error sending booking status change email:', emailError);
        }
      }

    } catch (err) {
      console.error("Error updating booking status:", err);
      toast({
        title: 'Грешка при актуализация',
        description: 'Неуспешна промяна на статуса на резервацията.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatusFor(null);
    }
  };

  const statusOptions: Booking['status'][] = ['pending', 'confirmed', 'completed', 'cancelled'];
  const statusTranslations: Record<Booking['status'], string> = {
    pending: 'чакаща',
    confirmed: 'потвърдена',
    completed: 'завършена',
    cancelled: 'отказана',
  };


  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-6">
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  {[...Array(6)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
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
                  <TableHead>Клиент</TableHead>
                  <TableHead>Телефонен номер</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.serviceName}</TableCell>
                    <TableCell>{format(new Date(booking.date), 'PPP', { locale: bg })}</TableCell>
                    <TableCell>{booking.time}</TableCell>
                    <TableCell>
                      {booking.clientName}
                    </TableCell>
                    <TableCell>
                      {booking.clientPhoneNumber}
                    </TableCell>
                    <TableCell>
                      {isUpdatingStatusFor === booking.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Select
                          value={booking.status}
                          onValueChange={(newStatus) => handleStatusChange(booking.id, newStatus as Booking['status'], booking)}
                          disabled={isUpdatingStatusFor === booking.id}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Промяна на статус" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(status => (
                              <SelectItem key={status} value={status}>
                                {statusTranslations[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
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