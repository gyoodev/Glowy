
'use client';

import { useState, useEffect } from 'react';
import { UserProfileForm } from '@/components/user/user-profile-form';
import { BookingHistoryItem } from '@/components/user/booking-history-item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UserProfile, Booking } from '@/types';
import { UserCircle, History, Edit3, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { auth } from '@/lib/firebase'; 
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore'; 
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [_currentUser, setCurrentUser] = useState<FirebaseUser | null>(null); 
  const [fetchError, setFetchError] = useState<any | null>(null);
  const router = useRouter();
  const firestore = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      setFetchError(null); 
      if (user && user.uid) { // Ensure user and user.uid exist
        setCurrentUser(user);
        try {
          // Query for the user document by email
          const usersCollectionRef = collection(firestore, 'users');
          const q = query(usersCollectionRef, where('email', '==', user.email));
          const querySnapshot = await getDocs(q);

          let userDocSnap;
          let userIdForProfile = user.uid; // Default to auth UID for new profiles

          if (!querySnapshot.empty && querySnapshot.docs.find(doc => doc.id === user.uid)) {
            // Assuming email is unique, take the first document
            userDocSnap = querySnapshot.docs.find(doc => doc.id === user.uid);
            if (!userDocSnap) throw new Error("User document found by email but not by UID, which is unexpected.");
            userIdForProfile = userDocSnap.id; // Use the ID from the found document (should be user.uid)
            const data = userDocSnap.data();
            setUserProfile({
              id: userIdForProfile,
              name: data.displayName || user.displayName || 'Потребител',
              email: data.email || user.email || '', // Keep email for display/form
              profilePhotoUrl: data.profilePhotoUrl || user.photoURL || '',
              preferences: data.preferences || { favoriteServices: [], priceRange: '', preferredLocations: [] },
              // userId: data.userId || userIdForProfile, // Ensure userId is populated
            });
          } else {
            console.log("User document not found for email:", user.email, ". Creating default profile in Firestore using UID:", user.uid);
            // Create a new profile document using user.uid as the document ID
            const newUserDocRef = doc(firestore, 'users', user.uid);
            const dataToSave = {
              userId: user.uid,
              email: user.email,
              displayName: user.displayName || 'Потребител',
              profilePhotoUrl: user.photoURL || '',
              preferences: { favoriteServices: [], priceRange: '', preferredLocations: [] },
              createdAt: Timestamp.fromDate(new Date()), // Use Firestore Timestamp\
              profileType: 'customer', 
            };

            await setDoc(newUserDocRef, dataToSave);
            setUserProfile({ 
              id: user.uid,
              name: dataToSave.displayName,
              email: dataToSave.email,
              profilePhotoUrl: dataToSave.profilePhotoUrl,
              preferences: dataToSave.preferences,
              // userId: dataToSave.userId,
            });

          // Fetch bookings (mocked for now, but could be real)
          // If bookings are tied to userId, ensure it's the correct one (user.uid)
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
          setFetchError(error); 
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
            console.error("Firestore query failed: This usually means you're missing a composite index. Check the Firebase console for a link to create it. The query was likely on the 'email' field in the 'users' collection.");
            setFetchError({ ...error, customMessage: "A database index is required. Please check the browser console for a link from Firebase to create it, then refresh the page." });
          }
          setUserProfile(null);
          setBookings([]);
        } finally {
          setIsLoading(false);
        }
      } else {
          router.push('/login');
        } else if (user && !user.email) {
          console.warn("User is authenticated but email is null. Cannot fetch profile by email.");
          setFetchError({customMessage: "Вашият потребителски профил няма асоцииран имейл. Моля, свържете се с поддръжката."})
          setIsLoading(false);
        }
      }
      else { // User is null
        setCurrentUser(null);
        setUserProfile(null);
        setBookings([]);
        setIsLoading(false);
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [firestore, router]);


  return (
    <div className="container mx-auto py-10 px-6">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3 flex items-center">
          <UserCircle className="w-10 h-10 mr-3 text-primary" />
          Моят Акаунт
        </h1>
        <p className="text-lg text-muted-foreground">
          Управлявайте своя профил, предпочитания и преглеждайте историята на резервациите си.
        </p>
      </header>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3 mx-auto mb-8 shadow-sm">
          <TabsTrigger value="profile" className="py-3 text-base">
            <Edit3 className="mr-2 h-5 w-5" /> Профил
          </TabsTrigger>
          <TabsTrigger value="bookings" className="py-3 text-base">
            <History className="mr-2 h-5 w-5" /> История на Резервациите
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
                {fetchError && fetchError.code === 'permission-denied' ? (
                  <div className="text-sm">
                    <p className="font-bold mb-2">Липсват или са недостатъчни права за достъп до Firestore!</p>
                    <p className="mb-1">
                      Системата засече, че нямате необходимите права за достъп до Вашите данни в Firestore.
                    </p>
                    <p className="mb-3">
                      Това обикновено се дължи на конфигурацията на **Firestore Security Rules** във Вашия Firebase проект. Моля, уверете се, че правилата Ви позволяват на удостоверени потребители да четат и пишат своите профили в колекцията 'users' (документ ID трябва да е UID на потребителя).
                    </p>
                    <p className="font-semibold">Необходими правила (в Firebase Console &gt; Firestore &gt; Rules):</p>
                    <pre className="text-xs bg-muted text-muted-foreground p-2 rounded-md overflow-x-auto text-left my-2">
                      <code>
                        rules_version = '2';<br/>
                        service cloud.firestore &#123;<br/>
                        &nbsp;&nbsp;match /databases/&#123;database&#125;/documents &#123;<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;match /users/&#123;userId&#125; &#123;<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read, write: if request.auth != null && request.auth.uid == userId;<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;&#125;<br/>
                        &nbsp;&nbsp;&#125;<br/>
                        &#125;
                      </code>
                    </pre>
                    <p>След като актуализирате и публикувате тези правила, моля, <strong className="text-foreground">презаредете тази страница</strong>.</p>
                  </div>
                ) : fetchError && fetchError.customMessage ? (
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
            <h2 className="text-2xl font-semibold mb-6 text-foreground text-center">Вашите минали и предстоящи резервации</h2>
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
                {bookings.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(booking => (
                  <BookingHistoryItem key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Все още нямате история на резервациите.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    