'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc, Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { Salon, Promotion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, Gift, Tag, ArrowLeft, Loader2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, isFuture } from 'date-fns';
import { bg } from 'date-fns/locale';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import type { ReactPayPalScriptOptions, OnApproveData, OnApproveActions } from '@paypal/react-paypal-js';

const promotionPackages = [
  { id: '7days', name: 'Сребърен план', durationDays: 7, price: 5, description: 'Вашият салон на челни позиции за 1 седмица.' },
  { id: '30days', name: 'Златен план', durationDays: 30, price: 15, description: 'Максимална видимост за цял месец.' },
  { id: '90days', name: 'Диамантен план', durationDays: 90, price: 35, description: 'Най-изгодният пакет за дългосрочен ефект.' },
];

const PAYPAL_CURRENCY = "EUR"; // Or your preferred currency

export default function PromoteBusinessPage() {
  const params = useParams();
  const router = useRouter();
  const firestore = getFirestore();
  const { toast } = useToast();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // packageId or 'stop'
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const businessId = typeof params?.businessId === 'string' ? params.businessId : null;
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const paypalScriptOptions: ReactPayPalScriptOptions = {
    clientId: paypalClientId || "test", // Fallback to "test" if not set, but PayPalButtons will error
    currency: PAYPAL_CURRENCY,
    intent: "capture",
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        router.push('/login');
        setIsLoading(false);
      } else {
        if (businessId) {
          fetchSalonData(user.uid);
        } else {
          setError("Липсва ID на бизнеса.");
          setIsLoading(false);
        }
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, router]);

  const fetchSalonData = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!businessId) {
        setError("Business ID is not available.");
        setIsLoading(false);
        return;
      }
      const salonRef = doc(firestore, 'salons', businessId);
      const salonSnap = await getDoc(salonRef);

      if (!salonSnap.exists()) {
        setError('Салон с ID ' + businessId + ' не е намерен.');
        setSalon(null);
        setIsLoading(false);
        return;
      }
      const salonData = { id: salonSnap.id, ...salonSnap.data() } as Salon;
      setSalon(salonData);
      setIsOwner(salonData.ownerId === userId);
      if (salonData.ownerId !== userId) {
        setError('Нямате права за достъп до промоциите на този салон.');
      }
    } catch (err: any) {
      console.error("Error fetching salon data for promotion:", err);
      setError(err.message || 'Възникна грешка при зареждане на данните за салона.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (details: any, packageId: string) => {
    const chosenPackage = promotionPackages.find(p => p.id === packageId);
    if (!chosenPackage || !salon) {
      setIsLoading(false); // This should be setIsProcessing(null) or similar
      return;
    }

    const now = new Date();
    const expiryDate = addDays(now, chosenPackage.durationDays);
    const updatedPromotion: Promotion = {
      packageId: chosenPackage.id,
      packageName: chosenPackage.name, // Use the correct package name
      isActive: true,
      expiresAt: expiryDate.toISOString(),
      purchasedAt: FirestoreTimestamp.fromDate(now).toDate().toISOString(),
      paymentMethod: 'paypal',
      transactionId: details.id, // Assuming details.id is the transaction ID from PayPal
    };

    if (!salon.id) {
        toast({ title: "Грешка", description: "ID на салона липсва.", variant: "destructive"});
        setIsProcessing(null);
        return;
    }
    const salonRef = doc(firestore, 'salons', salon.id);
    updateDoc(salonRef, { promotion: updatedPromotion })
      .then(() => {
        setSalon(prevSalon => prevSalon ? { ...prevSalon, promotion: updatedPromotion } : null);
        toast({
          title: 'Успешна покупка',
          description: 'Промоцията "' + chosenPackage.name + '" за ' + salon.name + ' е активирана!',
        });
      })
      .catch(err => {
        console.error("Error updating Firestore after payment:", err);
        toast({
          title: 'Грешка при актуализация',
          description: 'Плащането е успешно, но възникна грешка при активиране на промоцията в системата.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsProcessing(null);
      });
  };

  const createOrder = async (packageId: string) => {
    const chosenPackage = promotionPackages.find(p => p.id === packageId);
    if (!chosenPackage || !businessId) {
      toast({ title: "Грешка", description: "Невалиден пакет или ID на бизнеса.", variant: "destructive" });
      throw new Error("Invalid package or business ID");
    }
    setIsProcessing(packageId);
    try {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: chosenPackage.id,
          businessId: businessId,
          amount: chosenPackage.price.toString(),
          currency: PAYPAL_CURRENCY,
          description: 'Промоция: ' + chosenPackage.name + ' за салон ID ' + businessId,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Грешка при създаване на PayPal поръчка.');
      }
      return data.orderID;
    } catch (err: any) {
      console.error("PayPal createOrder error:", err);
      toast({ title: "Грешка с PayPal", description: err.message || "Възникна грешка при създаване на PayPal поръчка.", variant: "destructive" });
      setIsProcessing(null);
      throw err;
    }
  };

  const onApprove = async (data: OnApproveData, actions: OnApproveActions, packageId: string) => {
    if (!actions.order) {
      toast({ title: "Грешка", description: "PayPal actions.order е неопределен.", variant: "destructive" });
      setIsProcessing(null);
      return Promise.reject(new Error("PayPal actions.order undefined"));
    }
    try {
      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderID: data.orderID }),
      });
      const captureData = await response.json();

      if (!response.ok || !captureData.success) {
        throw new Error(captureData.message || 'Грешка при финализиране на PayPal плащането.');
      }

      handlePaymentSuccess(captureData.details, packageId);
      return Promise.resolve();
    } catch (err: any) {
      console.error("PayPal onApprove error:", err);
      toast({ title: "Грешка при плащане", description: err.message || "Възникна грешка при обработка на плащането.", variant: "destructive" });
      return Promise.reject(err);
    } finally {
      setIsProcessing(null);
    }
  };


  const handleStopPromotion = async () => {
    if (!salon || !salon.id || !salon.promotion || !currentUser || !isOwner || isProcessing) return;
    setIsProcessing('stop');
    setError(null);
    try {
      const updatedPromotion: Promotion = { ...salon.promotion, isActive: false };
      const salonRef = doc(firestore, 'salons', salon.id);
      await updateDoc(salonRef, { promotion: updatedPromotion });
      setSalon(prevSalon => prevSalon ? { ...prevSalon, promotion: updatedPromotion } : null);
      toast({
        title: 'Промоцията е спряна',
        description: 'Промоцията за ' + salon.name + ' беше деактивирана.',
      });
    } catch (err: any) {
      console.error("Error stopping promotion:", err);
      setError((err as Error).message || 'Възникна грешка при спиране на промоцията.');
      toast({ title: 'Грешка при спиране', description: 'Неуспешно спиране на промоцията.', variant: 'destructive' });
    } finally {
      setIsProcessing(null);
    }
  };

  const currentPromotion = salon?.promotion;
  const promotionExpiryDate = currentPromotion?.expiresAt ? new Date(currentPromotion.expiresAt) : null;
  const isCurrentlyPromoted = currentPromotion?.isActive && promotionExpiryDate && isFuture(promotionExpiryDate);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-6">
        <Skeleton className="h-8 w-1/3 mb-4" /> <Skeleton className="h-6 w-1/2 mb-8" />
        <Skeleton className="h-32 w-full mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" /> <Skeleton className="h-64" /> <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error && (!salon || !isOwner)) {
    return (
      <div className="container mx-auto py-10 px-6">
        <header className="mb-8">
          <Button onClick={() => router.push('/business/manage')} variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Назад към управление
          </Button>
        </header>
        <div className="border border-red-400 rounded-md bg-red-50 p-4">
          <h4 className="text-lg font-semibold text-red-700 flex items-center"><XCircle className="mr-2 h-6 w-6" /> Грешка</h4>
          <p className="text-sm text-red-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!paypalClientId) {
    return (
      <div className="container mx-auto py-10 px-6">
         <header className="mb-8">
          <Button onClick={() => router.push('/business/manage')} variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Назад към управление
          </Button>
        </header>
        <div className="border border-yellow-400 rounded-md bg-yellow-50 p-4">
          <h4 className="text-lg font-semibold text-yellow-700 flex items-center"><AlertTriangle className="mr-2 h-6 w-6" /> Конфигурационна грешка</h4>
          <p className="text-sm text-yellow-600 mt-2">PayPal Client ID не е конфигуриран. Моля, настройте NEXT_PUBLIC_PAYPAL_CLIENT_ID environment variable.</p>
        </div>
      </div>
    );
  }


  return (
    <PayPalScriptProvider options={paypalScriptOptions}>
      <div className="container mx-auto py-10 px-6">
        <header className="mb-8">
          <Button onClick={() => router.push('/business/manage')} variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Назад към управление
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Промотирай Салон: <span className="text-primary">{salon?.name || 'Неизвестен салон'}</span>
          </h1>
          <p className="text-lg text-muted-foreground">Увеличете видимостта на Вашия салон и привлечете повече клиенти.</p>
        </header>

        {error && isOwner && salon && (
          <div className="border border-red-400 rounded-md bg-red-50 p-4 mb-6">
            <h4 className="text-lg font-semibold text-red-700 flex items-center"><AlertTriangle className="mr-2 h-5 w-5" /> Грешка при операция</h4>
            <p className="text-sm text-red-600 mt-2">{error}</p>
          </div>
        )}

        {salon && isOwner && (
          <>
            <Card className="mb-8 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <CheckCircle className={`mr-2 h-5 w-5 ${isCurrentlyPromoted ? 'text-green-500' : 'text-muted-foreground'}`} />
                  Статус на обекта
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isCurrentlyPromoted && currentPromotion && promotionExpiryDate ? (
                  <div>
                    <p className="text-lg font-semibold text-green-600">
                      Вашият салон е промотиран с пакет "{currentPromotion.packageName || currentPromotion.packageId}"!
                    </p>
                    <p className="text-muted-foreground">
                      Промоцията е активна до: {format(promotionExpiryDate, 'PPP p', { locale: bg })}.
                    </p>
                    <Button onClick={handleStopPromotion} variant="destructive" className="mt-4" disabled={!!isProcessing}>
                      {isProcessing === 'stop' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
                        <CardTitle className="text-xl flex items-center"><Gift className="mr-2 h-5 w-5 text-primary" /> {pkg.name}</CardTitle>
                        <CardDescription>{pkg.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-2xl font-bold text-primary mb-2">{pkg.price} {PAYPAL_CURRENCY}</p>
                        <p className="text-sm text-muted-foreground">Продължителност: {pkg.durationDays} дни</p>
                      </CardContent>
                      <CardFooter className="flex-col items-stretch">
                        {isProcessing === pkg.id && <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-2" />}
                        <PayPalButtons
                          key={`${pkg.id}-${salon.id}`}
                          style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
                          disabled={!!isProcessing || isProcessing === pkg.id}
                          createOrder={() => createOrder(pkg.id)}
                          onApprove={(data, actions) => onApprove(data, actions, pkg.id)}
                          onError={(err: any) => {
                            console.error("PayPal Button onError:", err);
                            let message = "Възникна грешка по време на PayPal процеса.";
                            if (err && err.message) {
                                message = err.message;
                            }
                            toast({ title: "Грешка с PayPal", description: message, variant: "destructive" });
                            setIsProcessing(null);
                          }}
                          onCancel={() => {
                            toast({ title: "Плащането е отказано", description: "Отказахте плащането през PayPal. Моля, опитайте отново, ако желаете.", variant: "default" });
                            setIsProcessing(null);
                          }}
                        />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </PayPalScriptProvider>
  );
}

    