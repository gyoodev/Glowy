
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getFirestore, collection, getDocs, query, Timestamp, doc, updateDoc } from 'firebase/firestore';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import type { Salon, Promotion } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Gift, Edit, Loader2 } from 'lucide-react';
import { format, isFuture, parseISO, addDays } from 'date-fns';
import { bg } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { mapSalon } from '@/utils/mappers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ExtendedPromotion extends Promotion {
  salonId: string;
  salonName: string;
}

// Define admin packages
const adminPromotionPackages = [
  { id: 'admin_7days', name: '7 Дни (Админ)', durationDays: 7 },
  { id: 'admin_30days', name: '30 Дни (Админ)', durationDays: 30 },
  { id: 'admin_90days', name: '90 Дни (Админ)', durationDays: 90 },
];

export default function AdminPromotionsPage() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [promotions, setPromotions] = useState<ExtendedPromotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for the manual activation form
  const [selectedSalonId, setSelectedSalonId] = useState<string>('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  const { toast } = useToast();
  const firestoreInstance = getFirestore(auth.app);

  const fetchSalonsAndPromotions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const salonsCollectionRef = collection(firestoreInstance, 'salons');
      const salonsQuery = query(salonsCollectionRef);
      const salonsSnapshot = await getDocs(salonsQuery);

      const allSalons = salonsSnapshot.docs.map(docSnap => mapSalon(docSnap.data(), docSnap.id));
      setSalons(allSalons);

      const allPromotions: ExtendedPromotion[] = [];
      allSalons.forEach(salon => {
        if (salon.promotion) {
          allPromotions.push({
            ...salon.promotion,
            salonId: salon.id,
            salonName: salon.name,
          });
        }
      });
      
      allPromotions.sort((a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime());
      setPromotions(allPromotions);

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Неуспешно зареждане на данни. Моля, проверете Firestore правилата.');
      toast({ title: "Грешка", description: "Неуспешно зареждане на данни.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [firestoreInstance, toast]);

  useEffect(() => {
    fetchSalonsAndPromotions();
  }, [fetchSalonsAndPromotions]);

  const handleActivatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSalonId || !selectedPackageId) {
      toast({ title: "Грешка", description: "Моля, изберете салон и промоционален пакет.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    const selectedPackage = adminPromotionPackages.find(p => p.id === selectedPackageId);
    const selectedSalon = salons.find(s => s.id === selectedSalonId);
    
    if (!selectedPackage || !selectedSalon) {
        toast({ title: "Грешка", description: "Избраният салон или пакет не е валиден.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    const now = new Date();
    const expiryDate = addDays(now, selectedPackage.durationDays);

    const newPromotion: Promotion = {
        isActive: true,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        purchasedAt: Timestamp.fromDate(now),
        expiresAt: expiryDate.toISOString(),
        paymentMethod: 'other', // Or 'admin_grant'
        transactionId: `admin_${auth.currentUser?.uid}_${now.getTime()}`
    };

    try {
        const salonRef = doc(firestoreInstance, 'salons', selectedSalonId);
        await updateDoc(salonRef, { promotion: newPromotion });
        toast({ title: "Успех!", description: `Промоция "${selectedPackage.name}" е активирана за салон "${selectedSalon.name}".`});
        setSelectedSalonId('');
        setSelectedPackageId('');
        fetchSalonsAndPromotions(); // Refresh data
    } catch (err: any) {
        console.error("Error activating promotion:", err);
        toast({ title: "Грешка", description: `Неуспешно активиране на промоция: ${err.message}`, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeactivatePromotion = async (salonId: string) => {
    if (!window.confirm('Сигурни ли сте, че искате да деактивирате тази промоция?')) return;
    setIsSubmitting(true);
    try {
        const salonRef = doc(firestoreInstance, 'salons', salonId);
        await updateDoc(salonRef, { 'promotion.isActive': false });
        toast({ title: "Промоцията е деактивирана", description: "Промоцията за този салон беше спряна." });
        fetchSalonsAndPromotions(); // Refresh data
    } catch (err: any) {
        console.error("Error deactivating promotion:", err);
        toast({ title: "Грешка", description: `Неуспешно деактивиране на промоция: ${err.message}`, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
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
        <h2 className="text-2xl font-semibold text-destructive mb-2">Грешка при зареждане на промоции</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={fetchSalonsAndPromotions}>Опитай отново</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <Gift className="mr-3 h-8 w-8 text-primary" />
          Управление на Промоции
        </h1>
        <p className="text-lg text-muted-foreground">
          Преглед, активиране и деактивиране на промоции за салони в платформата.
        </p>
      </header>

      <Card>
        <CardHeader>
            <CardTitle>Ръчно Активиране на Промоция</CardTitle>
            <CardDescription>Изберете салон и пакет, за да активирате ръчно промоция.</CardDescription>
        </CardHeader>
        <form onSubmit={handleActivatePromotion}>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="salon-select">Салон</Label>
                    <Select value={selectedSalonId} onValueChange={setSelectedSalonId} disabled={isSubmitting}>
                        <SelectTrigger id="salon-select">
                            <SelectValue placeholder="Изберете салон..." />
                        </SelectTrigger>
                        <SelectContent>
                            {salons.map(salon => (
                                <SelectItem key={salon.id} value={salon.id}>{salon.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="package-select">Промо Пакет</Label>
                     <Select value={selectedPackageId} onValueChange={setSelectedPackageId} disabled={isSubmitting}>
                        <SelectTrigger id="package-select">
                            <SelectValue placeholder="Изберете пакет..." />
                        </SelectTrigger>
                        <SelectContent>
                            {adminPromotionPackages.map(pkg => (
                                <SelectItem key={pkg.id} value={pkg.id}>{pkg.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={isSubmitting || !selectedSalonId || !selectedPackageId}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Активирай Промоция
                </Button>
            </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Списък с Промоции</CardTitle>
          <CardDescription>Общо {promotions.length} промоции.</CardDescription>
        </CardHeader>
        <CardContent>
           {promotions.length === 0 ? (
             <div className="text-center text-muted-foreground py-10">
                <p>Няма активни или изтекли промоции за нито един салон.</p>
              </div>
           ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Име на Салон</TableHead>
                  <TableHead>Промо Пакет</TableHead>
                  <TableHead>Изтича на</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promo) => {
                  const isActive = promo.isActive && isFuture(parseISO(promo.expiresAt));
                  return (
                    <TableRow key={promo.salonId}>
                      <TableCell className="font-medium">
                        <Button variant="link" asChild className="p-0 h-auto">
                           <Link href={`/business/edit/${promo.salonId}`}>{promo.salonName}</Link>
                        </Button>
                      </TableCell>
                      <TableCell>{promo.packageName}</TableCell>
                      <TableCell>
                        {format(new Date(promo.expiresAt), 'dd.MM.yyyy HH:mm', { locale: bg })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-green-500 hover:bg-green-600' : 'bg-muted text-muted-foreground'}>
                          {isActive ? 'Активна' : 'Изтекла/Неактивна'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                          {isActive && (
                              <Button variant="destructive" size="sm" onClick={() => handleDeactivatePromotion(promo.salonId)} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Деактивирай
                              </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
