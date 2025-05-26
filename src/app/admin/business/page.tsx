
'use client';

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { auth } from '@/lib/firebase'; // Changed to alias
import type { Salon } from '@/types'; // Changed to alias
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface NewBusinessFormState {
  name: string;
  city: string;
  address: string;
  ownerId: string;
}
export default function AdminBusinessPage() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firestoreInstance = getFirestore(auth.app);

  useEffect(() => {
    const fetchSalons = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const salonsCollectionRef = collection(firestoreInstance, 'salons');
        const q = query(salonsCollectionRef, orderBy('name', 'asc'));
        const salonsSnapshot = await getDocs(q);
        const salonsList = salonsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Salon[];
        setSalons(salonsList);
      } catch (err: any) {
        console.error('Error fetching salons:', err);
        setError('Failed to load salons. Please ensure Firestore rules allow admin access and the collection exists.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalons();
  }, [firestoreInstance]);

  const [newBusiness, setNewBusiness] = useState<NewBusinessFormState>({
    name: '',
    city: '',
    address: '',
    ownerId: '',
  });
  const { toast } = useToast();

  const handleCreateBusiness = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const salonsCollectionRef = collection(firestoreInstance, 'salons');
      const docRef = await addDoc(salonsCollectionRef, {
        ...newBusiness,
        createdAt: new Date(), // Add a timestamp
      });
      toast({
        title: 'Бизнесът е създаден',
        description: `Нов салон "${newBusiness.name}" е добавен с ID: ${docRef.id}`,
      });
      setNewBusiness({ name: '', city: '', address: '', ownerId: '' });
      fetchSalons(); // Refresh the list
    } catch (err: any) {
      console.error('Error creating business:', err);
      setError('Неуспешно създаване на бизнес.');
      toast({ title: 'Грешка', description: 'Неуспешно създаване на бизнес.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBusiness = async (businessId: string, businessName: string) => {
    if (!window.confirm(`Сигурни ли сте, че искате да изтриете бизнес "${businessName}"? Тази операция е необратима.`)) {
      return;
    }
    try {
      const businessDocRef = doc(firestoreInstance, 'salons', businessId);
      await deleteDoc(businessDocRef);
      toast({ title: 'Бизнесът е изтрит', description: `Бизнесът "${businessName}" беше успешно изтрит.` });
      fetchSalons(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting business:', err);
      toast({ title: 'Грешка', description: 'Неуспешно изтриване на бизнеса.', variant: 'destructive' });
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
                  {[...Array(6)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
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
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Грешка при зареждане на бизнеси</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => window.location.reload()}>Опитай отново</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">Управление на бизнеси (Салони)</h1>

      {salons.length === 0 ? (
         <Card className="text-center py-12">
           <CardHeader>
            <List className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl font-semibold">Няма намерени салони</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-muted-foreground">
             Все още няма регистрирани салони в системата.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Списък със салони</CardTitle>
            <CardDescription>Общо {salons.length} салона.</CardDescription>
          </CardHeader>
          <CardContent>
           <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Име на Салона</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Град</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Адрес</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Рейтинг</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Собственик ID</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-card divide-y divide-border">
                {salons.map(salon => (
                  <TableRow key={salon.id}>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{salon.name}</TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{salon.city || 'N/A'}</TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{salon.address || 'N/A'}</TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{salon.rating?.toFixed(1) || 'N/A'}</TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{salon.ownerId || 'N/A'}</TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/business/edit/${salon.id}`}>
                          Редактирай
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
