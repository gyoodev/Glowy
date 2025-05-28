
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc, Timestamp as FirestoreTimestamp, FieldValue } from 'firebase/firestore';
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
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { StripeCardElementOptions } from '@stripe/stripe-js';

const promotionPackages = [
  { id: '7days', name: 'Сребърен план', durationDays: 7, price: 5, description: 'Вашият салон на челни позиции за 1 седмица.' },
  { id: '30days', name: 'Златен план', durationDays: 30, price: 15, description: 'Максимална видимост за цял месец.' },
  { id: '90days', name: 'Диамантен план', durationDays: 90, price: 35, description: 'Най-изгодният пакет за дългосрочен ефект.' },
];

const STRIPE_CURRENCY = "EUR"; // Stripe uses lowercase for currency

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const cardElementOptions: StripeCardElementOptions = {
  style: {
    base: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a",
    },
  },
  hidePostalCode: true,
};

interface CheckoutFormProps {
  packageId: string;
  amount: number;
  currency: string;
  businessId: string;
  salonName: string;
  onPaymentSuccess: (details: any, packageId: string) => void;
  setIsProcessing: (isProcessing: string | null) => void;
  isProcessing: boolean;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ packageId, amount, currency, businessId, salonName, onPaymentSuccess, setIsProcessing, isProcessing }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsProcessing(packageId);

    if (!stripe || !elements) {
      toast({ title: "Грешка", description: "Stripe не е зареден правилно.", variant: "destructive" });
      setIsProcessing(null);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast({ title: "Грешка", description: "Картовият елемент не е намерен.", variant: "destructive" });
      setIsProcessing(null);
      return;
    }

    try {
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message || 'Грешка при създаване на метод за плащане.');
      }

      // Placeholder: Make API call to create PaymentIntent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount * 100, // Stripe expects amount in cents
          currency: currency.toLowerCase(),
          packageId,
          businessId,
          salonName,
          paymentMethodId: paymentMethod.id,
        }),
      });

      const paymentIntentResponse = await response.json();

      if (!response.ok || !paymentIntentResponse.success) {
        throw new Error(paymentIntentResponse.message || 'Грешка при създаване на намерение за плащане.');
      }
      
      // Placeholder: Confirm card payment (normally the server confirms after webhook)
      // For this client-side simulation, we'll assume it's confirmed by the API route
      // In a real scenario, the server would confirm the PaymentIntent and update Firestore.
      // The client might just get a success message or poll for status.
      console.log('Simulating payment confirmation for package:', packageId, 'PaymentIntent Client Secret:', paymentIntentResponse.clientSecret);
      
      // Simulate success and update Firestore directly for now
      const chosenPackage = promotionPackages.find(p => p.id === packageId);
      if (!chosenPackage) {
        throw new Error("Избраният пакет не е намерен.");
      }

      const now = new Date();
      const expiryDate = addDays(now, chosenPackage.durationDays);
      const newPromotion: Promotion = {
        isActive: true,
        packageId: chosenPackage.id,
        packageName: chosenPackage.name,
        purchasedAt: FirestoreTimestamp.fromDate(now) as any, // Use Firestore Timestamp for server
        expiresAt: expiryDate.toISOString(),
        paymentMethod: 'stripe', // Changed from paypal
        transactionId: paymentMethod.id, // Using PaymentMethod ID as a placeholder transaction ID
      };

      const salonRef = doc(firestore, 'salons', businessId);
      await updateDoc(salonRef, { promotion: newPromotion });

      onPaymentSuccess({ id: paymentMethod.id /* Mocking details */ }, packageId);

    } catch (err: any) {
      console.error("Stripe payment error:", err);
      toast({ title: "Грешка при плащане", description: err.message || "Възникна грешка при обработка на плащането.", variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardElement options={cardElementOptions} />
      <Button type="submit" className="w-full" disabled={!stripe || isProcessing}>
        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
        Плати {amount} {currency.toUpperCase()}
      </Button>
    </form>
  );
};


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

  const businessId = typeof params?.businessId === 'string' ? params.businessId : null;
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;


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

  const handlePaymentSuccess = (details: any, packageId: string) => {
    const chosenPackage = promotionPackages.find(p => p.id === packageId);
    if (!chosenPackage || !salon) {
      setIsProcessing(null);
      return;
    }
    // This part is now effectively handled within CheckoutForm for Stripe
    // For PayPal, it was here. For Stripe, the Firestore update simulation is in CheckoutForm.
    // A real implementation would rely on a server response after webhook.
    fetchSalonData(currentUser!.uid); // Re-fetch salon data to show updated promotion status
    toast({
      title: 'Успешна покупка',
      description: 'Промоцията "' + chosenPackage.name + '" за ' + salon.name + ' е активирана!',
    });
    setIsProcessing(null);
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
      fetchSalonData(currentUser.uid); // Re-fetch salon data
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

  if (!stripePromise || !stripePublishableKey) {
    return (
      <div className="container mx-auto py-10 px-6">
         <header className="mb-8">
          <Button onClick={() => router.push('/business/manage')} variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Назад към управление
          </Button>
        </header>
        <div className="border border-yellow-400 rounded-md bg-yellow-50 p-4">
          <h4 className="text-lg font-semibold text-yellow-700 flex items-center"><AlertTriangle className="mr-2 h-6 w-6" /> Конфигурационна грешка</h4>
          <p className="text-sm text-yellow-600 mt-2">Stripe Publishable Key не е конфигуриран. Моля, настройте NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable.</p>
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
              <Elements stripe={stripePromise}>
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
                          <p className="text-2xl font-bold text-primary mb-2">{pkg.price} {STRIPE_CURRENCY.toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">Продължителност: {pkg.durationDays} дни</p>
                        </CardContent>
                        <CardFooter className="flex-col items-stretch space-y-2">
                           <CheckoutForm
                              packageId={pkg.id}
                              amount={pkg.price}
                              currency={STRIPE_CURRENCY}
                              businessId={businessId!}
                              salonName={salon.name}
                              onPaymentSuccess={handlePaymentSuccess}
                              setIsProcessing={setIsProcessing}
                              isProcessing={isProcessing === pkg.id}
                           />
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </section>
              </Elements>
            )}
          </>
        )}
      </div>
  );
}
