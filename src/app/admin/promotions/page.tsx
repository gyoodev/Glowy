
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getFirestore, collection, getDocs, query, Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import type { Salon, Promotion } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Gift, Edit } from 'lucide-react';
import { format, isFuture, parseISO } from 'date-fns';
import { bg } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { mapSalon } from '@/utils/mappers';

interface ExtendedPromotion extends Promotion {
  salonId: string;
  salonName: string;
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<ExtendedPromotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const firestoreInstance = getFirestore(auth.app);

  const fetchPromotions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const salonsCollectionRef = collection(firestoreInstance, 'salons');
      const salonsQuery = query(salonsCollectionRef);
      const salonsSnapshot = await getDocs(salonsQuery);

      const allPromotions: ExtendedPromotion[] = [];
      salonsSnapshot.docs.forEach(docSnap => {
        const salon = mapSalon(docSnap.data(), docSnap.id);
        if (salon.promotion) {
          allPromotions.push({
            ...salon.promotion,
            salonId: salon.id,
            salonName: salon.name,
          });
        }
      });
      
      // Sort promotions by expiry date, most recent first
      allPromotions.sort((a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime());

      setPromotions(allPromotions);
    } catch (err: any) {
      console.error('Error fetching promotions:', err);
      setError('Неуспешно зареждане на промоциите. Моля, проверете Firestore правилата.');
      toast({ title: "Грешка", description: "Неуспешно зареждане на промоциите.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [firestoreInstance, toast]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

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
                  {[...Array(5)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
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
        <Button onClick={fetchPromotions}>Опитай отново</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <Gift className="mr-3 h-8 w-8 text-primary" />
          Всички Промоции
        </h1>
        <p className="text-lg text-muted-foreground">
          Преглед на всички активни и изтекли промоции за салони в платформата.
        </p>
      </header>

      {promotions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Няма Промоции</CardTitle>
            <CardDescription>
              Все още няма активни или изтекли промоции за нито един салон.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-10">
              <p>Когато салон закупи промоционален пакет, той ще се появи тук.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Списък с Промоции</CardTitle>
            <CardDescription>Общо {promotions.length} промоции.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Име на Салон</TableHead>
                  <TableHead>Промо Пакет</TableHead>
                  <TableHead>Дата на Покупка</TableHead>
                  <TableHead>Изтича на</TableHead>
                  <TableHead>Статус</TableHead>
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
                        {format(new Date(promo.purchasedAt), 'dd.MM.yyyy HH:mm', { locale: bg })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(promo.expiresAt), 'dd.MM.yyyy HH:mm', { locale: bg })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-green-500 hover:bg-green-600' : 'bg-muted text-muted-foreground'}>
                          {isActive ? 'Активна' : 'Изтекла'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
