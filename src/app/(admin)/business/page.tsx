'use client';

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { auth } from '@/lib/firebase'; // Assuming auth is needed for Firestore initialization

interface Business {
  id: string;
  [key: string]: any; // Allow any other properties
}

export default function AdminBusinessPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const db = getFirestore(auth.app); // Use the Firebase app from auth
        const businessesCollection = collection(db, 'businesses');
        const businessesSnapshot = await getDocs(businessesCollection);
        const businessesList = businessesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        
        })) as Business[];
        setBusinesses(businessesList);
      } catch (err: any) {
        console.error('Error fetching businesses:', err);
        setError('Failed to load businesses.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Управление на бизнеси</h1> {/* Title */}

      {isLoading && <p>Зареждане на бизнеси...</p>}
      {error && <p className="text-red-500">Грешка: {error}</p>}

      {!isLoading && !error && businesses.length === 0 && (
        <p>Няма намерени бизнеси.</p>
      )}

      {!isLoading && !error && businesses.length > 0 && (
        <div>
          {/* Placeholder for displaying business data */}
          <h2 className="text-2xl font-semibold mb-4">Списък с бизнеси</h2>
          {/* You will replace this with a table or list to display the businesses */}
          <ul>
            {businesses.map(business => (
              <li key={business.id} className="border-b border-gray-200 py-2">
                {/* Display some key business info */}
                {business.name} (ID: {business.id})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}