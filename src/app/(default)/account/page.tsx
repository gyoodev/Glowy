
'use client';

import { useState, useEffect, type ReactNode, useCallback } from 'react';
import { UserProfileForm } from '@/components/user/user-profile-form';
import { BookingHistoryItem } from '@/components/user/booking-history-item';
import { ReviewCard } from '@/components/salon/review-card';
import { SalonCard } from '@/components/salon/salon-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { UserProfile, Booking, Review, Salon, Service } from '@/types';
import { UserCircle, UserCircle2, History, Edit3, AlertTriangle, MessageSquareText, Heart, Briefcase, Star, Settings2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { auth, getUserProfile, getNewsletterSubscriptionStatus, getUserBookings, firestore } from '@/lib/firebase';
import { getFirestore, doc, setDoc, collection, query, where, getDocs, Timestamp, orderBy, getDoc as getFirestoreDoc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { mapSalon, mapReview } from '@/utils/mappers'; // Added mapReview
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
      return 'Клиент';
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

          const userBookings = await getUserBookings(user.uid); // getUserBookings already uses mapBooking
          setBookings(userBookings);

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
        const fetchedReviews: Review[] = reviewSnapshot.docs.map(docSnap => mapReview(docSnap.data(), docSnap.id));
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

  if (isLoading && !userProfile) {
    return (
        <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Skeleton for Profile Header */}
        <Card className="mb-8 p-6 shadow-lg">
            <div className="flex items-center space-x-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-6 w-24 mt-1" />
            </div>
            </div>
        </Card>

        {/* Skeleton for Tabs */}
        <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-md" /> 
            <Card>
                <CardContent className="p-6">
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        </div>
        </div>
    );
  }
  
  if (fetchError && (!userProfile || !currentUser)) {
    return (
        <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
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
                        <pre className="text-xs bg-muted text-muted-foreground p-3 rounded-md overflow-x-auto my-2 border border-border whitespace-pre-wrap break-all" data-ai-hint="firestore rules">
                        <code>
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
    match /notifications/{notificationId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null && (request.auth.uid == resource.data.userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null;
      allow list: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
     match /reviews/{reviewId} {
      allow read: if true; // Anyone can read reviews
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId; // User can create their own review
      allow update: if request.auth != null && (
                       (request.auth.uid == resource.data.userId && request.resource.data.keys().hasOnly(['comment', 'rating'])) || // User can update their own comment/rating
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' // Admin can update anything
                     );
      allow delete: if request.auth != null && (
                       request.auth.uid == resource.data.userId || // User can delete their own review
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' // Admin can delete any review
                     );
      // Admin list access for all reviews
      allow list: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /salons/{salonId} {
      allow read: if true;
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
      allow update: if request.auth != null && (request.auth.uid == resource.data.ownerId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /newsletterSubscribers/{subscriberId} {
        allow create: if true; 
        allow read, list: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'; 
    }
    match /promotionsPayments/{paymentId} {
        allow read, list: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
        allow create: if request.auth != null; 
    }
     match /contacts/{contactId} {
      allow create: if true;
      allow read, list, update, delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /counters/{counterName} {
        allow read, write: if request.auth != null; // Consider more specific rules if needed
    }
    match /settings/{settingId} {
      allow read: if true; // Publicly readable settings
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'; // Only admins can write
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
        </div>
    );
  }


  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {userProfile && (
        <Card className="mb-8 p-6 shadow-lg bg-card">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Avatar className="h-24 w-24 ring-2 ring-primary ring-offset-2 ring-offset-background">
              <AvatarImage src={userProfile.profilePhotoUrl || undefined} alt={userProfile.name || 'User Avatar'} data-ai-hint="person avatar" />
              <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : <UserCircle className="h-12 w-12" />}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold text-foreground">{userProfile.name || 'Потребител'}</h1>
              <p className="text-md text-muted-foreground">{userProfile.email}</p>
              {userProfile.role && (
                <Badge variant="secondary" className="mt-2 text-sm py-1 px-3">
                  {getRoleDisplayName(userProfile.role)}
                </Badge>
              )}
            </div>
            {userProfile.role === 'business' && (
                <div className="sm:ml-auto pt-4 sm:pt-0">
                    <Button asChild>
                        <Link href="/business/manage">
                            <Briefcase className="mr-2 h-4 w-4"/> Управление на Бизнеса
                        </Link>
                    </Button>
                </div>
            )}
             {userProfile.role === 'admin' && (
                <div className="sm:ml-auto pt-4 sm:pt-0">
                    <Button asChild variant="outline">
                        <Link href="/admin">
                            <Settings2 className="mr-2 h-4 w-4"/> Админ Панел
                        </Link>
                    </Button>
                </div>
            )}
          </div>
        </Card>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="inline-flex h-auto w-full flex-wrap items-center justify-center rounded-lg bg-muted p-1.5 text-muted-foreground mb-6 gap-1.5">
          <TabsTrigger value="profile" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-lg">
            <Edit3 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Профил
          </TabsTrigger>
          <TabsTrigger value="reviews" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-lg">
            <MessageSquareText className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Отзиви
          </TabsTrigger>
          <TabsTrigger value="bookings" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-lg">
            <History className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Резервации
          </TabsTrigger>
          <TabsTrigger value="favorites" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-lg">
            <Heart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Любими
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          {userProfile ? (
            <UserProfileForm
              userProfile={userProfile}
              newsletterSubscriptionStatus={newsletterSubscriptionStatus}
              onNewsletterSubscriptionChange={handleSubscriptionChange}
            />
          ) : (
            <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">История на Резервациите</CardTitle>
              <CardDescription>Преглед на всички Ваши минали и предстоящи резервации.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && bookings.length === 0 ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="shadow-sm animate-pulse p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" /> <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-5/6 mt-2" /> <Skeleton className="h-4 w-2/3 mt-1" />
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Вашите Отзиви</CardTitle>
              <CardDescription>Отзиви, които сте оставили за салони.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingReviews ? (
                 <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <Card key={i} className="shadow-sm animate-pulse p-4">
                      <Skeleton className="h-5 w-1/3 mb-2" /> <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-full mt-2" /> <Skeleton className="h-4 w-2/3 mt-1" />
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Любими Салони</CardTitle>
              <CardDescription>Вашият списък със запазени любими салони.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingFavorites ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden animate-pulse p-4">
                      <Skeleton className="h-40 w-full mb-3" /> <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-1" /> <Skeleton className="h-4 w-5/6" />
                    </div>
                  ))}
                </div>
              ) : favoriteSalonDetails.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
