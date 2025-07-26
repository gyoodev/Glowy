

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  limit,
  serverTimestamp,
  doc,
  getDoc, // Ensure getDoc is imported
  type FieldValue // Keep for serverTimestamp
} from 'firebase/firestore';
import type { UserProfile, Service, Booking, Notification, NotificationType, NewsletterSubscriber } from '@/types';
import { mapUserProfile, mapBooking, mapNotification, mapNewsletterSubscriber } from '@/utils/mappers'; // Path alias should now work
import firebaseConfig from './firebase/config';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

// This boolean check is the core of the new mechanism.
// It verifies that the essential keys are present and not just placeholder values.
const isFirebaseConfigured =
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'YOUR_API_KEY_HERE';

let app: FirebaseApp;
let authInstance: ReturnType<typeof getAuth>;
let firestoreInstance: ReturnType<typeof getFirestore>;

// Initialize Firebase only if it's configured and not already initialized.
if (isFirebaseConfigured) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    authInstance = getAuth(app);
    firestoreInstance = getFirestore(app);
} else {
    // If not configured, you might want to handle this case,
    // though the RootLayout already prevents rendering.
    // For safety, we can assign a dummy object or handle errors,
    // but for now, we rely on the RootLayout check.
    // console.warn("Firebase is not configured. App initialization skipped.");
}


