
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp, orderBy, updateDoc, limit, serverTimestamp } from 'firebase/firestore';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfile, Service, Booking, Notification, NewsletterSubscriber } from '@/types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBl6-VkACEuUwr0A9DvEBIZGZ59IiffK0M",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "glowy-gyoodev.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "glowy-gyoodev",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "glowy-gyoodev.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "404029225537",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:404029225537:web:2f9144a90f82f82eff64c0",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-6Z1J5B647X"
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const firestore = getFirestore(app);

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
    const bookingDataForFirestore: Partial<Booking> = {
      salonId: bookingDetails.salonId,
      salonName: bookingDetails.salonName,
      userId: bookingDetails.userId,
      serviceId: bookingDetails.service.id,
      serviceName: bookingDetails.service.name,
      date: bookingDetails.date,
      time: bookingDetails.time,
      status: 'pending', // Default status
      createdAt: Timestamp.fromDate(new Date()),
      clientName: bookingDetails.clientName,
      clientEmail: bookingDetails.clientEmail,
      clientPhoneNumber: bookingDetails.clientPhoneNumber,
      salonAddress: bookingDetails.salonAddress,
      salonPhoneNumber: bookingDetails.salonPhoneNumber,
    };

    const docRef = await addDoc(collection(firestore, 'bookings'), bookingDataForFirestore);
    console.log('Booking created with ID:', docRef.id);

    // Notify salon owner about the new booking
    if (bookingDetails.salonOwnerId) {
      const notificationMessage = `Нова резервация за ${bookingDetails.service.name} в ${bookingDetails.salonName} от ${bookingDetails.clientName || 'клиент'} на ${new Date(bookingDetails.date).toLocaleDateString('bg-BG')} в ${bookingDetails.time}.`;
      await addDoc(collection(firestore, 'notifications'), {
        userId: bookingDetails.salonOwnerId,
        message: notificationMessage,
        link: `/business/salon-bookings/${bookingDetails.salonId}`,
        read: false,
        createdAt: Timestamp.fromDate(new Date()),
        type: 'new_booking_business',
        relatedEntityId: docRef.id,
      });
      console.log('Notification created for salon owner:', bookingDetails.salonOwnerId);
    } else {
      console.warn('Salon owner ID not provided for booking, notification not created.');
    }

    return docRef.id;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  const bookings: Booking[] = [];
  const q = query(
    collection(firestore, 'bookings'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const booking: Booking = {
      id: doc.id,
      salonId: data.salonId,
      salonName: data.salonName,
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      userId: data.userId,
      date: data.date,
      time: data.time,
      status: data.status as Booking['status'],
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhoneNumber: data.clientPhoneNumber,
      createdAt: data.createdAt, // Ensure this is handled as Timestamp if needed
      salonAddress: data.salonAddress,
      salonPhoneNumber: data.salonPhoneNumber,
    };
    bookings.push(booking);
  });
  return bookings;
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) {
    console.warn("getUserProfile called with null or undefined userId.");
    return null;
  }
  try {
    const userDocRef = doc(firestore, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      return {
        id: userDocSnap.id,
        name: data.name || data.displayName || '',
        email: data.email || '',
        role: data.role,
        userId: data.userId || userId,
        profilePhotoUrl: data.profilePhotoUrl,
        phoneNumber: data.phoneNumber,
        numericId: data.numericId,
        preferences: {
          favoriteServices: data.preferences?.favoriteServices || [],
          priceRange: data.preferences?.priceRange || '',
          preferredLocations: data.preferences?.preferredLocations || [],
        },
      } as UserProfile;
    } else {
      console.log(`No profile found for UID: ${userId} in getUserProfile.`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile by UID (getUserProfile):', error);
    return null;
  }
};

export const updateUserRole = async (userId: string, role: string) => {
  try {
    const userDocRef = doc(firestore, 'users', userId);
    await updateDoc(userDocRef, { role });
    console.log(`User ${userId} role updated to ${role}`);
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Notification functions
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  if (!userId) return [];
  const notifications: Notification[] = [];
  try {
    const q = query(
      collection(firestore, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(10) // Limit to fetching latest 10 notifications for performance
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      notifications.push({ id: docSnap.id, ...docSnap.data() } as Notification);
    });
  } catch (error) {
    console.error("Error fetching user notifications:", error);
  }
  return notifications;
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(firestore, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};

export const markAllUserNotificationsAsRead = async (userId: string): Promise<void> => {
  if (!userId) return;
  try {
    const q = query(
      collection(firestore, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    const batch: Promise<void>[] = [];
    querySnapshot.forEach((docSnap) => {
      batch.push(updateDoc(doc(firestore, 'notifications', docSnap.id), { read: true }));
    });
    if (batch.length > 0) {
      await Promise.all(batch);
      console.log(`Marked ${batch.length} unread notifications as read for user ${userId}`);
    }
  } catch (error) {
    console.error("Error marking all user notifications as read:", error);
  }
};

// Newsletter functions
export async function subscribeToNewsletter(email: string): Promise<{ success: boolean; message: string }> {
  if (!email) {
    return { success: false, message: 'Имейлът е задължителен.' };
  }
  try {
    // Directly add the document. If duplicates are a concern, it's better handled by Firestore rules
    // (e.g., using email as document ID if uniqueness is critical and you want to prevent duplicates at write time)
    // or by periodic cleanup if occasional duplicates are acceptable.
    // The current Firestore rules allow anyone to create, which simplifies client-side logic.
    await addDoc(collection(firestore, 'newsletterSubscribers'), {
      email: email,
      subscribedAt: serverTimestamp(), // Use serverTimestamp for reliability
    });
    return { success: true, message: 'Вие се абонирахте успешно!' };
  } catch (error: any) {
    console.error('Error subscribing to newsletter:', error);
    // Basic error message. Could be more specific if you check error.code for Firestore errors.
    return { success: false, message: 'Възникна грешка при абонирането. Моля, опитайте отново.' };
  }
}


export async function getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  const subscribers: NewsletterSubscriber[] = [];
  try {
    const subscribersRef = collection(firestore, 'newsletterSubscribers');
    const q = query(subscribersRef, orderBy('subscribedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      subscribers.push({ id: docSnap.id, ...docSnap.data() } as NewsletterSubscriber);
    });
  } catch (error) {
    console.error("Error fetching newsletter subscribers:", error);
  }
  return subscribers;
}

export async function getNewsletterSubscriptionStatus(email: string): Promise<boolean> {
  if (!email) return false;
  try {
    const subscribersRef = collection(firestore, 'newsletterSubscribers');
    const q = query(subscribersRef, where('email', '==', email), limit(1));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.warn('Could not check newsletter subscription status (might be due to permissions):', error);
    return false;
  }
}


export { app, auth, analytics, firestore };
