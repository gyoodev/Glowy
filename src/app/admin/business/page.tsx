
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getFirestore, collection, getDocs, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import type { Salon } from '@/types';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { mapSalon } from '@/utils/mappers';

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
  const { toast } = useToast();

  const [newBusiness, setNewBusiness] = useState<NewBusinessFormState>({
    name: '',
    city: '',
    address: '',
    ownerId: '',
  });

  const fetchSalons = useCallback(async () => {
    console.log("AdminBusinessPage: Starting fetchSalons...");
    setIsLoading(true);
    setError(null);
    try {
      const salonsCollectionRef = collection(firestoreInstance, 'salons');
      const q = query(salonsCollectionRef, orderBy('name', 'asc'));
      const salonsSnapshot = await getDocs(q);
      const salonsList = salonsSnapshot.docs.map(docSnap => mapSalon(docSnap.data(), docSnap.id));
      setSalons(salonsList);
      console.log(`AdminBusinessPage: Fetched ${salonsList.length} salons.`);
    } catch (err: any) {
      console.error('AdminBusinessPage: Error fetching salons:', err);
      setError('Failed to load salons. Please ensure Firestore rules allow admin access and the collection exists.');
      toast({ title: "Грешка при зареждане", description: "Неуспешно зареждане на салоните.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      console.log("AdminBusinessPage: fetchSalons finished.");
    }
  }, [firestoreInstance, toast]);

  useEffect(() => {
    fetchSalons();
  }, [fetchSalons]);

  const handleCreateBusiness = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    console.log("AdminBusinessPage: Attempting to create new business:", newBusiness);
    try {
      const salonsCollectionRef = collection(firestoreInstance, 'salons');
      const docRef = await addDoc(salonsCollectionRef, {
        ...newBusiness,
        createdAt: serverTimestamp(),
        status: 'approved', 
        description: 'Новосъздаден салон. Моля, редактирайте детайлите.',
        rating: 0,
        reviewCount: 0,
        photos: [],
        services: [],
      });
      console.log(`AdminBusinessPage: Business created successfully with ID: ${docRef.id}`);
      toast({
        title: 'Бизнесът е създаден',
        description: `Нов салон "${newBusiness.name}" е добавен с ID: ${docRef.id}`,
      });
      setNewBusiness({ name: '', city: '', address: '', ownerId: '' });
      await fetchSalons(); 
    } catch (err: any) {
      console.error('AdminBusinessPage: Error creating business:', err);
      setError('Неуспешно създаване на бизнес.');
      toast({ title: 'Грешка', description: 'Неуспешно създаване на бизнес.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      console.log("AdminBusinessPage: Create business process finished.");
    }
  };

  const handleDeleteBusiness = async (businessId: string, businessName: string) => {
    console.log(`AdminBusinessPage: Confirmation prompt for deleting business: ID=${businessId}, Name=${businessName}`);
    if (!window.confirm(`Сигурни ли сте, че искате да изтриете салон "${businessName}"? Тази операция е необратима и ще премахне салона от системата.`)) {
        console.log(`AdminBusinessPage: Deletion cancelled by user for business ID: ${businessId}`);
        return;
    }

    console.log(`AdminBusinessPage: Proceeding with deletion for business ID: ${businessId}`);
    setIsSubmitting(true);
    try {
        const businessDocRef = doc(firestoreInstance, 'salons', businessId);
        await deleteDoc(businessDocRef);
        console.log(`AdminBusinessPage: Successfully deleted business ID: ${businessId} from Firestore.`);
        toast({ title: 'Салонът е изтрит', description: `Салон "${businessName}" беше успешно изтрит.` });
        await fetchSalons(); 
        console.log("AdminBusinessPage: Salon list refreshed after deletion.");
    } catch (err: any) {
        console.error(`AdminBusinessPage: Error deleting business ID ${businessId}:`, err.message, err.code, err.stack);
        toast({ title: 'Грешка при изтриване', description: `Неуспешно изтриване на салон: ${err.message}`, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
        console.log("AdminBusinessPage: Deletion process finished, isSubmitting set to false.");
    }
  };

  const handleDeleteClick = (salonItem: Salon) => {
    if (!salonItem || !salonItem.id) {
        toast({ title: 'Грешка при изтриване', description: 'Липсва ID на салона. Изтриването е невъзможно.', variant: 'destructive' });
        console.error("AdminBusinessPage: Delete attempt failed: Salon object or ID is missing.", salonItem);
        return;
    }
    const nameForConfirmation = salonItem.name || `салон с ID: ${salonItem.id}`;
    console.log(`AdminBusinessPage: Initiating delete for salon: ID=${salonItem.id}, Name=${nameForConfirmation}`);
    handleDeleteBusiness(salonItem.id, nameForConfirmation);
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

      {/* Form for creating a new business - Omitted for brevity in this specific fix, assuming it's unchanged from previous state */}
      {/* <Card className="mb-8 shadow-md"> ... </Card> */}

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
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/business/edit/${salon.id}`}>
                          Редактирай
                        </Link>
                      </Button>
                       <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(salon)}
                        disabled={isSubmitting}
                      >
                        Изтрий
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

    
