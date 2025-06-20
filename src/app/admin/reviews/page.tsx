
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getFirestore, collection, getDocs, query, orderBy, doc, deleteDoc, getDoc as getFirestoreDoc } from 'firebase/firestore';
import Link from 'next/link';
import { auth, getUserProfile, firestore as db } from '@/lib/firebase'; 
import type { Review as ReviewType, Salon, UserProfile } from '@/types'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import { AlertTriangle, Edit3, MessageSquare, Trash2, Loader2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mapReview, mapSalon, mapUserProfile } from '@/utils/mappers';

interface ExtendedReview extends ReviewType {
  salonName?: string;
  clientName?: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ExtendedReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Store ID of review being deleted
  const { toast } = useToast();
  const firestoreInstance = getFirestore(auth.app); 

  const fetchReviewsWithDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const reviewsCollectionRef = collection(firestoreInstance, 'reviews');
      const q = query(reviewsCollectionRef, orderBy('date', 'desc'));
      const reviewsSnapshot = await getDocs(q);
      
      const reviewsListPromises = reviewsSnapshot.docs.map(async (reviewDoc) => {
        const mappedReview = mapReview(reviewDoc.data(), reviewDoc.id);
        let salonName = 'Неизвестен салон';
        let clientName = 'Неизвестен клиент';

        if (mappedReview.salonId) {
          try {
            const salonRef = doc(firestoreInstance, 'salons', mappedReview.salonId);
            const salonSnap = await getFirestoreDoc(salonRef);
            if (salonSnap.exists()) {
              salonName = mapSalon(salonSnap.data(), salonSnap.id).name || salonName;
            }
          } catch (salonError) {
            console.warn(`Could not fetch salon name for salonId ${mappedReview.salonId}:`, salonError);
          }
        }

        if (mappedReview.userId) {
          try {
            const userProfile = await getUserProfile(mappedReview.userId);
            clientName = userProfile?.name || userProfile?.displayName || clientName;
          } catch (userError) {
            console.warn(`Could not fetch client name for userId ${mappedReview.userId}:`, userError);
          }
        } else if (mappedReview.userName) {
            clientName = mappedReview.userName; // Fallback to userName if userId is missing
        }


        return {
          ...mappedReview,
          salonName,
          clientName,
        };
      });
      const resolvedReviews = await Promise.all(reviewsListPromises);
      setReviews(resolvedReviews);
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      setError('Неуспешно зареждане на отзивите. Моля, проверете Firestore правилата и името на колекцията.');
      toast({ title: "Грешка", description: "Неуспешно зареждане на отзивите.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [firestoreInstance, toast]);

  useEffect(() => {
    fetchReviewsWithDetails();
  }, [fetchReviewsWithDetails]);

  const handleDeleteReview = async (reviewId: string, reviewSalonId?: string) => {
    if (!window.confirm(`Сигурни ли сте, че искате да изтриете този отзив (ID: ${reviewId})? Тази операция е необратима.`)) {
      return;
    }
    setIsDeleting(reviewId);
    try {
      const reviewRef = doc(firestoreInstance, 'reviews', reviewId);
      await deleteDoc(reviewRef);

      // Optional: Update salon's average rating and review count.
      // This is a more complex operation and might be better handled by a Cloud Function
      // to ensure atomicity, especially if multiple admins could delete reviews concurrently.
      // For now, we'll just delete the review and refresh.
      if (reviewSalonId) {
        // Concept:
        // const salonReviewsQuery = query(collection(firestoreInstance, 'reviews'), where('salonId', '==', reviewSalonId));
        // const salonReviewsSnapshot = await getDocs(salonReviewsQuery);
        // const remainingReviews = salonReviewsSnapshot.docs.map(d => mapReview(d.data(), d.id));
        // let newAverageRating = 0;
        // if (remainingReviews.length > 0) {
        //   newAverageRating = remainingReviews.reduce((sum, rev) => sum + rev.rating, 0) / remainingReviews.length;
        // }
        // await updateDoc(doc(firestoreInstance, 'salons', reviewSalonId), {
        //   rating: newAverageRating,
        //   reviewCount: remainingReviews.length
        // });
      }

      toast({
        title: 'Отзивът е изтрит',
        description: `Отзив с ID ${reviewId} беше успешно изтрит.`,
      });
      fetchReviewsWithDetails(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting review:', err);
      toast({ title: 'Грешка при изтриване', description: err.message, variant: 'destructive' });
    } finally {
      setIsDeleting(null);
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
                  {[...Array(7)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
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
        <h2 className="text-2xl font-semibold text-destructive mb-2">Грешка при зареждане на отзиви</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
         <Button onClick={fetchReviewsWithDetails}>Опитай отново</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <MessageSquareText className="mr-3 h-8 w-8 text-primary"/>
        Админ - Управление на Отзиви
      </h1>
      {reviews.length === 0 ? (
        <Card className="text-center py-12">
           <CardHeader>
            <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl font-semibold">Няма намерени отзиви</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-muted-foreground">
              Все още няма оставени отзиви в системата.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto bg-card p-4 rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">ID на Отзив</TableHead>
                <TableHead>Салон</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Рейтинг</TableHead>
                <TableHead className="min-w-[250px]">Коментар</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card divide-y divide-border">
              {reviews.map(review => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium text-xs">{review.id}</TableCell>
                  <TableCell>{review.salonName || review.salonId}</TableCell>
                  <TableCell>{review.clientName || review.userId}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {review.rating} <Star className="h-4 w-4 ml-1 text-yellow-400 fill-yellow-400" />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm max-w-xs truncate" title={review.comment}>
                    {review.comment.length > 100 ? `${review.comment.substring(0, 100)}...` : review.comment}
                  </TableCell>
                  <TableCell>
                    {review.date ? format(new Date(review.date), 'dd.MM.yyyy HH:mm', { locale: bg }) : 'N/A'}
                  </TableCell>
                  <TableCell className="space-x-2">
                     {/* Placeholder Edit Button */}
                    <Button variant="outline" size="sm" asChild disabled>
                        <Link href={`/admin/reviews/edit/${review.id}`}>
                            <Edit3 className="mr-1 h-3 w-3" /> Редактирай (скоро)
                        </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteReview(review.id, review.salonId)}
                      disabled={isDeleting === review.id}
                    >
                      {isDeleting === review.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
                      Изтрий
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
