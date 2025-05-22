// This page will handle the redirect after a successful Revolut payment.
// It should verify the payment status (e.g., by retrieving the order or relying on webhook).
// Update the salon's promotion status in your Firestore database.
// Display a success message to the user.

// TODO: Implement logic to verify payment and update database.

'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import type { Promotion } from '@/types';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';


export default function RevolutSuccessPage() {
    const [initialized, setInitialized] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        const orderId = searchParams.get('order_id');
        const salonId = searchParams.get('salonId');

        // Access hooks and client-side APIs only after the component has mounted
        const searchParams = useSearchParams();
        const router = useRouter();
        const firestore = getFirestore();
        const { toast } = useToast();

        const packageId = searchParams.get('packageId'); // Assuming you pass packageId back

        if (!orderId || !salonId || !packageId) {
            setPaymentStatus('failed');
            setErrorMessage('Missing payment information.');
            toast({
                title: 'Payment Failed',
                description: 'Missing payment information.',
                variant: 'destructive',
            });
            return;
        }

        const verifyPaymentAndActivatePromotion = async (uid: string) => {
            try {
                // TODO: Implement server-side verification of the Revolut payment status
                // This is crucial for security. Do NOT rely solely on client-side parameters.
                // You should call a serverless function or API endpoint here that
                // uses your Revolut API key to retrieve the order details and verify its status.
                // Example: const response = await fetch('/api/revolut/verify-payment', { method: 'POST', body: JSON.stringify({ orderId }) });
                // const { success, orderDetails } = await response.json();

                // For now, we'll simulate a successful verification based on the presence of orderId.
                // **REPLACE THIS WITH REAL SERVER-SIDE VERIFICATION**
                const isPaymentSuccessful = true; // Replace with actual verification result
                const verifiedOrderDetails = {
                  id: orderId,
                  state: 'COMPLETED', // Example state
                  amount: 1000, // Example amount in minor units
                  currency: 'BGN', // Example currency
                  created_at: new Date().toISOString(), // Example
                };


                if (isPaymentSuccessful && verifiedOrderDetails.state === 'COMPLETED') {
                    const promotionPackages = [
                        { id: '7days', name: '7 Дни Промоция', durationDays: 7, price: 10 },
                        { id: '30days', name: '30 Дни Промоция', durationDays: 30, price: 35 },
                        { id: '90days', name: '90 Дни Промоция', durationDays: 90, price: 90 },
                    ];

                    const selectedPackage = promotionPackages.find(p => p.id === packageId);

                    if (!selectedPackage) {
                         setPaymentStatus('failed');
                         setErrorMessage('Invalid promotion package.');
                         toast({
                             title: 'Activation Failed',
                             description: 'Invalid promotion package.',
                             variant: 'destructive',
                         });
                         return;
                    }

                    const purchasedAt = new Date();
                    const expiresAt = new Date(purchasedAt);
                    expiresAt.setDate(purchasedAt.getDate() + selectedPackage.durationDays);

                    const newPromotion: Promotion = {
                        isActive: true,
                        packageId: selectedPackage.id,
                        packageName: selectedPackage.name,
                        purchasedAt: purchasedAt.toISOString(),
                        expiresAt: expiresAt.toISOString(),
                    };

                    const salonRef = doc(firestore, 'salons', salonId);
                    await updateDoc(salonRef, { promotion: newPromotion });

                    setPaymentStatus('success');
                    setSuccessMessage(`Промоцията "${selectedPackage.name}" за вашия салон е успешно активирана до ${format(expiresAt, 'PPP p', { locale: bg })}.`);
                    toast({
                        title: 'Промоцията е активирана!',
                        description: `Вашият салон вече е промотиран.`,
                    });

                } else {
                    setPaymentStatus('failed');
                    setErrorMessage('Payment verification failed.');
                    toast({
                        title: 'Payment Failed',
                        description: 'Payment verification failed.',
                        variant: 'destructive',
                    });
                }
            } catch (error) {
                console.error('Error verifying payment or activating promotion:', error);
                setPaymentStatus('failed');
                setErrorMessage('An error occurred while processing your payment.');
                toast({
                    title: 'Error',
                    description: 'An error occurred while processing your payment.',
                    variant: 'destructive',
                });
            }
        };

         // Ensure user is authenticated before attempting to update Firestore
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                verifyPaymentAndActivatePromotion(user.uid);
            } else {
                 setPaymentStatus('failed');
                 setErrorMessage('User not authenticated.');
                 toast({
                     title: 'Error',
                     description: 'User not authenticated.',
                     variant: 'destructive',
                 });
            }
        });

        return () => unsubscribe();


    }, [searchParams]); // Depend on searchParams to re-run if they change

    return (
        <div className="container mx-auto py-10 px-6 text-center">
            {paymentStatus === 'verifying' && (
                <>
                    <div className="flex items-center justify-center mb-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">Проверяване на плащането...</h2>
                    <p className="text-muted-foreground">Моля, изчакайте, докато потвърждаваме Вашето плащане.</p>
                </>
            )}
            {paymentStatus === 'success' && (
                <>
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                    <h2 className="text-2xl font-semibold text-green-600 mb-2">Плащането е успешно!</h2>
                    <p className="text-muted-foreground mb-6">{successMessage}</p>
                    <Button onClick={() => router.push('/business/manage')}>
                        Към управление на бизнеси
                    </Button>
                </>
            )}
            {paymentStatus === 'failed' && (
                <>
                    <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                    <h2 className="text-2xl font-semibold text-destructive mb-2">Плащането е неуспешно</h2>
                    <p className="text-muted-foreground mb-6">{errorMessage}</p>
                    <Button onClick={() => router.push(`/business/promote/${searchParams.get('salonId')}`)} variant="destructive">
                       Опитайте отново
                    </Button>
                     <Button onClick={() => router.push('/business/manage')} variant="outline" className="ml-4">
                        Към управление на бизнеси
                    </Button>
                </>
            )}
        </div>
    );
}