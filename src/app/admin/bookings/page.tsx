
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getFirestore, collection, getDocs, query, orderBy, doc, updateDoc, Timestamp, addDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { auth, getUserProfile, firestore as db } from '@/lib/firebase'; 
import type { Booking, UserProfile } from '@/types'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import { AlertTriangle, CalendarX2, Info, Loader2, Trash2, Search, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mapBooking } from '@/utils/mappers';
import { Input } from '@/components/ui/input';

interface ExtendedBooking extends Booking {
  clientProfile?: UserProfile | null;
}

export default function AdminBookingManagementPage() {
  const [bookings, setBookings] = useState<ExtendedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatusFor, setIsUpdatingStatusFor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof ExtendedBooking; direction: 'ascending' | 'descending' } | null>({ key: 'createdAt', direction: 'descending' });
  
  const { toast } = useToast();
  const firestoreInstance = getFirestore(auth.app); 

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const bookingsCollectionRef = collection(firestoreInstance, 'bookings');
        const q = query(bookingsCollectionRef, orderBy('createdAt', 'desc'));
        const bookingsSnapshot = await getDocs(q);
        
        const bookingsListPromises = bookingsSnapshot.docs.map(async (bookingDoc) => {
          const mappedBooking = mapBooking({ id: bookingDoc.id, ...bookingDoc.data() });
          let clientProfile: UserProfile | null = null;
          if (mappedBooking.userId) {
            try {
              clientProfile = await getUserProfile(mappedBooking.userId);
            } catch (profileError) {
              console.warn(`Could not fetch profile for userId ${mappedBooking.userId}:`, profileError);
            }
          }
          return {
            ...mappedBooking,
            clientName: clientProfile?.name || clientProfile?.displayName || mappedBooking.clientName || 'Клиент',
            clientEmail: clientProfile?.email || mappedBooking.clientEmail || 'Няма имейл',
            clientPhoneNumber: clientProfile?.phoneNumber || mappedBooking.clientPhoneNumber || 'Няма номер',
            clientProfile,
          };
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

  const requestSort = (key: keyof ExtendedBooking) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const sortedAndFilteredBookings = useMemo(() => {
    let sortableBookings = [...bookings];
    if (searchTerm) {
        sortableBookings = sortableBookings.filter(b => 
            b.salonName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (sortConfig !== null) {
        sortableBookings.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === undefined || aValue === null) return 1;
            if (bValue === undefined || bValue === null) return -1;
            
            if (sortConfig.key === 'date' || sortConfig.key === 'createdAt') {
                return (new Date(aValue as string).getTime() - new Date(bValue as string).getTime()) * (sortConfig.direction === 'ascending' ? 1 : -1);
            }

            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            
            return 0;
        });
    }

    return sortableBookings;
  }, [bookings, searchTerm, sortConfig]);


  const handleStatusChange = async (bookingId: string, newStatus: Booking['status'], booking: ExtendedBooking) => {
    if (!booking) return;
    setIsUpdatingStatusFor(bookingId);
    const oldStatus = booking.status;
    try {
      const bookingRef = doc(firestoreInstance, 'bookings', bookingId);
      await updateDoc(bookingRef, { status: newStatus });
      
      if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
        const salonRef = doc(firestoreInstance, 'salons', booking.salonId);
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

  const handleDeleteBooking = async (bookingId: string) => {
    if (!window.confirm(`Сигурни ли сте, че искате да изтриете резервация ${bookingId}? Тази операция е необратима.`)) {
      return;
    }

    try {
      setIsLoading(true); 
      const bookingRef = doc(firestoreInstance, 'bookings', bookingId);
      await deleteDoc(bookingRef);

      setBookings(prevBookings => prevBookings.filter(booking => booking.id !== bookingId));
      toast({
        title: 'Резервацията е изтрита',
        description: `Резервация ${bookingId} беше успешно изтрита.`,
      });
    } catch (err: any) {
      console.error('Error deleting booking:', err);
      toast({ title: 'Грешка при изтриване', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false); 
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
        <Card>
          <CardHeader>
            <CardTitle>Списък с Резервации ({sortedAndFilteredBookings.length})</CardTitle>
            <div className="relative pt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input 
                    placeholder="Търсене по салон, услуга, клиент..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Button variant="ghost" onClick={() => requestSort('salonName')}>Салон <ArrowUpDown className="ml-2 h-4 w-4 inline-block" /></Button></TableHead>
                  <TableHead><Button variant="ghost" onClick={() => requestSort('serviceName')}>Услуга <ArrowUpDown className="ml-2 h-4 w-4 inline-block" /></Button></TableHead>
                  <TableHead><Button variant="ghost" onClick={() => requestSort('date')}>Дата <ArrowUpDown className="ml-2 h-4 w-4 inline-block" /></Button></TableHead>
                  <TableHead>Час</TableHead>
                  <TableHead><Button variant="ghost" onClick={() => requestSort('clientName')}>Клиент <ArrowUpDown className="ml-2 h-4 w-4 inline-block" /></Button></TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.salonName || 'N/A'}</TableCell>
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
                    <TableCell>
                       <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteBooking(booking.id)}
                        disabled={isLoading}
                        title="Изтрий резервация"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
