
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, type User as FirebaseUser, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { Salon, Promotion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, Gift, Tag, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, isFuture } from 'date-fns';
import { bg } from 'date-fns/locale/bg';

const promotionPackages = [
  { id: '7days', name: '7 Дни Промоция', durationDays: 7, price: 5, description: 'Вашият салон на челни позиции за 1 седмица.' },
  { id: '30days', name: '30 Дни Промоция', durationDays: 30, price: 15, description: 'Максимална видимост за цял месец.' },
  { id: '90days', name: '90 Дни Промоция', durationDays: 90, price: 35, description: 'Най-изгодният пакет за дългосрочен ефект.' },
];

export default function PromoteBusinessPage() {
  const params = useParams();
  const router = useRouter();
  const firestore = getFirestore();
  const { toast } = useToast();
  const [salon, setSalon] = useState<Salon | null>(null); // This state variable is correct
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Safer way to access businessId and handle null/invalid cases
  const businessId = typeof params?.businessId === 'string' ? params.businessId : null;

  if (!businessId) {
    return <div className="container mx-auto py-10 px-6">Invalid business ID</div>;
  }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, router]);


  // Replace the existing handleBuyPromotion
  const handleBuyPromotion = async (packageId: string) => {
    if (!salon || !currentUser || !isOwner) return;

    const chosenPackage = promotionPackages.find(p => p.id === packageId);
    if (!chosenPackage) {
      toast({
        title: 'Грешка',
        description: 'Невалиден промоционален пакет.',
        variant: 'destructive',
      });
      return;
    }
    setIsProcessing(true);
    setSelectedPackageId(packageId);
    setError(null);
    try {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: chosenPackage.id,
          businessId: salon.id,
          amount: chosenPackage.price,
          currency: 'BGN',
          description: `Promotion package: ${chosenPackage.name} for ${salon.name}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error creating payment order:", errorData);
        throw new Error(errorData.message || 'Failed to create payment order');
      }

      const order = await response.json();

      // Find the 'approve' link and redirect the user
      const approveLink = order.links?.find((link: any) => link.rel === 'approve');

      if (approveLink && approveLink.href) {
        window.location.href = approveLink.href;
      } else {
        throw new Error('Could not find approval URL from PayPal');
      }
    } catch (err: any) {
      console.error("Error initiating payment:", err);
      setError(err.message || 'Възникна грешка при стартиране на плащането.');
      toast({
        title: 'Грешка при покупка',
        description: err.message || 'Неуспешно стартиране на плащане.',
        variant: 'destructive',
      });
    } finally {
      // Do NOT set isProcessing to false here if you are redirecting or waiting for a modal
      // Set it to false only if the payment flow fails immediately
      setIsProcessing(false); // Set to false if no redirect is immediately happening
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
    // Note: After stopping, we don\'t clear selectedPackageId as the user might choose to buy again
    setSelectedPackageId(null); // Clear selected package on stop
  };


  const currentPromotion = salon?.promotion;
  const isCurrentlyPromoted = currentPromotion?.isActive && currentPromotion.expiresAt && isFuture(new Date(currentPromotion.expiresAt));

  return (
    <div>Temporary Content</div>
  );
}