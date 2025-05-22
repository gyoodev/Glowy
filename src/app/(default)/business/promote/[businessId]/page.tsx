
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, type User as FirebaseUser, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { Salon, Promotion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, Gift, Tag, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, isFuture } from 'date-fns';
import { RevolutCheckout } from '@revolut/checkout';
import type { RevolutCheckoutInstance } from '@revolut/checkout';
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

  const [revolutCheckout, setRevolutCheckout] = useState<RevolutCheckoutInstance | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
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

  // Initialize Revolut Checkout
  useEffect(() => {
    const rc = new RevolutCheckout(process.env.NEXT_PUBLIC_REVOLUT_PUBLIC_API_KEY!, { // Replace with your Revolut Public API Key
      // Configure other options as needed, e.g., environment: 'sandbox' or 'production'
    });
    setRevolutCheckout(rc);
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
  }, [businessId, router]);


  // Replace the existing handleBuyPromotion
  const handleBuyPromotion = async (packageId: string) => {
    if (!salon || !currentUser || !isOwner) return;
    setIsProcessing(true);

    const selectedPackage = promotionPackages.find(p => p.id === packageId);
    if (!selectedPackage) {
      toast({ title: 'Грешка', description: 'Избраният пакет не е валиден.', variant: 'destructive' });
      setIsProcessing(false);
      return;
    }
    setSelectedPackageId(packageId); // Set selected package for payment options
    setError(null); // Clear any previous errors

    if (!revolutCheckout) {
      toast({ title: 'Грешка', description: 'Revolut Checkout не е зареден правилно.', variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    try {
      // Call your backend endpoint to create a Revolut payment order
      const response = await fetch('/api/revolut/create-payment-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          businessId: salon.id,
          amount: selectedPackage.price * 100, // Amount in cents
          currency: 'BGN', // Replace with your currency
          description: `Promotion package: ${selectedPackage.name} for ${salon.name}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error creating Revolut payment order:", errorData);
        throw new Error(errorData.message || 'Failed to create Revolut payment order');
      }

      const order = await response.json();

      // Initiate the Revolut Checkout flow with the order ID
      revolutCheckout.payments.create({
        publicId: order.public_id, // Use public_id from the created order
        onSuccess: () => {
          // Handle successful payment - fulfillment should happen via webhook
          toast({
            title: 'Плащане успешно!',
            description: 'Вашата промоция ще бъде активирана скоро.',
          });
          // You might redirect the user to a success page here
          router.push(`/business/promote/revolut-success?order_id=${order.id}`);
        },
        onCancel: () => {
          // Handle cancelled payment
          toast({
            title: 'Плащане отказано',
            description: 'Покупката на промоцията беше отказана.',
            variant: 'destructive',
          });
          router.push(`/business/promote/revolut-cancel?order_id=${order.id}`);
        },
        onError: (error) => {
          console.error("Revolut Checkout error:", error);
          toast({
            title: 'Грешка при плащане',
            description: error.message || 'Неуспешно завършване на плащането.',
            variant: 'destructive',
          });
          setIsProcessing(false); // Allow retrying
        },
      });

      // For card payments, you might need to display a form and use Revolut's card payment API
      // within the payment flow initiated by revolutCheckout.payments.create

    } catch (err: any) {
      console.error("Error initiating Revolut checkout:", err);
      setError(err.message || 'Възникна грешка при стартиране на плащането.');
      toast({
        title: 'Грешка при покупка',
        description: err.message || 'Неуспешно стартиране на плащане.',
        variant: 'destructive',
      });
    } finally {
      // Do NOT set isProcessing to false here if you are redirecting or waiting for a modal
      // Set it to false only if the payment flow fails immediately
      // If using redirects, set isProcessing to false on the success/cancel pages
    }
  };


  // Keep the handleStopPromotion function
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
    // Note: After stopping, we don't clear selectedPackageId as the user might choose to buy again
    setSelectedPackageId(null); // Clear selected package on stop
  };

  useEffect(() => {
    // Check if there are query parameters indicating a successful or failed payment
    // This is a basic client-side check. Fulfillment should happen via webhook.
    const query = new URLSearchParams(window.location.search);
    const revolutStatus = query.get('revolut_status');
    const orderId = query.get('order_id'); // Assuming your redirects include order_id

    if (revolutStatus === 'success' && orderId) {
      toast({
        title: 'Плащане успешно!',
        description: 'Вашата промоция ще бъде активирана скоро.',
      });
      // Clean the URL
      router.replace(window.location.pathname, undefined, { shallow: true });
    }

  }, [router, firestore, salon?.id]); // Depend on router and potentially salon.id and firestore

  // Function to update Firestore after a successful payment (Stripe webhook or PayPal success)
  // This function is called by your *backend* webhook handler or successful payment endpoint,
  // NOT directly from the client-side render or useEffect for fulfillment.
  // This is kept here only as a conceptual representation of what your backend would do.
  const updatePromotionInFirestore = async (paymentDetails: { packageId: string; businessId: string; paymentMethod: 'stripe' | 'paypal'; transactionId: string }) => {
    if (!paymentDetails?.businessId || !paymentDetails?.packageId) {
      console.error("Missing required payment details for Firestore update.");
      return;
    }

    const selectedPackage = promotionPackages.find(p => p.id === paymentDetails.packageId);

    if (!selectedPackage) {
      console.error("Could not find package details for Firestore update.");
      return;
    }

    const purchasedAt = new Date(); // Use server time in a real webhook
    const expiresAt = addDays(purchasedAt, selectedPackage.durationDays);

    const newPromotion: Promotion = {
      isActive: true,
      packageId: selectedPackage.id,
      packageName: selectedPackage.name,
      purchasedAt: Timestamp.fromDate(purchasedAt).toDate().toISOString(), // Store as ISO string, use Timestamp in Firestore for server date
      expiresAt: expiresAt.toISOString(),
      paymentMethod: paymentDetails.paymentMethod,
      transactionId: paymentDetails.transactionId, // Store transaction ID
    };

    try {
      const salonRef = doc(firestore, 'salons', paymentDetails.businessId); // Use businessId from payment details
      await updateDoc(salonRef, { promotion: newPromotion });
      console.log("Salon promotion updated successfully after payment.");
    } catch (err) {
      console.error("Error updating salon promotion after payment:", err);
    }
  };


  const currentPromotion = salon?.promotion;
  const isCurrentlyPromoted = currentPromotion?.isActive && currentPromotion.expiresAt && isFuture(new Date(currentPromotion.expiresAt));

  return (
    <div className="container mx-auto py-10 px-6">
      <header className="mb-8">
        <Button onClick={() => router.push('/business/manage')} variant="outline" size="sm" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад към управление
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Промотирай Салон: <span className="text-primary">{salon?.name || 'Зареждане...'}</span>
        </h1>
        <p className="text-lg text-muted-foreground">Увеличете видимостта на Вашия салон и привлечете повече клиенти.</p>
      </header>

      {salon && ( // Render status card only if salon data is loaded
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <CheckCircle className={`mr-2 h-5 w-5 ${isCurrentlyPromoted ? 'text-green-500' : 'text-muted-foreground'}`} />
              Статус на обекта
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
      )}

      {!isCurrentlyPromoted && ( // Only show packages if not currently promoted
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
                    disabled={isProcessing || !isOwner || !revolutCheckout} // Disable if Revolut is not loaded
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
