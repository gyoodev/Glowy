
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getFirestore, collection, getDocs, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import type { Salon } from '@/types';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, List, Trash2, UserPlus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getDoc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending_approval' | 'rejected'>('approved');
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

  const fetchSalons = useCallback(async (statusFilter: typeof filterStatus = 'approved') => {
    console.log("AdminBusinessPage: Starting fetchSalons...");
    setIsLoading(true);
    setError(null);
    console.log("AdminBusinessPage: Starting fetchSalons...");
    setIsLoading(true);
    setError(null);
    try {
      let salonsQuery = collection(firestoreInstance, 'salons');
      let q;
      if (statusFilter === 'all') {
         q = query(salonsQuery, orderBy('name', 'asc'));
      } else {
        q = query(salonsQuery, where('status', '==', statusFilter), orderBy('name', 'asc'));
      }
      const salonsSnapshot = await getDocs(q);
      const salonsList = salonsSnapshot.docs.map(docSnap => mapSalon(docSnap.data(), docSnap.id));
      setSalons(salonsList);
      console.log(`AdminBusinessPage: Fetched ${salonsList.length} salons with status filter "${statusFilter}".`);
    } catch (err: any) {
      console.error('AdminBusinessPage: Error fetching salons:', err);
      setError('Неуспешно зареждане на салоните.');
    } finally {
      setIsLoading(false); 
    }  }, [firestoreInstance]);

   useEffect(() => {
    fetchSalons();
  }, [fetchSalons]);

  const handleCreateBusiness = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newBusiness.name || !newBusiness.city || !newBusiness.address || !newBusiness.ownerId) {
      toast({ title: 'Грешка', description: 'Моля, попълнете всички полета.', variant: 'destructive' });
      return;
    }
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
      await fetchSalons(filterStatus); 
    } catch (err: any) {
      console.error('AdminBusinessPage: Error creating business:', err);
      setError('Неуспешно създаване на бизнес.');
      toast({ title: 'Грешка', description: 'Неуспешно създаване на бизнес.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      console.log("AdminBusinessPage: Create business process finished.");
    }
  };

  const handleChangeStatus = useCallback(async (businessId: string, newStatus: 'approved' | 'pending_approval' | 'rejected') => {
    console.log(`AdminBusinessPage: Attempting to change status for business ID ${businessId} to ${newStatus}.`);
    setIsSubmitting(true);
    try {
      const businessDocRef = doc(firestoreInstance, 'salons', businessId);
      
      const businessDocSnap = await getDoc(businessDocRef);
      if (!businessDocSnap.exists()) {
        throw new Error('Бизнесът не беше намерен.');
      }
      const businessData = businessDocSnap.data();
      const ownerId = businessData?.ownerId;
      const salonName = businessData?.name || 'Вашия салон';

      await updateDoc(businessDocRef, { status: newStatus });
      toast({ title: 'Статусът е променен', description: `Статусът на бизнеса е успешно променен на "${newStatus}".` });

      if (ownerId) {
        const notificationMessage = `Статусът на Вашия салон "${salonName}" беше променен на "${newStatus === 'approved' ? 'Одобрен' : newStatus === 'rejected' ? 'Отхвърлен' : 'Очаква одобрение'}".`;
        await addDoc(collection(firestoreInstance, 'notifications'), {
          userId: ownerId,
          message: notificationMessage,
          link: `/business/manage`,
          read: false,
          createdAt: serverTimestamp(),
          type: 'salon_status_change',
          relatedEntityId: businessId,
        });
        console.log(`AdminBusinessPage: Notification sent to owner ${ownerId} for status change of salon ${businessId}.`);
         toast({
            title: 'Известие изпратено',
            description: 'Собственикът на салона беше уведомен за промяната на статуса.',
            variant: 'default'
          });
      }

      setSalons(prevSalons => prevSalons.map(s => s.id === businessId ? { ...s, status: newStatus } : s).filter(s => filterStatus === 'all' || s.status === filterStatus));
      console.log(`AdminBusinessPage: Status updated for business ID ${businessId} to ${newStatus}.`);
    } catch (err: any) {
      console.error(`AdminBusinessPage: Error changing status for business ID ${businessId}:`, err);
      toast({ title: 'Грешка при промяна на статуса', description: `Неуспешна промяна на статуса: ${err.message}`, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }, [firestoreInstance, toast, filterStatus]);

  const handleDeleteBusiness = useCallback(async (businessId: string, businessName: string) => {
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
        await fetchSalons(filterStatus); 
        console.log("AdminBusinessPage: Salon list refreshed after deletion.");
    } catch (err: any) {
        console.error(`AdminBusinessPage: Error deleting business ID ${businessId}:`, err.message, err.code, err.stack);
        toast({ title: 'Грешка при изтриване', description: `Неуспешно изтриване на салон: ${err.message}`, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
        console.log("AdminBusinessPage: Deletion process finished, isSubmitting set to false.");
    }
  }, [firestoreInstance, toast, fetchSalons, filterStatus]);

  useEffect(() => {
    fetchSalons(filterStatus);
  }, [fetchSalons, filterStatus]);

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
      
      <Card className="mb-8 shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <UserPlus className="mr-2 h-6 w-6 text-primary" />
            Ръчно създаване на бизнес
          </CardTitle>
          <CardDescription>
            Създайте нов салон и го асоциирайте със съществуващ потребител (собственик).
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateBusiness}>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="name">Име на салона</Label>
              <Input id="name" value={newBusiness.name} onChange={(e) => setNewBusiness({ ...newBusiness, name: e.target.value })} required disabled={isSubmitting} />
            </div>
            <div>
              <Label htmlFor="city">Град</Label>
              <Input id="city" value={newBusiness.city} onChange={(e) => setNewBusiness({ ...newBusiness, city: e.target.value })} required disabled={isSubmitting} />
            </div>
            <div>
              <Label htmlFor="address">Адрес</Label>
              <Input id="address" value={newBusiness.address} onChange={(e) => setNewBusiness({ ...newBusiness, address: e.target.value })} required disabled={isSubmitting} />
            </div>
            <div>
              <Label htmlFor="ownerId">ID на собственик</Label>
              <Input id="ownerId" value={newBusiness.ownerId} onChange={(e) => setNewBusiness({ ...newBusiness, ownerId: e.target.value })} required disabled={isSubmitting} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Създаване...' : 'Създай бизнес'}
            </Button>
          </CardFooter>
        </form>
      </Card>


     <div className="mb-6 flex items-center space-x-4">
        <Label htmlFor="statusFilter" className="flex-shrink-0">Покажи салони със статус:</Label>
        <Select onValueChange={(value: typeof filterStatus) => setFilterStatus(value)} value={filterStatus}>
          <SelectTrigger id="statusFilter" className="w-[200px]">
            <SelectValue placeholder="Избери статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="approved">Одобрени</SelectItem>
            <SelectItem value="pending_approval">Очаква одобрение</SelectItem>
            <SelectItem value="rejected">Отхвърлени</SelectItem>
            <SelectItem value="all">Всички</SelectItem>
          </SelectContent>
        </Select>
         {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
      </div>


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
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</TableHead>
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
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                      <Select onValueChange={(value: 'approved' | 'pending_approval' | 'rejected') => handleChangeStatus(salon.id, value)} value={salon.status}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Избери статус" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approved">Одобрен</SelectItem>
                          <SelectItem value="pending_approval">Очаква одобрение</SelectItem>
                          <SelectItem value="rejected">Отхвърлен</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/business/edit/${salon.id}`}>
                          Редактирай
                        </Link>
                      </Button>
                       <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (!salon || !salon.id) {
                            toast({ title: 'Грешка при изтриване', description: 'Липсва ID на салона. Изтриването е невъзможно.', variant: 'destructive' });
                            console.error("AdminBusinessPage: Delete attempt failed: Salon object or ID is missing.", salon);
                            return;
                          }
                          const nameForConfirmation = salon.name || `салон с ID: ${salon.id}`;
                          console.log(`AdminBusinessPage: Initiating delete for salon: ID=${salon.id}, Name=${nameForConfirmation}`);
                          handleDeleteBusiness(salon.id, nameForConfirmation);
                        }}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
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
