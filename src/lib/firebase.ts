
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
  FieldValue // Keep for serverTimestamp
} from 'firebase/firestore';
import type { UserProfile, Service, Booking, Notification, NotificationType, NewsletterSubscriber } from '@/types';
import { mapUserProfile, mapBooking, mapNotification, mapNewsletterSubscriber } from '@/utils/mappers'; // Path alias should now work
import firebaseConfig from './firebase/config';

// The critical check that throws an error has been removed from this file.
// The check now happens in layout.tsx using the isFirebaseConfigured boolean from './firebase/config'.
// This prevents the app from crashing at the module level before it can render an error UI.

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const authInstance = getAuth(app);
const firestoreInstance = getFirestore(app);

let analytics;
if (typeof window !== 'undefined') {
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
  clientName: string;
  clientEmail: string;
  clientPhoneNumber: string;
  salonAddress?: string;
  salonPhoneNumber?: string;
}) => {
  try {
    const bookingDataForFirestore: Omit<Booking, 'id' | 'startTime' | 'endTime' | 'createdAt' | 'serviceId' | 'serviceName' | 'service'> & { serviceId: string; serviceName: string; service?: Service; createdAt: FieldValue } = {
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
      clientName: bookingDetails.clientName,
      clientEmail: bookingDetails.clientEmail,
      clientPhoneNumber: bookingDetails.clientPhoneNumber,
      salonAddress: bookingDetails.salonAddress,
      salonPhoneNumber: bookingDetails.salonPhoneNumber,
      service: bookingDetails.service, // Include the full service object
    };

    const docRef = await addDoc(collection(firestoreInstance, 'bookings'), bookingDataForFirestore);
    console.log('Booking created with ID:', docRef.id);

    if (bookingDetails.salonOwnerId) {
      const notificationMessage = `Нова резервация за ${bookingDetails.service.name} в ${bookingDetails.salonName} от ${bookingDetails.clientName || 'клиент'} на ${new Date(bookingDetails.date).toLocaleDateString('bg-BG')} в ${bookingDetails.time}.`;
      await addDoc(collection(firestoreInstance, 'notifications'), {
        userId: bookingDetails.salonOwnerId,
        message: notificationMessage,
        link: `/business/salon-bookings/${bookingDetails.salonId}`,
        read: false,
        createdAt: serverTimestamp(),
        type: 'new_booking_business' as NotificationType,
        relatedEntityId: docRef.id,
      });
      console.log('Notification created for salon owner:', bookingDetails.salonOwnerId);
    } else {
      console.warn('Salon owner ID not provided for booking, notification to owner not created.');
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
    await addDoc(collection(firestoreInstance, 'newsletterSubscribers'), {
      email: email,
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
export { app, authInstance as auth, analytics, firestoreInstance as firestore,FieldValue };