let analytics;
if (typeof window !== 'undefined' && isFirebaseConfigured) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export const createBooking = async (bookingDetails: {
  salonId: string;
  salonName: string;
  salonOwnerId?: string;
  userId: string;
  service: Service;
  date: string;
  time: string;
  clientName: string; // This will now be primarily sourced from the user's profile
  clientEmail: string; // This will now be primarily sourced from the user's profile
  clientPhoneNumber: string; // This will now be primarily sourced from the user's profile
  salonAddress?: string;
  salonPhoneNumber?: string;
}) => {
  try {
    const userProfile = await getUserProfile(bookingDetails.userId);
    const clientName = userProfile?.name || bookingDetails.clientName;
    const clientEmail = userProfile?.email || bookingDetails.clientEmail;
    const clientPhoneNumber = userProfile?.phoneNumber || bookingDetails.clientPhoneNumber;


    // Destructure categoryIcon and keep the rest of the service properties
    const { categoryIcon, ...serviceToStore } = bookingDetails.service;

    const bookingDataForFirestore: Omit<Booking, 'id' | 'startTime' | 'endTime' | 'createdAt' | 'serviceId' | 'serviceName' | 'service'> & { serviceId: string; serviceName: string; service?: Omit<Service, 'categoryIcon'>; createdAt: FieldValue } = {
      salonId: bookingDetails.salonId,
      salonName: bookingDetails.salonName,
      salonOwnerId: bookingDetails.salonOwnerId,
      userId: bookingDetails.userId,
      serviceId: bookingDetails.service.id,
      serviceName: bookingDetails.service.name,
      date: bookingDetails.date,
      time: bookingDetails.time,
      status: 'pending',
      createdAt: serverTimestamp(),
      clientName: clientName,
      clientEmail: clientEmail,
      clientPhoneNumber: clientPhoneNumber,
      salonAddress: bookingDetails.salonAddress,
      salonPhoneNumber: bookingDetails.salonPhoneNumber,
      service: serviceToStore, // Use the sanitized service object
    };

    const docRef = await addDoc(collection(firestoreInstance, 'bookings'), bookingDataForFirestore as any); // Use 'as any' to bypass strict type check for serverTimestamp
    console.log('Booking created with ID:', docRef.id);

    // --- NOTIFICATIONS ---

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const formattedBookingDate = format(new Date(bookingDetails.date), 'dd.MM.yyyy', { locale: bg });

    // 1. Notify Business Owner (In-app & Email)
    if (bookingDetails.salonOwnerId) {
      const ownerProfile = await getUserProfile(bookingDetails.salonOwnerId);
      
      // In-app notification for business
      const businessNotificationMessage = `Нова резервация за ${bookingDetails.service.name} в ${bookingDetails.salonName} от ${clientName || 'клиент'} на ${formattedBookingDate} в ${bookingDetails.time}.`;
      await addDoc(collection(firestoreInstance, 'notifications'), {
        userId: bookingDetails.salonOwnerId,
        message: businessNotificationMessage,
        link: `/business/salon-bookings/${bookingDetails.salonId}`,
        read: false,
        createdAt: serverTimestamp(),
        type: 'new_booking_business' as NotificationType,
        relatedEntityId: docRef.id,
      });

      // Email notification for business
      if (ownerProfile?.email) {
          try {
              const response = await fetch(`${appUrl}/api/send-email/new-booking-business`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      ownerEmail: ownerProfile.email,
                      salonName: bookingDetails.salonName,
                      serviceName: bookingDetails.service.name,
                      bookingDate: formattedBookingDate,
                      bookingTime: bookingDetails.time,
                      clientName: clientName,
                      clientPhoneNumber: clientPhoneNumber,
                  }),
              });
               if (!response.ok) {
                  // The API should now return a JSON with a message
                  const errorData = await response.json();
                  console.warn('Failed to send new booking email to business:', errorData.message || response.statusText);
              } else {
                  console.log('New booking email sent successfully to business owner.');
              }
          } catch (emailError) {
              console.warn('Error sending new booking email to business:', emailError);
          }
      } else {
        console.warn(`Could not send new booking email to business owner ${bookingDetails.salonOwnerId} because no email is associated with their profile.`);
      }
    }

    // 2. Notify Client (Email Confirmation)
    if (clientEmail) {
        try {
            const response = await fetch(`${appUrl}/api/send-email/new-booking-client`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientEmail: clientEmail,
                    clientName: clientName,
                    salonName: bookingDetails.salonName,
                    serviceName: bookingDetails.service.name,
                    bookingDate: formattedBookingDate,
                    bookingTime: bookingDetails.time,
                    salonAddress: bookingDetails.salonAddress,
                    salonPhoneNumber: bookingDetails.salonPhoneNumber,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.warn('Failed to send booking confirmation email to client:', errorData.message || response.statusText);
            } else {
                console.log('Booking confirmation email sent successfully to client.');
            }
        } catch (emailError) {
            console.warn('Error sending booking confirmation email to client:', emailError);
        }
    }

    return docRef.id;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  if (!userId) return [];
  try {
    const q = query(
      collection(firestoreInstance, 'bookings'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => mapBooking({ id: docSnap.id, ...docSnap.data() }));
  } catch (e: unknown) {
    let errorMessage = `Error fetching bookings for user ${userId}`;
    if (e instanceof Error) {
      errorMessage += `: ${e.message}`;
      if ((e as any).code === 'permission-denied') {
        console.error(`Firestore permission denied when fetching bookings for user ${userId}. Check Firestore rules for /bookings collection.`);
      }
    }
    console.error(errorMessage, e);
    return [];
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) {
    console.warn("getUserProfile called with null or undefined userId.");
    return null;
  }
  try {
    const userDocRef = doc(firestoreInstance, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return mapUserProfile(userDocSnap.data(), userDocSnap.id);
    } else {
      console.log(`No Firestore profile found for UID: ${userId} in getUserProfile.`);
      return null;
    }
  } catch (e: unknown) {
    let errorMessage = `Error fetching user profile for UID ${userId}`;
    if (e instanceof Error) {
      errorMessage += `: ${e.message}`;
      if ((e as any).code === 'permission-denied') {
        console.error(`Firestore permission denied when fetching profile for user ${userId}. Ensure Firestore rules allow the authenticated user to read their own profile in /users/{userId}. Common rule: 'allow read: if request.auth != null && request.auth.uid == userId;'`);
      }
    }
    console.error(errorMessage, e);
    return null;
  }
};

