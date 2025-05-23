
'use client';

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { auth } from '../../lib/firebase'; // Changed from @/lib/firebase
import type { Booking } from '@/types'; // Assuming Booking type includes necessary fields

export default function AdminBookingManagementPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const db = getFirestore(auth.app);
        const bookingsCollectionRef = collection(db, 'bookings');
        // Example: order by creation date, newest first
        const q = query(bookingsCollectionRef, orderBy('createdAt', 'desc'));
        const bookingsSnapshot = await getDocs(q);
        const bookingsList = bookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Booking[];
        setBookings(bookingsList);
      } catch (err: any) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings. Please check Firestore rules and collection name.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (isLoading) {
    return <div className="container mx-auto py-10">Зареждане на резервации...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-10 text-destructive">Грешка: {error}</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Админ - Управление на Резервации</h1>
      {bookings.length === 0 ? (
        <p>Няма намерени резервации.</p>
      ) : (
        <div className="overflow-x-auto bg-card p-4 rounded-lg shadow">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID на Резервация</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Име на Салон</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Услуга</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Дата</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Час</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Клиент ID</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {bookings.map(booking => (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{booking.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{booking.salonName || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{booking.serviceName || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {booking.date ? new Date(booking.date).toLocaleDateString('bg-BG') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{booking.time || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{booking.status || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{booking.userId || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
