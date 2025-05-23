
'use client';

import { useState, useEffect, useRef } from 'react';
import { UserProfileForm } from '@/components/user/user-profile-form';
import { BookingHistoryItem } from '@/components/user/booking-history-item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { UserProfile, Booking, Review } from '@/types';
import { UserCircle, History, Edit3, AlertTriangle, MessageSquareText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
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

function getRoleDisplayName(role?: string) {
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
          let profileData = await getUserProfile(user.uid);

          if (!profileData && user.email) {
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
            const dataToSave = {
              name: user.displayName || 'Потребител',
              email: user.email || '',
              userId: user.uid, // Ensure userId is stored
              profilePhotoUrl: user.photoURL || '',
              preferences: { favoriteServices: [], priceRange: '', preferredLocations: [] },
              createdAt: Timestamp.fromDate(new Date()),
              role: 'customer', // Default role
            };
            await setDoc(newUserDocRef, dataToSave);
            setUserProfile({
              id: user.uid,
              ...dataToSave,
            } as UserProfile);
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
            setFetchError({ name: "FirestoreIndexError", message: "A database index is required for this operation. Please check the browser console for a link from Firebase to create it, then refresh the page.", customMessage: "A database index is required. Please check the browser console for a link from Firebase to create it, then refresh the page." });
          } else if (error.code === 'permission-denied') {
             const specificMessage = "ГРЕШКА: Липсват права за достъп до Firestore! Моля, проверете Firestore Security Rules във Вашия Firebase проект. Уверете се, че правилото 'match /users/{userId} { allow read, write: if request.auth != null && request.auth.uid == userId; }' е активно. За повече информация, вижте конзолата на браузъра.";
             console.error(specificMessage);
             setFetchError({ name: "FirestorePermissionError", message: specificMessage, customMessage: specificMessage});
          }
          setUserProfile(null);
          setBookings([]);
        } finally {
          setIsLoading(false);
        }
      } else if (user && !user.uid) {
        console.warn("User is authenticated but UID is null. This should not happen.");
        setFetchError({
          name: "CustomAccountError",
          message: "Възникна неочакван проблем с Вашия акаунт. Моля, свържете се с поддръжката.",
          customMessage: "Възникна неочакван проблем с Вашия акаунт. Моля, свържете се с поддръжката."
        });
        setIsLoading(false);
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

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <header className="mb-8 pb-6 border-b border-border">
        <div className="flex items-center gap-4">
            <UserCircle className="w-12 h-12 text-primary" />
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Моят Акаунт
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                Управлявайте своя профил, предпочитания и преглеждайте историята на резервациите си.
                </p>
            </div>
        </div>
        {userProfile?.role && (
          <Badge variant="secondary" className="text-md mt-4 py-1 px-3 inline-block">
            Роля: {getRoleDisplayName(userProfile.role)}
          </Badge>
        )}
      </header>

      <Tabs defaultValue="profile" orientation="vertical" className="flex flex-col md:flex-row gap-6 md:gap-10">
        <TabsList className="flex flex-row overflow-x-auto md:overflow-visible md:flex-col md:space-y-1 md:w-48 lg:w-56 md:border-r md:pr-4 shrink-0 bg-transparent p-0 shadow-none">
          <TabsTrigger 
            value="profile" 
            className="w-full justify-start py-2.5 px-3 text-sm sm:text-base data-[state=active]:bg-muted data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-sm rounded-md hover:bg-muted/50 transition-colors"
          >
            <Edit3 className="mr-2 h-5 w-5" /> Профил
          </TabsTrigger>
          <TabsTrigger 
            value="reviews" 
            className="w-full justify-start py-2.5 px-3 text-sm sm:text-base data-[state=active]:bg-muted data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-sm rounded-md hover:bg-muted/50 transition-colors"
          >
            <MessageSquareText className="mr-2 h-5 w-5" /> Отзиви
          </TabsTrigger>
          <TabsTrigger 
            value="bookings" 
            className="w-full justify-start py-2.5 px-3 text-sm sm:text-base data-[state=active]:bg-muted data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-sm rounded-md hover:bg-muted/50 transition-colors"
          >
            <History className="mr-2 h-5 w-5" /> Резервации
          </TabsTrigger>
        </TabsList>
        
        <div className="flex-1 min-w-0"> {/* Added min-w-0 to prevent content overflow issues */}
          <TabsContent value="profile" className="mt-0 md:mt-0 bg-card p-4 sm:p-6 rounded-lg shadow-md">
            {isLoading ? (
              <div className="space-y-4 max-w-2xl mx-auto p-6">
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
              <Card className="text-center border-destructive/50 bg-destructive/10 rounded-lg p-6 max-w-2xl mx-auto shadow-lg">
                  <CardHeader>
                      <div className="mx-auto bg-destructive/20 p-3 rounded-full w-fit">
                          <AlertTriangle className="w-10 h-10 text-destructive" />
                      </div>
                      <CardTitle className="text-xl font-semibold text-destructive mt-3">Грешка при достъп до данни</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-destructive-foreground">
                    {fetchError?.customMessage && fetchError.customMessage.includes("Firebase Console") ? (
                      <div className="text-left space-y-3 p-4 bg-card/50 border border-destructive/30 rounded-md mt-4">
                          <p className="font-bold text-base">ГРЕШКА: Липсват права за достъп до Firestore!</p>
                          <p>
                          Вашата Firebase база данни (Firestore) не позволява на приложението да чете или записва данни за потребителския Ви профил.
                          Това е проблем с конфигурацията на <strong>Firestore Security Rules</strong>.
                          </p>
                          <p>
                          <strong>Моля, влезте във Вашата <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-destructive-foreground font-semibold">Firebase Console</a>, изберете проект <code>glowy-gyoodev</code>, отидете на Firestore Database &gt; Rules и ги заменете със следните:</strong>
                          </p>
                          <pre className="text-xs bg-muted text-muted-foreground p-3 rounded-md overflow-x-auto my-2 border border-border whitespace-pre-wrap break-all">
                          <code>
                              {`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /users/{userId} {\n      allow read, write: if request.auth != null && request.auth.uid == userId;\n    }\n    // Добавете правила и за други колекции, ако е необходимо\n    match /salons/{salonId} {\n      allow read: if true;\n    }\n    match /reviews/{reviewId} {\n      allow read: if true;\n      allow create: if request.auth != null;\n    }\n    match /bookings/{bookingId} {\n      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;\n    }\n  }\n}`}
                          </code>
                          </pre>
                          <p>Натиснете бутона <strong>Publish</strong>.</p>
                          <p className="font-semibold">
                          След като публикувате тези правила, моля, <strong className="underline">презаредете тази страница</strong>.
                          </p>
                      </div>
                    ) : fetchError?.customMessage ? (
                      <p>{fetchError.customMessage}</p>
                    ) : (
                      <p>
                          Неуспешно зареждане на данните за профила. Моля, проверете връзката си или опитайте да влезете отново.
                          {fetchError?.message && <span className="block mt-2 text-xs">Детайли: {fetchError.message}</span>}
                      </p>
                    )}
                  </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bookings" className="mt-0 md:mt-0 bg-card p-4 sm:p-6 rounded-lg shadow-md">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-semibold mb-6 text-foreground text-center">История на Вашите Резервации</h2>
              {isLoading && bookings.length === 0 ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="shadow-sm animate-pulse">
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
                <p className="text-center text-muted-foreground py-10">Все още нямате история на резервациите.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-0 md:mt-0 bg-card p-4 sm:p-6 rounded-lg shadow-md">
             <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-semibold mb-6 text-foreground text-center">
                {userProfile?.role === 'customer' ? 'Вашите Отзиви' : userProfile?.role === 'business' ? 'Отзиви за Вашите Салони' : 'Отзиви'}
              </h2>
              {isLoadingReviews ? (
                 <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="shadow-sm animate-pulse">
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
                <p className="text-center text-muted-foreground py-10">Няма намерени отзиви.</p>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
