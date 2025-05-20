
'use client';

import { useState, useEffect } from 'react';
import { UserProfileForm } from '@/components/user/user-profile-form';
import { BookingHistoryItem } from '@/components/user/booking-history-item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { mockBookings } from '@/lib/mock-data'; // Bookings will be fetched or mocked later
import type { UserProfile, Booking } from '@/types';
import { UserCircle, History, Edit3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { auth } from '@/lib/firebase'; // Firebase auth
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'; // Firestore functions
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [_currentUser, setCurrentUser] = useState<FirebaseUser | null>(null); // To store Firebase user object
  const router = useRouter();
  const firestore = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true); // Set loading to true at the start of auth check / data fetch
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(firestore, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserProfile({
              id: user.uid,
              name: data.displayName || user.displayName || 'Потребител',
              email: data.email || user.email || '',
              profilePhotoUrl: data.profilePhotoUrl || user.photoURL || '',
              preferences: data.preferences || { favoriteServices: [], priceRange: '', preferredLocations: [] },
            });
          } else {
            console.log("User document not found for UID:", user.uid, ". Creating default profile in Firestore.");
            const defaultProfileData = {
              id: user.uid,
              name: user.displayName || 'Потребител',
              email: user.email || '',
              profilePhotoUrl: user.photoURL || '',
              preferences: { favoriteServices: [], priceRange: '', preferredLocations: [] },
              displayName: user.displayName || 'Потребител', // For Firestore
              createdAt: new Date(),
              profileType: 'customer', // Default profile type
            };
            
            // Data to actually save (excluding derived id/name if displayName is primary)
            const { id: _id, name: _name, ...dataToSave } = defaultProfileData;
            // Ensure essential fields like email (which is from auth) are included
            if (user.email && !dataToSave.email) {
              (dataToSave as any).email = user.email;
            }


            await setDoc(userDocRef, dataToSave);
            setUserProfile({ // Set state for the UI
              id: defaultProfileData.id,
              name: defaultProfileData.name,
              email: defaultProfileData.email,
              profilePhotoUrl: defaultProfileData.profilePhotoUrl,
              preferences: defaultProfileData.preferences,
            });
          }

          // Fetch user bookings (mocked for now, replace with actual fetch)
          // Simulating fetching bookings, replace with your actual Firestore query for bookings
          const bookingsQuery = query(collection(firestore, 'bookings'), where('userId', '==', user.uid));
          const bookingSnapshot = await getDocs(bookingsQuery);
          const fetchedBookings: Booking[] = [];
          bookingSnapshot.forEach((doc) => {
            fetchedBookings.push({
              id: doc.id,
              ...doc.data()
            } as Booking); 
          });
          // Fallback to mockBookings if Firestore fetch is empty and you want to show something
          // For now, let's use what's fetched or an empty array.
          setBookings(fetchedBookings);

        } catch (error: any) {
          console.error("Error fetching/creating user profile or bookings:", error);
           // Enhanced error logging
          if (error.code) {
            console.error("Firebase error code:", error.code);
          }
          if (error.message) {
            console.error("Firebase error message:", error.message);
          }
          if (error.details) {
            console.error("Firebase error details:", error.details); // This might be undefined for auth/permission errors
          }
          setUserProfile(null); // Fallback if error
          setBookings([]); // Clear bookings on error too
        } finally {
          setIsLoading(false);
        }
      } else {
        // No user is signed in
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
             <p className="text-center text-muted-foreground py-8">
                Неуспешно зареждане на профила. Моля, проверете връзката си или опитайте да влезете отново. Възможно е да има проблем с правата за достъп до данните.
             </p>
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
