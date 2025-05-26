
'use client';

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, query, orderBy, doc, updateDoc, Timestamp, addDoc } from 'firebase/firestore';
import { auth, getUserProfile, firestore as db } from '@/lib/firebase'; // Changed to alias
import type { Booking, UserProfile } from '@/types'; // Changed to alias
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import { AlertTriangle, CalendarX2, Info, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExtendedBooking extends Booking {
  clientProfile?: UserProfile | null;
}

export default function AdminBookingManagementPage() {
  const [bookings, setBookings] = useState<ExtendedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatusFor, setIsUpdatingStatusFor] = useState<string | null>(null);
  const { toast } = useToast();
  const firestoreInstance = getFirestore(auth.app); // Use firestoreInstance consistently

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const bookingsCollectionRef = collection(firestoreInstance, 'bookings');
        const q = query(bookingsCollectionRef, orderBy('createdAt', 'desc'));
        const bookingsSnapshot = await getDocs(q);
        
        const bookingsListPromises = bookingsSnapshot.docs.map(async (bookingDoc) => {
          const data = bookingDoc.data() as Omit<Booking, 'id'>;
          let clientProfile: UserProfile | null = null;
          if (data.userId) {
            try {
              clientProfile = await getUserProfile(data.userId);
            } catch (profileError) {
              console.warn(`Could not fetch profile for userId ${data.userId}:`, profileError);
            }
          }
          return {
            id: bookingDoc.id,
            ...data,
            clientName: clientProfile?.name || clientProfile?.displayName || data.clientName || 'Клиент',
            clientEmail: clientProfile?.email || data.clientEmail || 'Няма имейл',
            clientPhoneNumber: clientProfile?.phoneNumber || data.clientPhoneNumber || 'Няма номер',
            clientProfile,
          } as ExtendedBooking;
        });
        const resolvedBookings = await Promise.all(bookingsListPromises);
        setBookings(resolvedBookings);
      } catch (err: any) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings. Please check Firestore rules and collection name.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [firestoreInstance]);

  const statusOptions: Booking['status'][] = ['pending', 'confirmed', 'completed', 'cancelled'];
  const statusTranslations: Record<Booking['status'], string> = {
    pending: 'чакаща',
    confirmed: 'потвърдена',
    completed: 'завършена',
    cancelled: 'отказана',
  };

  const handleStatusChange = async (bookingId: string, newStatus: Booking['status'], booking: ExtendedBooking) => {
    if (!booking) return;
    setIsUpdatingStatusFor(bookingId);
    const oldStatus = booking.status;
    try {
      const bookingRef = doc(firestoreInstance, 'bookings', bookingId);
      await updateDoc(bookingRef, { status: newStatus });

      setBookings(prevBookings =>
        prevBookings.map(b => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      toast({
        title: 'Статусът е актуализиран',
        description: `Статусът на резервацията беше успешно променен на '${statusTranslations[newStatus]}'.`,
      });

      // Notify customer about status change
      if (newStatus !== oldStatus && booking.userId && booking.serviceName && booking.salonName && booking.date && booking.time) {
        const notificationMessage = `Статусът на Вашата резервация за '${booking.serviceName}' в '${booking.salonName}' на ${format(new Date(booking.date), 'dd.MM.yyyy', { locale: bg })} в ${booking.time} беше променен на '${statusTranslations[newStatus]}'.`;
        await addDoc(collection(db, 'notifications'), { // db is the exported firestore from @/lib/firebase
          userId: booking.userId,
          message: notificationMessage,
          link: `/account`,
          read: false,
          createdAt: Timestamp.fromDate(new Date()),
          type: 'booking_status_change_customer',
          relatedEntityId: bookingId,
        });
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


  if (isLoading) {
    return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  {[...Array(7)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
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
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Грешка при зареждане на резервации</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
         <Button onClick={() => window.location.reload()}>Опитай отново</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">Админ - Управление на Резервации</h1>
      {bookings.length === 0 ? (
        <Card className="text-center py-12">
           <CardHeader>
            <CalendarX2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl font-semibold">Няма намерени резервации</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-muted-foreground">
              Все още няма направени резервации в системата.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto bg-card p-4 rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID на Резервация</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Име на Салон</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Услуга</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Дата</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Час</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Клиент</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Телефон</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card divide-y divide-border">
              {bookings.map(booking => (
                <TableRow key={booking.id}>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{booking.id}</TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{booking.salonName || 'N/A'}</TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{booking.serviceName || 'N/A'}</TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {booking.date ? new Date(booking.date).toLocaleDateString('bg-BG') : 'N/A'}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{booking.time || 'N/A'}</TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{booking.clientName || booking.userId || 'N/A'}</TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{booking.clientPhoneNumber || 'N/A'}</TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
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
        </div>
      )}
    </div>
  );
}
