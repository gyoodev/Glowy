
'use client';

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore'; // Added query and orderBy
import { auth } from '@/lib/firebase';
import type { Salon } from '@/types';
import Link from 'next/link'; // Import Link for navigation

export default function AdminBusinessPage() {
  const [salons, setSalons] = useState<Salon[]>([]); // Use Salon type
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalons = async () => {
      try {
        const db = getFirestore(auth.app);
        const salonsCollectionRef = collection(db, 'salons');
        // Optionally order salons, e.g., by name or creation date
        const q = query(salonsCollectionRef, orderBy('name', 'asc')); // Example: order by name
        const salonsSnapshot = await getDocs(q);
        const salonsList = salonsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Salon[];
        setSalons(salonsList);
      } catch (err: any) {
        console.error('Error fetching salons:', err);
        setError('Failed to load salons.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalons();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Управление на бизнеси (Салони)</h1>

      {isLoading && <p>Зареждане на салони...</p>}
      {error && <p className="text-destructive">Грешка: {error}</p>}

      {!isLoading && !error && salons.length === 0 && (
        <p>Няма намерени салони.</p>
      )}

      {!isLoading && !error && salons.length > 0 && (
        <div className="p-6 bg-card rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Списък със салони ({salons.length})</h2>
           <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Име на Салона</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Град</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Адрес</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Рейтинг</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Собственик ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {salons.map(salon => (
                  <tr key={salon.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{salon.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{salon.city || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{salon.address || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{salon.rating?.toFixed(1) || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{salon.ownerId || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                       <Link href={`/business/edit/${salon.id}`} className="text-primary hover:underline">
                        Редактирай
                      </Link>
                      {/* TODO: Add Delete functionality here */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
