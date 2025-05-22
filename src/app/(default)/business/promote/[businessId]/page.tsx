
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { Salon, Promotion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, Gift, Tag, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, isFuture } from 'date-fns';
import { bg } from 'date-fns/locale';

const promotionPackages = [
  { id: '7days', name: '7 Дни Промоция', durationDays: 7, price: 10, description: 'Вашият салон на челни позиции за 1 седмица.' },
  { id: '30days', name: '30 Дни Промоция', durationDays: 30, price: 35, description: 'Максимална видимост за цял месец.' },
  { id: '90days', name: '90 Дни Промоция', durationDays: 90, price: 90, description: 'Най-изгодният пакет за дългосрочен ефект.' },
];

export default function PromoteBusinessPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;
  const firestore = getFirestore();
  const { toast } = useToast();

  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSalonData = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const salonRef = doc(firestore, 'salons', businessId);
      const salonSnap = await getDoc(salonRef);

      if (!salonSnap.exists()) {
        setError(`Салон с ID ${businessId} не е намерен.`);
        setSalon(null);
        return;
      }

      const salonData = { id: salonSnap.id, ...salonSnap.data() } as Salon;
      setSalon(salonData);

      if (salonData.ownerId !== userId) {
        setError('Нямате права за достъп до промоциите на този салон.');
        setIsOwner(false);
      } else {
        setIsOwner(true);
      }
    } catch (err: any) {
      console.error("Error fetching salon data for promotion:", err);
      setError('Възникна грешка при зареждане на данните за салона.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        router.push('/login');
      } else {
        if (businessId) { // Ensure businessId is present before fetching
          fetchSalonData(user.uid);
        } else {
          setError("Липсва ID на бизнеса.");
          setIsLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [businessId, router, firestore]);

  const handleBuyPromotion = async (packageId: string) => {
    if (!salon || !currentUser || !isOwner) return;
    setIsProcessing(true);

    const selectedPackage = promotionPackages.find(p => p.id === packageId);
    if (!selectedPackage) {
      toast({ title: 'Грешка', description: 'Избраният пакет не е валиден.', variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    const purchasedAt = new Date();
    const expiresAt = addDays(purchasedAt, selectedPackage.durationDays);

    const newPromotion: Promotion = {
      isActive: true,
      packageId: selectedPackage.id,
      packageName: selectedPackage.name,
      purchasedAt: purchasedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    try {
      const salonRef = doc(firestore, 'salons', salon.id);
      await updateDoc(salonRef, { promotion: newPromotion });
      setSalon(prevSalon => prevSalon ? { ...prevSalon, promotion: newPromotion } : null);
      toast({
        title: 'Промоцията е активирана!',
        description: `${selectedPackage.name} за ${salon.name} е активна до ${format(expiresAt, 'PPP p', { locale: bg })}.`,
      });
    } catch (err) {
      console.error("Error buying promotion:", err);
      toast({ title: 'Грешка при покупка', description: 'Неуспешно активиране на промоцията.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStopPromotion = async () => {
    if (!salon || !salon.promotion || !currentUser || !isOwner) return;
    setIsProcessing(true);

    const updatedPromotion: Promotion = {
      ...salon.promotion,
      isActive: false,
      // expiresAt: new Date().toISOString(), // Optionally mark as expired now or keep original for history
    };

    try {
      const salonRef = doc(firestore, 'salons', salon.id);
      await updateDoc(salonRef, { promotion: updatedPromotion });
      setSalon(prevSalon => prevSalon ? { ...prevSalon, promotion: updatedPromotion } : null);
      toast({ title: 'Промоцията е спряна', description: `Промоцията за ${salon.name} беше деактивирана.` });
    } catch (err) {
      console.error("Error stopping promotion:", err);
      toast({ title: 'Грешка при спиране', description: 'Неуспешно спиране на промоцията.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-6">
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <Card>
          <CardHeader><Skeleton className="h-7 w-3/4" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-6 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Грешка</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад
        </Button>
      </div>
    );
  }

  if (!isOwner && !isLoading) { // This check should occur after isLoading is false
    return (
      <div className="container mx-auto py-10 px-6 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Достъп отказан</h2>
        <p className="text-muted-foreground mb-6">Нямате права за достъп до промоциите на този салон.</p>
        <Button onClick={() => router.push('/business/manage')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Към управление на бизнеси
        </Button>
      </div>
    );
  }
  
  if (!salon) { // If salon is null after loading and no error (e.g. businessId missing initially)
    return (
        <div className="container mx-auto py-10 px-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-muted-foreground mb-2">Салонът не е зареден</h2>
            <p className="text-muted-foreground mb-6">Информацията за салона не можа да бъде заредена. Моля, опитайте отново.</p>
            <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Назад
            </Button>
        </div>
    );
  }


  const currentPromotion = salon.promotion;
  const isCurrentlyPromoted = currentPromotion?.isActive && currentPromotion.expiresAt && isFuture(new Date(currentPromotion.expiresAt));

  return (
    <div className="container mx-auto py-10 px-6">
      <header className="mb-8">
        <Button onClick={() => router.push('/business/manage')} variant="outline" size="sm" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад към управление
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Промотирай Салон: <span className="text-primary">{salon.name}</span>
        </h1>
        <p className="text-lg text-muted-foreground">Увеличете видимостта на Вашия салон и привлечете повече клиенти.</p>
      </header>

      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <CheckCircle className={`mr-2 h-5 w-5 ${isCurrentlyPromoted ? 'text-green-500' : 'text-muted-foreground'}`} />
            Текущ Статус на Промоцията
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isCurrentlyPromoted && currentPromotion ? (
            <div>
              <p className="text-lg font-semibold text-green-600">
                Вашият салон е промотиран с пакет "{currentPromotion.packageName || currentPromotion.packageId}"!
              </p>
              <p className="text-muted-foreground">
                Промоцията е активна до: {format(new Date(currentPromotion.expiresAt!), 'PPP p', { locale: bg })}.
              </p>
              <Button onClick={handleStopPromotion} variant="destructive" className="mt-4" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Спри Промоцията
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">Вашият салон в момента не е промотиран или промоцията е изтекла.</p>
          )}
        </CardContent>
      </Card>

      {!isCurrentlyPromoted && (
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Изберете Промоционален Пакет</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotionPackages.map((pkg) => (
              <Card key={pkg.id} className="flex flex-col shadow-md hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Gift className="mr-2 h-5 w-5 text-primary" /> {pkg.name}
                  </CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-2xl font-bold text-primary mb-2">{pkg.price} лв.</p>
                  <p className="text-sm text-muted-foreground">Продължителност: {pkg.durationDays} дни</p>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handleBuyPromotion(pkg.id)}
                    className="w-full"
                    disabled={isProcessing || !isOwner}
                  >
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Tag className="mr-2 h-4 w-4" />}
                    Купи Сега
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
