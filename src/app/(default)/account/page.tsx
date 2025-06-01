
'use client';

import { useState, useEffect, type ReactNode, useCallback } from 'react';
import { UserProfileForm } from '@/components/user/user-profile-form';
import { BookingHistoryItem } from '@/components/user/booking-history-item';
import { ReviewCard } from '@/components/salon/review-card';
import { SalonCard } from '@/components/salon/salon-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { UserProfile, Booking, Review, Salon, Service } from '@/types';
import { UserCircle, History, Edit3, AlertTriangle, MessageSquareText, Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { auth, getUserProfile, getNewsletterSubscriptionStatus, getUserBookings, firestore } from '@/lib/firebase';
import { getFirestore, doc, setDoc, collection, query, where, getDocs, Timestamp, orderBy, getDoc as getFirestoreDoc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { mapSalon } from '@/utils/mappers';

interface AccountPageError extends Error {
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
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [fetchError, setFetchError] = useState<AccountPageError | null>(null);
  const [newsletterSubscriptionStatus, setNewsletterStatus] = useState<boolean | null>(null);
  const [favoriteSalonDetails, setFavoriteSalonDetails] = useState<Salon[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const db = getFirestore();


  const fetchNewsletterStatus = async (email: string | undefined | null) => {
    if (email) {
      const subStatus = await getNewsletterSubscriptionStatus(email);
      setNewsletterStatus(subStatus);
    } else {
      setNewsletterStatus(false);
    }
  };

  const handleSubscriptionChange = async () => {
    if (userProfile?.email) {
      await fetchNewsletterStatus(userProfile.email);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      setFetchError(null);
      setNewsletterStatus(null);
      if (user && user.uid) {
        setCurrentUser(user);
        try {
          let profileData = await getUserProfile(user.uid);

          if (!profileData && user.email) {
            const usersQuery = query(collection(firestore, 'users'), where('email', '==', user.email));
            const querySnapshot = await getDocs(usersQuery);
            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0];
              profileData = { id: userDoc.id, ...userDoc.data() } as UserProfile;
            }
          }

          if (profileData) {
            setUserProfile(profileData as UserProfile);
            await fetchNewsletterStatus(profileData.email);
          } else {
            const newUserDocRef = doc(firestore, 'users', user.uid);
            const dataToSave: Omit<UserProfile, 'id' | 'createdAt'> & { createdAt: Timestamp; userId: string; } = {
              userId: user.uid,
              name: user.displayName || 'Потребител',
              email: user.email || '',
              profilePhotoUrl: user.photoURL || '',
              preferences: { favoriteServices: [], priceRange: '', preferredLocations: [], favoriteSalons: [] },
              role: 'customer',
              createdAt: Timestamp.fromDate(new Date()),
            };
            await setDoc(newUserDocRef, dataToSave);
            const newProfile = {
              id: user.uid,
              ...dataToSave,
              createdAt: dataToSave.createdAt.toDate().toISOString(),
            } as UserProfile;
            setUserProfile(newProfile);
            await fetchNewsletterStatus(newProfile.email);
          }

          const userBookings = await getUserBookings(user.uid);
          const mappedBookings: Booking[] = userBookings.map((booking: any) => ({
            id: booking.id,
            userId: booking.userId,
            salonId: booking.salonId,
            serviceId: booking.serviceId,
            startTime: booking.startTime,
            endTime: booking.endTime,
            salonName: booking.salonName || 'N/A',
            serviceName: booking.serviceName || 'N/A',
            date: booking.date || new Date().toISOString().split('T')[0],
            time: booking.time || 'N/A',
            status: booking.status as Booking['status'],
            clientName: booking.clientName || 'N/A',
            clientEmail: booking.clientEmail || 'N/A',
            clientPhoneNumber: booking.clientPhoneNumber || 'N/A',
            createdAt: booking.createdAt || new Date().toISOString(),
            salonAddress: booking.salonAddress || 'N/A',
            salonPhoneNumber: booking.salonPhoneNumber || 'N/A',
            salonOwnerId: booking.salonOwnerId || 'N/A',
            service: booking.service as Service || { id: '', name: 'N/A', duration: 0, price: 0 },
          }));
          setBookings(mappedBookings);

        } catch (e: unknown) {
          console.error("Error fetching/creating user profile or bookings:", e);
          const typedError = e as AccountPageError;
          setFetchError(typedError);

          if (typedError.code) console.error("Firebase error code:", typedError.code);
          if (typedError.message) console.error("Firebase error message:", typedError.message);
          if (typedError.details) console.error("Firebase error details:", typedError.details);
          
          if (typedError.code === 'failed-precondition') {
             setFetchError({ name: "FirestoreIndexError", message: "A database index is required for this operation. Please check the browser console for a link from Firebase to create it, then refresh the page.", customMessage: "Грешка с базата данни: Необходим е индекс за тази операция. Моля, проверете конзолата на браузъра за линк от Firebase, за да го създадете, след което презаредете страницата." });
          } else if (typedError.code === 'permission-denied') {
            const specificMessage = "ГРЕШКА: Липсват права за достъп до Firestore! Моля, проверете Firestore Security Rules във Вашия Firebase проект. Уверете се, че правилото 'match /users/{userId} { allow read, write: if request.auth != null && request.auth.uid == userId; }' е активно. За повече информация, вижте конзолата на браузъра.";
            console.error(specificMessage);
            setFetchError({ name: "FirestorePermissionError", message: specificMessage, customMessage: specificMessage });
          } else if (e instanceof Error) {
             setFetchError({ name: e.name, message: e.message, customMessage: "Възникна неочаквана грешка при зареждане на данните за профила." });
          } else {
             setFetchError({ name: "UnknownError", message: String(e), customMessage: "Възникна неочаквана грешка при зареждане на данните за профила." });
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
  }, [db, router, toast]);

  useEffect(() => {
    const fetchUserWrittenReviews = async () => {
      if (!userProfile || !userProfile.id) return;

      setIsLoadingReviews(true);
      setReviews([]);
      const reviewsCollectionRef = collection(firestore, 'reviews');

      try {
        const reviewsQuery = query(reviewsCollectionRef, where('userId', '==', userProfile.id), orderBy('date', 'desc'));
        const reviewSnapshot = await getDocs(reviewsQuery);
        const fetchedReviews: Review[] = [];
        reviewSnapshot.forEach(docSnap => {
          fetchedReviews.push({ id: docSnap.id, ...docSnap.data() } as Review);
        });
        setReviews(fetchedReviews);
      } catch (error) {
        console.error("Error fetching user's written reviews:", error);
      } finally {
        setIsLoadingReviews(false);
      }
    };
    if (userProfile) {
      fetchUserWrittenReviews();
    }
  }, [userProfile, firestore]);

  useEffect(() => {
    const fetchFavoriteSalons = async () => {
      if (!userProfile?.preferences?.favoriteSalons || userProfile.preferences.favoriteSalons.length === 0) {
        setFavoriteSalonDetails([]);
        setIsLoadingFavorites(false);
        return;
      }

      setIsLoadingFavorites(true);
      try {
        const salonPromises = userProfile.preferences.favoriteSalons.map(async (salonId) => {
          const salonDocRef = doc(firestore, 'salons', salonId);
          const salonDocSnap = await getFirestoreDoc(salonDocRef);
          if (salonDocSnap.exists()) {
            return mapSalon(salonDocSnap.data(), salonDocSnap.id);
          }
          return null;
        });
        const resolvedSalons = (await Promise.all(salonPromises)).filter(salon => salon !== null) as Salon[];
        setFavoriteSalonDetails(resolvedSalons);
      } catch (error) {
        console.error("Error fetching favorite salons:", error);
        toast({
          title: "Грешка при зареждане на любими салони",
          description: "Неуспешно извличане на детайли за любимите салони.",
          variant: "destructive",
        });
        setFavoriteSalonDetails([]);
      } finally {
        setIsLoadingFavorites(false);
      }
    };

    if (userProfile) {
      fetchFavoriteSalons();
    }
  }, [userProfile, firestore, toast]);


  const handleToggleFavorite = useCallback(async (salonId: string, isCurrentlyFavorite: boolean) => {
    if (!currentUser || !salonId) {
      toast({
        title: "Влезте в профила си",
        description: "Моля, влезте, за да управлявате любими салони.",
        variant: "destructive",
      });
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      const userDocSnap = await getFirestoreDoc(userDocRef); 
      if (!userDocSnap.exists()) {
        toast({ title: "Грешка", description: "Потребителският профил не е намерен.", variant: "destructive"});
        return;
      }

      let updatedFavorites;
      let toastMessage = "";
      let toastTitle = "";

      if (isCurrentlyFavorite) { 
        updatedFavorites = arrayRemove(salonId);
        toastTitle = "Премахнат от любими!";
        toastMessage = "Салонът е премахнат от вашите любими.";
      } else { 
        updatedFavorites = arrayUnion(salonId);
        toastTitle = "Добавен в любими!";
        toastMessage = "Салонът е добавен към вашите любими.";
      }

      await updateDoc(userDocRef, {
        'preferences.favoriteSalons': updatedFavorites
      });

      toast({ title: toastTitle, description: toastMessage });

      setUserProfile(prevProfile => {
        if (!prevProfile) return null;
        const newFavoriteSalons = isCurrentlyFavorite
          ? (prevProfile.preferences?.favoriteSalons || []).filter(id => id !== salonId)
          : [...(prevProfile.preferences?.favoriteSalons || []), salonId];
        return {
          ...prevProfile,
          preferences: {
            ...(prevProfile.preferences || {}),
            favoriteSalons: newFavoriteSalons,
          },
        };
      });
    } catch (error) {
      console.error("Error toggling favorite status:", error);
      toast({
        title: "Грешка",
        description: "Неуспешно обновяване на списъка с любими. Моля, опитайте отново.",
        variant: "destructive",
      });
    }
  }, [currentUser, db, toast]);

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
        <TabsList className="flex flex-row overflow-x-auto md:overflow-visible md:flex-col md:space-y-1 md:w-48 lg:w-56 md:border-r md:pr-4 shrink-0 bg-transparent p-0 shadow-none custom-scrollbar pb-2 md:pb-0">
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
            <MessageSquareText className="mr-2 h-5 w-5" />Вашите Отзиви
          </TabsTrigger>
          <TabsTrigger
            value="bookings"
            className="w-full justify-start py-2.5 px-3 text-sm sm:text-base data-[state=active]:bg-muted data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-sm rounded-md hover:bg-muted/50 transition-colors"
          >
            <History className="mr-2 h-5 w-5" /> Резервации
          </TabsTrigger>
          <TabsTrigger
            value="favorites"
            className="w-full justify-start py-2.5 px-3 text-sm sm:text-base data-[state=active]:bg-muted data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-sm rounded-md hover:bg-muted/50 transition-colors"
            >
            <Heart className="mr-2 h-5 w-5" /> Любими Салони
            </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-w-0">
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
              <UserProfileForm
                userProfile={userProfile}
                newsletterSubscriptionStatus={newsletterSubscriptionStatus}
                onNewsletterSubscriptionChange={handleSubscriptionChange}
              />
            ) : (
              <Card className="text-center border-destructive/50 bg-destructive/10 rounded-lg p-6 max-w-2xl mx-auto shadow-lg">
                  <CardHeader>
                      <div className="mx-auto bg-destructive/20 p-3 rounded-full w-fit">
                          <AlertTriangle className="w-10 h-10 text-destructive" />
                      </div>
                      <CardTitle className="text-xl font-semibold text-destructive mt-3">Грешка при достъп до данни</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-destructive-foreground">
                    {fetchError?.code === 'permission-denied' || fetchError?.name === "FirestorePermissionError" ? (
                      <div className="text-left space-y-3 p-4 bg-card/50 border border-destructive/30 rounded-md mt-4">
                          <p className="font-bold text-base">ГРЕШКА: Липсват права за достъп до Firestore!</p>
                          <p>
                          Вашата Firebase база данни (Firestore) не позволява на приложението да чете или записва данни за потребителския Ви профил.
                          Това е проблем с конфигурацията на <strong>Firestore Security Rules</strong>.
                          </p>
                          <p>
                          <strong>Моля, влезте във Вашата <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-destructive-foreground font-semibold">Firebase Console</a>, изберете проект <code>{process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'glowy-gyoodev'}</code>, отидете на Firestore Database &gt; Rules и ги заменете със следните:</strong>
                          </p>
                          <pre className="text-xs bg-muted text-muted-foreground p-3 rounded-md overflow-x-auto my-2 border border-border whitespace-pre-wrap break-all">
                          <code>
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own profile data
    match /users/{userId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null; // Allow creating new user profiles
    }
    // Allow users to read and write their own notifications
    match /notifications/{notificationId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    // Allow users to read and write their own bookings
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      // Business owners can manage bookings for their salon
      // allow read, update: if request.auth != null && get(/databases/$(database)/documents/salons/$(resource.data.salonId)).data.ownerId == request.auth.uid;
      allow create: if request.auth != null;
    }
     // Allow users to read and write their own reviews
    match /reviews/{reviewId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    // Public read for salons, only owners can write
    match /salons/{salonId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }
    // Newsletter subscriptions can be created by anyone, reading might be restricted
    match /newsletterSubscribers/{subscriberId} {
        allow create: if true; // Anyone can subscribe
        allow read, list: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'; // Admins can read/list
    }
    // Promotions payments can be read by admins
    match /promotionsPayments/{paymentId} {
        allow read, list: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
        allow create: if request.auth != null; // Business users might create these indirectly
    }
     // Contact messages can be created by anyone, read by admins
    match /contacts/{contactId} {
      allow create: if true;
      allow read, list, update, delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    // Counters can be updated by authenticated users (e.g., for numeric IDs)
    match /counters/{counterName} {
        allow read, write: if request.auth != null;
    }
    // Ensure settings can be read by all but written only by admins
    match /settings/{settingId} {
      allow read: if true;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}`}
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
                  {bookings.map(booking => (
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
                Вашите Отзиви
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
                <p className="text-center text-muted-foreground py-10">Все още не сте оставили отзиви.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="favorites" className="mt-0 md:mt-0 bg-card p-4 sm:p-6 rounded-lg shadow-md">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-semibold mb-6 text-foreground text-center">
                Вашите Любими Салони
              </h2>
              {isLoadingFavorites ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden animate-pulse">
                      <Skeleton className="h-40 w-full" />
                      <div className="p-4">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-4 w-5/6 mb-3" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <div className="p-4 pt-0">
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : favoriteSalonDetails.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {favoriteSalonDetails.map(salon => (
                    <SalonCard
                      key={salon.id}
                      salon={salon}
                      isFavoriteMode={true}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-10">Все още нямате любими салони.</p>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