export const updateUserRole = async (userId: string, role: UserProfile['role']) => {
  try {
    const userDocRef = doc(firestoreInstance, 'users', userId);
    await updateDoc(userDocRef, { role });
    console.log(`User ${userId} role updated to ${role}`);
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  if (!userId) return [];
  try {
    const q = query(
      collection(firestoreInstance, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => mapNotification({ id: docSnap.id, ...docSnap.data() }));
  } catch (e: unknown) {
    let errorMessage = `Error fetching user notifications for ${userId}`;
    if (e instanceof Error) {
      errorMessage += `: ${e.message}`;
      if ((e as any).code === 'permission-denied') {
        console.error(`Firestore permission denied when fetching notifications for user ${userId}. Check Firestore rules for /notifications collection for read access where userId matches.`);
      }
    }
    console.error(errorMessage, e);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  if (!notificationId) return;
  try {
    const notificationRef = doc(firestoreInstance, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (e: unknown) {
    let errorMessage = `Error marking notification ${notificationId} as read`;
    if (e instanceof Error) {
      errorMessage += `: ${e.message}`;
      if ((e as any).code === 'permission-denied') {
        console.error(`Firestore permission denied when marking notification ${notificationId} as read. Check Firestore rules for /notifications/{notificationId} for update access where userId matches.`);
      }
    }
     console.error(errorMessage, e);
  }
};

export const markAllUserNotificationsAsRead = async (userId: string): Promise<void> => {
  if (!userId) return;
  try {
    const q = query(
      collection(firestoreInstance, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    const batchPromises: Promise<void>[] = [];
    querySnapshot.forEach((docSnap) => {
      batchPromises.push(updateDoc(doc(firestoreInstance, 'notifications', docSnap.id), { read: true }));
    });
    if (batchPromises.length > 0) {
      await Promise.all(batchPromises);
      console.log(`Marked ${batchPromises.length} unread notifications as read for user ${userId}`);
    }
  } catch (e: unknown) {
    let errorMessage = `Error marking all user notifications as read for ${userId}`;
    if (e instanceof Error) {
      errorMessage += `: ${e.message}`;
       if ((e as any).code === 'permission-denied') {
        console.error(`Firestore permission denied when marking all notifications as read for user ${userId}. Check Firestore rules for batch updates or individual updates on /notifications.`);
      }
    }
    console.error(errorMessage, e);
  }
};

export async function subscribeToNewsletter(email: string): Promise<{ success: boolean; message: string }> {
  if (!email) {
    return { success: false, message: 'Имейлът е задължителен.' };
  }
  try {
    // Check if the email is already subscribed
    const subscribersCollectionRef = collection(firestoreInstance, 'newsletterSubscribers');
    const q = query(subscribersCollectionRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return { success: false, message: 'Този имейл вече е абониран за нашия бюлетин.' };
    }

    // If not subscribed, add the new subscriber
    await addDoc(collection(firestoreInstance, 'newsletterSubscribers'), {
      email: email.toLowerCase(),
      subscribedAt: serverTimestamp(),
    });
    return { success: true, message: 'Вие се абонирахте успешно!' };
  } catch (e: unknown) {
    let userMessage = 'Възникна грешка при абонирането. Моля, опитайте отново.';
    if (e instanceof Error) {
        console.error('Error subscribing to newsletter:', e.message, e);
        if ((e as any).code === 'permission-denied') {
             userMessage = 'Грешка: Нямате права да извършите тази операция.';
        }
    } else {
        console.error('Unknown error subscribing to newsletter:', e);
    }
    return { success: false, message: userMessage };
  }
}

export async function getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  try {
    const subscribersRef = collection(firestoreInstance, 'newsletterSubscribers');
    const q = query(subscribersRef, orderBy('subscribedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => mapNewsletterSubscriber({ id: docSnap.id, ...docSnap.data() }));
  } catch (e: unknown) {
    let errorMessage = "Error fetching newsletter subscribers";
    if (e instanceof Error) {
      errorMessage += `: ${e.message}`;
      if ((e as any).code === 'permission-denied') {
        console.error('Firestore permission denied when fetching newsletter subscribers. Ensure admin has read/list access to newsletterSubscribers collection.');
      }
    }
    console.error(errorMessage, e);
    return [];
  }
}

export async function getNewsletterSubscriptionStatus(email: string): Promise<boolean> {
  if (!email) return false;
  try {
    const subscribersRef = collection(firestoreInstance, 'newsletterSubscribers');
    const q = query(subscribersRef, where('email', '==', email), limit(1));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (e: unknown) {
    if (e instanceof Error) {
        if ((e as any).code === 'permission-denied') {
            // console.warn(`Permission denied for user to check newsletter status for email: ${email}. This is expected if user is not admin.`);
        } else {
            console.error('Could not check newsletter subscription status:', e.message, e);
        }
    } else {
        console.error('Unknown error checking newsletter subscription status:', e);
    }
    return false;
  }
}

// Export the initialized instances
export { app, authInstance as auth, firestoreInstance as firestore, isFirebaseConfigured };
