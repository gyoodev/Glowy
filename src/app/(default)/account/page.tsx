
'use client';

import { useState, useEffect, useRef } from 'react';
import { UserProfileForm } from '@/components/user/user-profile-form';
import { BookingHistoryItem } from '@/components/user/booking-history-item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { UserProfile, Booking, Review, Salon } from '@/types';
import { UserCircle, History, Edit3, AlertTriangle, MessageSquareText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ReviewCard } from '@/components/salon/review-card';
import { auth } from '@/lib/firebase';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { getUserProfile } from '@/lib/firebase';

interface FirebaseError extends Error {
  code?: string;
  customMessage?: string;
  details?: string;
}

export default function AccountPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [_currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [fetchError, setFetchError] = useState<FirebaseError | null>(null);
  const router = useRouter();
  const firestore = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      setFetchError(null);
      if (user && user.uid) {
        setCurrentUser(user);
        try {
          // Try to fetch profile by UID first (standard way)
          let profileData = await getUserProfile(user.uid);

          if (!profileData && user.email) {
            // If not found by UID (e.g., legacy data or specific setup), try by email
            console.log(`Profile not found by UID ${user.uid}, trying by email ${user.email}`);
            const usersQuery = query(collection(firestore, 'users'), where('email', '==', user.email));
            const querySnapshot = await getDocs(usersQuery);
            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0];
              profileData = { id: userDoc.id, ...userDoc.data() } as UserProfile;
              console.log("Profile found by email:", profileData);
            }
          }


          if (profileData) {
            setUserProfile(profileData as UserProfile);
          } else {
            console.log("User document not found for UID:", user.uid, ". Creating default profile in Firestore using UID.");
            const newUserDocRef = doc(firestore, 'users', user.uid);
            const dataToSave: Omit<UserProfile, 'id' | 'role'> & { createdAt: Timestamp, email?: string | null, userId: string } = {
              name: user.displayName || 'Потребител',
              email: user.email || '',
              profilePhotoUrl: user.photoURL || '',
              preferences: { favoriteServices: [], priceRange: '', preferredLocations: [] },
              createdAt: Timestamp.fromDate(new Date()),
              userId: user.uid, // Ensure userId is saved
            };
            await setDoc(newUserDocRef, { ...dataToSave, role: 'customer' });
            setUserProfile({
              id: user.uid,
              name: dataToSave.name,
              email: dataToSave.email || '',
              profilePhotoUrl: dataToSave.profilePhotoUrl,
              preferences: dataToSave.preferences,
              role: 'customer',
              userId: user.uid,
            });
          }

          const bookingsQuery = query(collection(firestore, 'bookings'), where('userId', '==', user.uid));
          const bookingSnapshot = await getDocs(bookingsQuery);
          const fetchedBookings: Booking[] = [];
          bookingSnapshot.forEach((doc) => {
            fetchedBookings.push({
              id: doc.id,
              ...doc.data()
            } as Booking);
          });
          setBookings(fetchedBookings);

        } catch (error: any) {
          console.error("Error fetching/creating user profile or bookings:", error);
          setFetchError(error as FirebaseError);

          if (error.code) {
            console.error("Firebase error code:", error.code);
          }
          if (error.message) {
            console.error("Firebase error message:", error.message);
          }
          if (error.details) {
            console.error("Firebase error details:", error.details);
          }
          if (error.code === 'failed-precondition') {
            console.error("Firestore query failed: This usually means you're missing a composite index. Check the Firebase console for a link to create it.");
            setFetchError({ ...error, customMessage: "A database index is required. Please check the browser console for a link from Firebase to create it, then refresh the page." });
          } else if (error.code === 'permission-denied') {
             setFetchError({ ...error, customMessage: "ГРЕШКА: Липсват права за достъп до Firestore!"});
          }
          setUserProfile(null);
          setBookings([]);
        } finally {
          setIsLoading(false);
        }
      } else if (user && !user.uid) {
        console.warn("User is authenticated but UID is null. This should not happen.");
 setFetchError({
 name: "CustomAccountError", // Add name property
 message: "Възникна неочакван проблем с Вашия акаунт. Моля, свържете се с поддръжката.",
 customMessage: "Възникна неочакван проблем с Вашия акаунт. Моля, свържете се с поддръжката." // Add customMessage property
 });
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setBookings([]);
        setIsLoading(false);
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [firestore, router]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!userProfile || !userProfile.id) return;

      setIsLoadingReviews(true);
      setReviews([]);
      const reviewsCollectionRef = collection(firestore, 'reviews');

      try {
        let reviewsQuery;
        if (userProfile.role === 'customer') {
          reviewsQuery = query(reviewsCollectionRef, where('userId', '==', userProfile.id));
        } else if (userProfile.role === 'business') {
          const salonsQuery = query(collection(firestore, 'salons'), where('ownerId', '==', userProfile.id));
          const salonSnapshot = await getDocs(salonsQuery);
          const salonIds = salonSnapshot.docs.map(doc => doc.id);

          if (salonIds.length === 0) {
            setReviews([]);
            setIsLoadingReviews(false);
            return;
          }
          reviewsQuery = query(reviewsCollectionRef, where('salonId', 'in', salonIds));
        } else {
          setIsLoadingReviews(false);
          return;
        }

        const reviewSnapshot = await getDocs(reviewsQuery);
        const fetchedReviews: Review[] = [];
        reviewSnapshot.forEach(doc => {
          fetchedReviews.push({ id: doc.id, ...doc.data() } as Review);
        });
        setReviews(fetchedReviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setIsLoadingReviews(false);
      }
    };
    if (userProfile) {
      fetchReviews();
    }
  }, [userProfile, firestore]);

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Администратор';
      case 'business':
        return 'Бизнес';
      case 'customer':
        return 'Потребител';
      default:
        return 'Потребител';
    }
  };

  return (
    <div className="container mx-auto py-10 px-6">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3 flex items-center">
          <UserCircle className="w-10 h-10 mr-3 text-primary" />
          Моят Акаунт
        </h1>
        {userProfile?.role && (
          <Badge variant="secondary" className="text-lg">
            Роля: {getRoleDisplayName(userProfile.role)}
          </Badge>
        )}
        <p className="text-lg text-muted-foreground">
          Управлявайте своя профил, предпочитания и преглеждайте историята на резервациите си.
        </p>
      </header>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-2/3 lg:w-1/2 mx-auto mb-8 shadow-sm">
          <TabsTrigger value="profile" className="py-3 text-base">
            <Edit3 className="mr-2 h-5 w-5" /> Профил
          </TabsTrigger>
          <TabsTrigger value="reviews" className="py-3 text-base">
            <MessageSquareText className="mr-2 h-5 w-5" /> Отзиви
          </TabsTrigger>
          <TabsTrigger value="bookings" className="py-3 text-base">
            <History className="mr-2 h-5 w-5" /> Резервации
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          {isLoading ? (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center space-x-4 mb-6">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-5 w-24 mt-2" />
                </div>
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-32 mt-4" />
            </div>
          ) : userProfile ? (
            <UserProfileForm userProfile={userProfile} />
          ) : (
            <div className="text-center text-destructive py-8 border border-destructive/50 bg-destructive/10 rounded-lg p-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center mb-3">
                <AlertTriangle className="w-8 h-8 mr-2 text-destructive" />
                <h3 className="text-xl font-semibold">Грешка при достъп до данни</h3>
              </div>
              {fetchError?.code === 'permission-denied' || (fetchError?.customMessage && fetchError.customMessage.includes("Липсват права")) ? (
                  <div className="text-sm text-left space-y-3 p-4 bg-card/50 border border-destructive/30 rounded-md">
                    <p className="font-bold text-base text-destructive-foreground">ГРЕШКА: Липсват права за достъп до Firestore (permission-denied)!</p>
                    <p className="text-destructive-foreground/90">
                      Вашата Firebase база данни (Firestore) не позволява на приложението да чете или записва данни за потребителския Ви профил.
                      Това е проблем с конфигурацията на <strong>Firestore Security Rules</strong> във Вашия Firebase проект (<code>glowy-gyoodev</code>).
                    </p>
                    <p className="text-destructive-foreground/90">
                      <strong>За да разрешите това, МОЛЯ, направете следното във Вашата <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-destructive-foreground font-semibold">Firebase Console</a>:</strong>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-destructive-foreground/90 pl-4">
                      <li>Отидете на <strong>Build</strong> &gt; <strong>Firestore Database</strong>.</li>
                      <li>Изберете таба <strong>Rules</strong>.</li>
                      <li>Заменете съществуващите правила със следните:</li>
                    </ol>
                    <pre className="text-xs bg-muted text-muted-foreground p-3 rounded-md overflow-x-auto my-2 border border-border">
                      <code>
                        {`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    // Allow an authenticated user to read and write their own document\n    // in the 'users' collection, where the document ID is their UID.\n    match /users/{userId} {\n      allow read, write: if request.auth != null && request.auth.uid == userId;\n    }\n  }\n}`}
                      </code>
                    </pre>
                    <p className="text-destructive-foreground/90">
                      4. Натиснете бутона <strong>Publish</strong>.
                    </p>
                    <p className="font-semibold text-destructive-foreground">
                      След като публикувате тези правила, моля, <strong className="underline">презаредете тази страница</strong>.
                    </p>
                  </div>
                ) : fetchError?.customMessage ? (
                  <p>{fetchError.customMessage}</p>
                ) : (
                <p>
                  Неуспешно зареждане на данните за профила. Моля, проверете връзката си или опитайте да влезете отново.
                  {fetchError?.message && <span className="block mt-2 text-sm">Детайли: {fetchError.message}</span>}
                </p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookings">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-foreground text-center">История на Вашите Резервации</h2>
            {isLoading && bookings.length === 0 ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="shadow-sm">
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : bookings.length > 0 ? (
              <div className="space-y-6">
                {bookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(booking => (
                  <BookingHistoryItem key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Все още нямате история на резервациите.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reviews">
           <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-foreground text-center">
              {userProfile?.role === 'customer' ? 'Вашите Отзиви' : userProfile?.role === 'business' ? 'Отзиви за Вашите Салони' : 'Отзиви'}
            </h2>
            {isLoadingReviews ? (
               <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="shadow-sm">
                     <CardHeader>
                      <Skeleton className="h-5 w-1/3 mb-1" />
                      <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                       <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map(review => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Няма намерени отзиви.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
