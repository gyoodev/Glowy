
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import type { Review, Salon } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { ReviewCard } from '@/components/salon/review-card';
import { AlertTriangle, MessageSquare, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SalonReviewsPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = typeof params?.businessId === 'string' ? params.businessId : null;
  const firestore = getFirestore();
  const { toast } = useToast();

  const [salon, setSalon] = useState<Salon | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!businessId) {
      setError('Невалиден ID на бизнес.');
      setIsLoading(false);
      return;
    }
    if (!currentUser) {
      return;
    }

    const fetchSalonAndReviews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const salonRef = doc(firestore, 'salons', businessId);
        const salonSnap = await getDoc(salonRef);

        if (!salonSnap.exists()) {
          setError(`Салон с ID ${businessId} не е намерен.`);
          setSalon(null);
          setIsLoading(false);
          return;
        }

        const salonData = { id: salonSnap.id, ...salonSnap.data() } as Salon;
        setSalon(salonData);

        if (salonData.ownerId !== currentUser.uid) {
          setError('Нямате права за достъп до отзивите на този салон.');
          setIsOwner(false);
          setIsLoading(false);
          return;
        }
        setIsOwner(true);

        const reviewsQuery = query(
          collection(firestore, 'reviews'),
          where('salonId', '==', businessId),
          orderBy('date', 'desc')
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        
        const fetchedReviews: Review[] = [];
        reviewsSnapshot.forEach((reviewDoc) => {
          fetchedReviews.push({ id: reviewDoc.id, ...reviewDoc.data() } as Review);
        });
        setReviews(fetchedReviews);

      } catch (err: any) {
        console.error("Error fetching salon reviews:", err);
        setError('Възникна грешка при зареждане на отзивите.');
        if (err.code === 'permission-denied') {
          setError('Грешка: Нямате права за достъп до тези данни. Моля, проверете Firestore правилата.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalonAndReviews();
  }, [currentUser, businessId, firestore]);

  // Placeholder for reply functionality
  const handleReplyToReview = (reviewId: string, replyText: string) => {
    toast({
      title: 'Симулация на отговор',
      description: `Отговорът към отзив ${reviewId} би бил: "${replyText}"`,
    });
    // TODO: Implement actual reply saving to Firestore
  };


  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-6">
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-md">
                <Skeleton className="h-5 w-1/3 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
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
        <Button onClick={() => router.push('/business/manage')}>
          Обратно към управление на бизнеси
        </Button>
      </div>
    );
  }

  if (!isOwner && !isLoading) {
     return (
      <div className="container mx-auto py-10 px-6 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Достъп отказан</h2>
        <p className="text-muted-foreground mb-6">Нямате права за достъп до тази страница.</p>
        <Button onClick={() => router.push('/business/manage')}>
          Обратно към управление на бизнеси
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-6">
       <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Отзиви за: <span className="text-primary">{salon?.name || 'Зареждане...'}</span>
          </h1>
          <p className="text-lg text-muted-foreground">Преглед на отзивите, оставени от клиенти за Вашия салон.</p>
        </div>
        <Button onClick={() => router.back()} variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Обратно
        </Button>
      </header>

      {reviews.length === 0 ? (
        <Card className="text-center py-12">
           <CardHeader>
            <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl font-semibold">Няма намерени отзиви</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-muted-foreground">
              Все още няма оставени отзиви за този салон.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id}>
              <ReviewCard review={review} />
              {/* Placeholder for reply UI - to be implemented later */}
              {/* 
              <div className="mt-2 pl-10">
                <Textarea placeholder="Напишете отговор..." rows={2} className="mb-2" />
                <Button size="sm" onClick={() => handleReplyToReview(review.id, "Примерен отговор")}>Изпрати отговор</Button>
              </div>
              */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

