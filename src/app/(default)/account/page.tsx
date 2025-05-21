
'use client';

import { useState, useEffect } from 'react';
import { UserProfileForm } from '@/components/user/user-profile-form';
import { BookingHistoryItem } from '@/components/user/booking-history-item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { UserProfile, Booking, Review, Salon } from '@/types';
import { UserCircle, History, Edit3, AlertTriangle, MessageSquareText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ReviewCard } from '@/components/salon/review-card'; // Import ReviewCard
import { auth } from '@/lib/firebase';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { getUserProfile } from '@/lib/firebase'; // Import getUserProfile

interface FirebaseError extends Error {
  code?: string;
  customMessage?: string;
  details?: string;
}

export default function AccountPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]); // New state for reviews
  const [isLoadingReviews, setIsLoadingReviews] = useState(false); // New loading state for reviews
  const [_currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [fetchError, setFetchError] = useState<FirebaseError | null>(null);
  const router = useRouter();
  const firestore = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      setFetchError(null);
      if (user && user.uid) { // Check for user.uid as well
        setCurrentUser(user);
        try {
          const profileData = await getUserProfile(user.uid);

          if (profileData) {
            setUserProfile(profileData as UserProfile);
          } else {
            console.log("User document not found for UID:", user.uid, ". Creating default profile in Firestore using UID.");
            const newUserDocRef = doc(firestore, 'users', user.uid);
            const dataToSave: Omit<UserProfile, 'id' | 'role'> & { createdAt: Timestamp, email?: string | null } = {
              name: user.displayName || 'Потребител',
              email: user.email, // Include email from auth user
              profilePhotoUrl: user.photoURL || '',
              preferences: { favoriteServices: [], priceRange: '', preferredLocations: [] },
              createdAt: Timestamp.fromDate(new Date()),
              // profileType: 'customer', // This field seems to be from an older schema, ensure UserProfile type is up-to-date
            };
            await setDoc(newUserDocRef, { ...dataToSave, role: 'customer', userId: user.uid }); // Add default role and userId
            setUserProfile({
              id: user.uid,
              name: dataToSave.name,
              email: dataToSave.email || '',
              profilePhotoUrl: dataToSave.profilePhotoUrl,
              preferences: dataToSave.preferences,
              role: 'customer', // Assign a default role
              userId: user.uid,
            });
          }

          // Fetch bookings using UID
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

          // Reviews will be fetched when the "Отзиви" tab is selected
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
        setFetchError({ customMessage: "Възникна неочакван проблем с Вашия акаунт. Моля, свържете се с поддръжката." });
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

  // Effect to fetch reviews when the userProfile and its role are available
  useEffect(() => {
    const fetchReviews = async () => {
      if (!userProfile || !userProfile.id) return;

      setIsLoadingReviews(true);
      setReviews([]); // Clear previous reviews
      const reviewsCollectionRef = collection(firestore, 'reviews');

      try {
        let reviewsQuery;
        if (userProfile.role === 'customer') {
          // Fetch reviews written by the user
          reviewsQuery = query(reviewsCollectionRef, where('userId', '==', userProfile.id));
        } else if (userProfile.role === 'business') {
          // Fetch salons owned by the business user
          const salonsQuery = query(collection(firestore, 'salons'), where('ownerId', '==', userProfile.id));
          const salonSnapshot = await getDocs(salonsQuery);
          const salonIds = salonSnapshot.docs.map(doc => doc.id);

          if (salonIds.length === 0) {
            setReviews([]); // No salons, no reviews
            setIsLoadingReviews(false);
            return;
          }

          // Fetch reviews for these salons
          reviewsQuery = query(reviewsCollectionRef, where('salonId', 'in', salonIds));
        } else {
          // No reviews for other roles (e.g., admin) on this page
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
    fetchReviews();
  }, [userProfile, firestore]); // Depend on userProfile and firestore


  return (
    <div className="container mx-auto py-10 px-6">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3 flex items-center">
          <UserCircle className="w-10 h-10 mr-3 text-primary" />
          Моят Акаунт
        </h1>
        {userProfile?.role && (
          <Badge variant="secondary" className="text-lg">
            {userProfile.role === 'admin' ? 'Роля: Администратор' : 'Роля: Потребител'}
          </Badge>
        )}
        <p className="text-lg text-muted-foreground">
          Управлявайте своя профил, предпочитания и преглеждайте историята на резервациите си.
        </p>
      </header>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-2/3 lg:w-1/2 mx-auto mb-8 shadow-sm"> {/* Adjusted grid-cols to 3 */}
          <TabsTrigger value="profile" className="py-3 text-base">
            <Edit3 className="mr-2 h-5 w-5" /> Профил
          </TabsTrigger>
          <TabsTrigger value="reviews" className="py-3 text-base"> {/* New Reviews tab */}
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
                  <div className="text-sm text-left space-y-3 p-4 bg-destructive/5 border border-destructive/30 rounded-md">
                    <p className="font-bold text-base text-destructive-foreground">ГРЕШКА: Липсват права за достъп до Firestore (permission-denied)!</p>
                    <p className="text-destructive-foreground/90">
                      Вашата Firebase база данни (Firestore) не позволява на приложението да чете или записва данни за потребителския Ви профил.
                      Това е проблем с конфигурацията на <strong>Firestore Security Rules</strong> във Вашия Firebase проект.
                    </p>
                    <p className="text-destructive-foreground/90">
                      <strong>За да разрешите това, МОЛЯ, направете следното във Вашата Firebase конзола:</strong>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-destructive-foreground/90 pl-4">
                      <li>Отворете <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-destructive-foreground">Firebase Console</a> и изберете Вашия проект (<code>glowy-gyoodev</code>).</li>
                      <li>В лявото меню отидете на <strong>Build</strong> &gt; <strong>Firestore Database</strong>.</li>
                      <li>Изберете таба <strong>Rules</strong>.</li>
                      <li>Заменете съществуващите правила със следните:</li>
                    </ol>
                    <pre className="text-xs bg-card text-card-foreground p-3 rounded-md overflow-x-auto my-2 border border-border">
                      <code>
                        rules_version = '2';{'\n'}
                        service cloud.firestore {'{\n'}
                        {'  '}match /databases/{'{database}'}/documents {'{\n'}
                        {'    '}// Позволява на удостоверен потребител да чете и пише своя собствен документ{'\n'}
                        {'    '}// в колекцията 'users', където ID на документа е UID на потребителя.{'\n'}
                        {'    '}match /users/{'{userId}'} {'{\n'}
                        {'      '}allow read, write: if request.auth != null && request.auth.uid == userId;{'\n'}
                        {'    '}{'}\n'}
                        {'  '}{'}\n'}
                        {'}'}
                      </code>
                    </pre>
                    <p className="text-destructive-foreground/90">
                      5. Натиснете бутона <strong>Publish</strong>.
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

        {/* New Reviews Tab Content */}
        <TabsContent value="reviews">
           <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-foreground text-center">
              {userProfile?.role === 'customer' ? 'Вашите Отзиви' : 'Отзиви за Вашите Салони'}
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
