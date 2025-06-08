
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script'; // Import Next.js Script component
import { getFirestore, doc, getDoc, updateDoc, Timestamp as FirestoreTimestamp, FieldValue, addDoc, collection } from 'firebase/firestore';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, firestore } from '@/lib/firebase';
import type { Salon, Promotion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, Gift, Loader2, ArrowLeft, XCircle, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, isFuture } from 'date-fns';
import { bg } from 'date-fns/locale';
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

// Extend window type for PayPal
declare global {
  interface Window {
    paypal?: any;
  }
}

const promotionPackages = [
  { id: '7days', name: 'Сребърен план', durationDays: 7, price: 5, description: 'Вашият салон на челни позиции за 1 седмица.', hostedButtonId: '36RPT2GTKL63U' },
  { id: '30days', name: 'Златен план', durationDays: 30, price: 15, description: 'Максимална видимост за цял месец.' },
  { id: '90days', name: 'Диамантен план', durationDays: 90, price: 35, description: 'Най-изгодният пакет за дългосрочен ефект.' },
];

const PAYPAL_CURRENCY = "EUR";

export default function PromoteBusinessPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPayPalHostedSDKLoaded, setIsPayPalHostedSDKLoaded] = useState(false);

  const businessId = typeof params?.businessId === 'string' ? params.businessId : null;
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

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

  useEffect(() => {
    if (isPayPalHostedSDKLoaded) {
      const silverPlanPackage = promotionPackages.find(p => p.id === '7days');
      if (silverPlanPackage && silverPlanPackage.hostedButtonId) {
        const containerId = `paypal-container-${silverPlanPackage.hostedButtonId}`;
        const container = document.getElementById(containerId);
        if (container) {
          if (window.paypal && window.paypal.HostedButtons) {
            try {
              // Check if button is already rendered to prevent errors on re-renders
              if (!container.hasChildNodes() || container.innerHTML.trim() === '') {
                window.paypal.HostedButtons({
                  hostedButtonId: silverPlanPackage.hostedButtonId
                }).render(`#${containerId}`);
                console.log(`PayPal Hosted Button ${silverPlanPackage.hostedButtonId} rendered.`);
              }
            } catch (renderError) {
              console.error("Error rendering PayPal Hosted Button:", renderError);
              toast({
                title: "Грешка с PayPal бутона",
                description: "Не можа да се зареди PayPal бутонът за Сребърен план. Моля, опитайте по-късно.",
                variant: "destructive",
              });
            }
          } else {
            console.warn("PayPal HostedButtons SDK not fully ready in useEffect despite isPayPalHostedSDKLoaded=true.");
          }
        }
      }
    }
  }, [isPayPalHostedSDKLoaded, toast]);


  const handlePaymentSuccess = async (details: any, packageId: string, paymentMethod: 'paypal') => {
    const chosenPackage = promotionPackages.find(p => p.id === packageId);
    if (!chosenPackage || !salon || !currentUser) {
        setIsProcessing(null);
        toast({ title: "Грешка", description: "Не може да се обработи плащането. Липсва информация.", variant: "destructive" });
        return;
    }

    const now = new Date();
    const expiryDate = addDays(now, chosenPackage.durationDays);
    const newPromotion: Promotion = {
        isActive: true,
        packageId: chosenPackage.id,
        packageName: chosenPackage.name,
        purchasedAt: FirestoreTimestamp.fromDate(now) as any, 
        expiresAt: expiryDate.toISOString(),
        paymentMethod: paymentMethod,
        transactionId: details.id || (details.orderID ? details.orderID : 'N/A'),
    };

    try {
        const salonRef = doc(firestore, 'salons', salon.id);
        await updateDoc(salonRef, { promotion: newPromotion });

        await addDoc(collection(firestore, 'promotionsPayments'), {
            businessId: salon.id,
            businessName: salon.name,
            promotionId: chosenPackage.id,
            promotionDetails: chosenPackage.name + " - " + chosenPackage.durationDays + " дни",
            amount: chosenPackage.price,
            currency: PAYPAL_CURRENCY,
            status: 'completed',
            paymentMethod: paymentMethod,
            transactionId: newPromotion.transactionId,
            createdAt: FirestoreTimestamp.fromDate(now),
            userId: currentUser.uid,
        });

        fetchSalonData(currentUser.uid); 
        toast({
            title: 'Успешна покупка',
            description: 'Промоцията "' + chosenPackage.name + '" за ' + salon.name + ' е активирана!',
        });
    } catch (dbError: any) {
        console.error("Error updating Firestore after payment:", dbError);
        toast({ title: "Грешка при запис", description: "Плащането е успешно, но имаше проблем с активирането на промоцията. Моля, свържете се с поддръжката.", variant: "destructive" });
    } finally {
        setIsProcessing(null);
    }
  };

  const handleStopPromotion = async () => {
    if (!salon || !salon.id || !salon.promotion || !currentUser || !isOwner || isProcessing) return;
    setIsProcessing('stop');
    setError(null);
    try {
      const salonRef = doc(firestore, 'salons', salon.id);
      await updateDoc(salonRef, {
        'promotion.isActive': false,
      });
      fetchSalonData(currentUser.uid);
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

  return (
      <div className="container mx-auto py-10 px-6">
        <Script
          src="https://www.paypal.com/sdk/js?client-id=BAAS_0VWHm4WLTs3PoHtuCDAfHCWrowMXnGsc2P0u0QO8m1KUhpw78ViY1I-yRhnKCLVzh1fBT9Do088_U&components=hosted-buttons&disable-funding=venmo&currency=EUR"
          strategy="afterInteractive"
          onLoad={() => {
            console.log("PayPal Hosted Button SDK loaded.");
            setIsPayPalHostedSDKLoaded(true);
          }}
          onError={(e) => {
            console.error("Error loading PayPal Hosted Button SDK:", e);
            toast({
              title: "Грешка при зареждане на PayPal SDK",
              description: "Не може да се зареди модулът за плащане. Моля, опитайте отново по-късно.",
              variant: "destructive",
            });
          }}
        />
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
                        <p className="text-2xl font-bold text-primary mb-2">{pkg.price} {PAYPAL_CURRENCY.toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">Продължителност: {pkg.durationDays} дни</p>
                      </CardContent>
                      <CardFooter className="flex-col items-stretch space-y-2">
                        {pkg.id === '7days' && pkg.hostedButtonId ? (
                          <div id={`paypal-container-${pkg.hostedButtonId}`} className="w-full min-h-[50px]">
                            {/* PayPal Hosted Button will render here via useEffect */}
                            {!isPayPalHostedSDKLoaded && isProcessing !== `paypal_${pkg.id}` && (
                               <Button className="w-full" disabled>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Зареждане на PayPal...
                              </Button>
                            )}
                          </div>
                        ) : paypalClientId ? (
                          <PayPalScriptProvider options={{ "clientId": paypalClientId, currency: PAYPAL_CURRENCY }}>
                            {isProcessing === `paypal_${pkg.id}` ? (
                                <Button className="w-full" disabled>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Обработка...
                                </Button>
                            ) : (
                                <PayPalButtons
                                    key={pkg.id}
                                    style={{ layout: "vertical", label: "pay", height: 40 }}
                                    disabled={!!isProcessing && isProcessing !== `paypal_${pkg.id}`}
                                    createOrder={async (data, actions) => {
                                        setIsProcessing(`paypal_${pkg.id}`);
                                        try {
                                            const response = await fetch('/api/paypal/create-order', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    amount: pkg.price.toString(),
                                                    currency: PAYPAL_CURRENCY,
                                                    packageId: pkg.id,
                                                    businessId: businessId,
                                                    description: `${pkg.name} - ${salon?.name || 'Salon'}`
                                                }),
                                            });
                                            const orderData = await response.json();
                                            if (!orderData.success || !orderData.orderID) {
                                                throw new Error(orderData.message || 'Failed to create PayPal order from API.');
                                            }
                                            return orderData.orderID;
                                        } catch (apiError: any) {
                                            console.error("Error creating PayPal order via API:", apiError);
                                            toast({ title: "Грешка при PayPal", description: apiError.message || "Неуспешно създаване на поръчка. Моля, опитайте отново.", variant: "destructive" });
                                            setIsProcessing(null);
                                            return Promise.reject(apiError);
                                        }
                                    }}
                                    onApprove={async (data, actions) => {
                                        try {
                                            const response = await fetch('/api/paypal/capture-order', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ orderID: data.orderID }),
                                            });
                                            const captureData = await response.json();
                                            if (!captureData.success) {
                                                throw new Error(captureData.message || 'PayPal capture failed.');
                                            }
                                            handlePaymentSuccess({ id: data.orderID, ...captureData.details }, pkg.id, 'paypal');
                                        } catch (captureError: any) {
                                            console.error("Error capturing PayPal order via API:", captureError);
                                            toast({ title: "Грешка при PayPal", description: captureError.message || "Неуспешно финализиране на плащането. Свържете се с поддръжка ако сумата е удържана.", variant: "destructive" });
                                            setIsProcessing(null);
                                        }
                                    }}
                                    onError={(err) => {
                                        console.error("PayPal Buttons Error:", err);
                                        toast({ title: "Грешка при PayPal", description: "Възникна грешка с PayPal. Моля, опитайте отново или изберете друг метод.", variant: "destructive" });
                                        setIsProcessing(null);
                                    }}
                                    onCancel={() => {
                                        toast({ title: "Плащането е отказано", description: "Вие отказахте плащането през PayPal.", variant: "default" });
                                        setIsProcessing(null);
                                    }}
                                />
                            )}
                          </PayPalScriptProvider>
                        ) : (
                           <Card className="mt-6 col-span-full">
                              <CardHeader>
                                  <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2" />PayPal Не е Конфигуриран</CardTitle>
                              </CardHeader>
                              <CardContent>
                                  <p className="text-muted-foreground">
                                      Плащанията с PayPal не са активни, тъй като PayPal Client ID не е настроен. Моля, конфигурирайте <code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code>.
                                  </p>
                              </CardContent>
                          </Card>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </section>
            )}
             {!isCurrentlyPromoted && (!paypalClientId && !promotionPackages.some(p => p.id === '7days' && p.hostedButtonId)) && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2" />PayPal Не е Конфигуриран</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Плащанията с PayPal не са активни, тъй като PayPal Client ID (NEXT_PUBLIC_PAYPAL_CLIENT_ID) не е настроен за стандартните бутони и/или хостнатият бутон не е наличен.
                        </p>
                    </CardContent>
                </Card>
            )}
          </>
        )}
      </div>
  );
}
