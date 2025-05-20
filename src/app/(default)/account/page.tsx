
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

interface FirebaseError extends Error {
  code?: string;
  customMessage?: string;
  details?: string;
}

export default function AccountPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [_currentUser, setCurrentUser] = useState<FirebaseUser | null>(null); 
  const [fetchError, setFetchError] = useState<FirebaseError | null>(null);
  const router = useRouter();
  const firestore = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      setFetchError(null); 
      if (user && user.email) { 
        setCurrentUser(user);
        try {
          const usersCollectionRef = collection(firestore, 'users');
          const q = query(usersCollectionRef, where('email', '==', user.email));
          const querySnapshot = await getDocs(q);

          let userDocSnap;
          let userIdForProfile = user.uid; 

          if (!querySnapshot.empty) {
            // Try to find the document that matches the auth UID, in case multiple accounts share an email (though unlikely with unique email constraint)
            userDocSnap = querySnapshot.docs.find(doc => doc.id === user.uid);
            if (userDocSnap) {
                userIdForProfile = userDocSnap.id;
                const data = userDocSnap.data();
                setUserProfile({
                  id: userIdForProfile,
                  name: data.displayName || user.displayName || 'Потребител',
                  email: data.email || user.email || '',
                  profilePhotoUrl: data.profilePhotoUrl || user.photoURL || '',
                  preferences: data.preferences || { favoriteServices: [], priceRange: '', preferredLocations: [] },
                  userId: data.userId || userIdForProfile,
                });
            } else {
                 // If no doc matches UID but email matches, this is an edge case.
                 // For now, we'll proceed to create a new profile linked to the UID.
                 console.warn("User document found by email but ID did not match UID. Will create a new profile for UID:", user.uid);
                 userDocSnap = undefined; // Force creation path
            }
          }
          
          if (!userDocSnap) { // If still no userDocSnap (either query was empty, or ID didn't match UID)
            console.log("User document not found for email:", user.email, "and UID:", user.uid, ". Creating default profile in Firestore using UID.");
            const newUserDocRef = doc(firestore, 'users', user.uid);
            const dataToSave = {
              userId: user.uid,
              email: user.email,
              displayName: user.displayName || 'Потребител',
              profilePhotoUrl: user.photoURL || '',
              preferences: { favoriteServices: [], priceRange: '', preferredLocations: [] },
              createdAt: Timestamp.fromDate(new Date()),
              profileType: 'customer', 
            };
            await setDoc(newUserDocRef, dataToSave);
            setUserProfile({ 
              id: user.uid,
              name: dataToSave.displayName,
              email: dataToSave.email,
              profilePhotoUrl: dataToSave.profilePhotoUrl,
              preferences: dataToSave.preferences,
              userId: dataToSave.userId,
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
            console.error("Firestore query failed: This usually means you're missing a composite index. Check the Firebase console for a link to create it. The query was likely on the 'email' field in the 'users' collection.");
            setFetchError({ ...error, customMessage: "A database index is required for querying by email. Please check the browser console for a link from Firebase to create it, then refresh the page." });
          }
          setUserProfile(null);
          setBookings([]);
        } finally {
          setIsLoading(false);
        }
      } else if (user && !user.email) { 
        console.warn("User is authenticated but email is null. Cannot fetch profile by email.");
        setFetchError({customMessage: "Вашият потребителски профил няма асоцииран имейл. Моля, свържете се с поддръжката."});
        setIsLoading(false);
      }
      else { 
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
                  <div className="text-sm text-left space-y-3 p-4 bg-destructive/5 border border-destructive/30 rounded-md">
                    <p className="font-bold text-base text-destructive-foreground">ГРЕШКА: Липсват права за достъп до Firestore!</p>
                    <p className="text-destructive-foreground/90">
                      Вашата Firebase база данни (Firestore) не позволява на приложението да чете или записва данни за потребителския Ви профил.
                      Това е проблем с конфигурацията на **Firestore Security Rules** във Вашия Firebase проект.
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

    
