
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp, orderBy, updateDoc, limit, serverTimestamp, doc, setDoc, FieldValue, getDoc } from 'firebase/firestore'; // Added getDoc
import type { UserProfile, Service, Booking, Notification, NotificationType, NewsletterSubscriber } from '@/types';

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
    const bookingDataForFirestore: Omit<Booking, 'id'> = {
      salonId: bookingDetails.salonId,
      salonName: bookingDetails.salonName,
      salonOwnerId: bookingDetails.salonOwnerId,
      userId: bookingDetails.userId,
      serviceId: bookingDetails.service.id,
      serviceName: bookingDetails.service.name,
      date: bookingDetails.date,
      time: bookingDetails.time,
      status: 'pending', // Default status
      createdAt: serverTimestamp(),
      clientName: bookingDetails.clientName,
      clientEmail: bookingDetails.clientEmail,
      clientPhoneNumber: bookingDetails.clientPhoneNumber,
      salonAddress: bookingDetails.salonAddress,
      salonPhoneNumber: bookingDetails.salonPhoneNumber,
    };

    const docRef = await addDoc(collection(firestore, 'bookings'), bookingDataForFirestore);
    console.log('Booking created with ID:', docRef.id);

    // Notify salon owner
    if (bookingDetails.salonOwnerId) {
      const notificationMessage = `Нова резервация за ${bookingDetails.service.name} в ${bookingDetails.salonName} от ${bookingDetails.clientName || 'клиент'} на ${new Date(bookingDetails.date).toLocaleDateString('bg-BG')} в ${bookingDetails.time}.`;
      await addDoc(collection(firestore, 'notifications'), {
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
  const bookings: Booking[] = [];
  if (!userId) return bookings;
  try {
    const q = query(
      collection(firestore, 'bookings'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const booking: Booking = {
        id: docSnap.id,
        salonId: data.salonId,
        salonName: data.salonName,
        salonOwnerId: data.salonOwnerId,
        serviceId: data.serviceId,
        serviceName: data.serviceName,
        userId: data.userId,
        // Combine date and time strings to create Timestamp objects
        // Handle potential missing date or time data gracefully
        startTime: (data.date && data.time)
          ? Timestamp.fromDate(new Date(`${data.date}T${data.time}`))
 : (data.createdAt || Timestamp.now()), // Fallback to createdAt or now
        // endTime is a string according to the Booking type
        endTime: data.time || '', // Assign time string directly
        date: data.date || '',
        time: data.time || '',
        status: data.status as Booking['status'],
        clientName: data.clientName, // Should be populated on creation
        clientEmail: data.clientEmail, // Should be populated on creation
        clientPhoneNumber: data.clientPhoneNumber, // Should be populated on creation
        createdAt: data.createdAt,
        salonAddress: data.salonAddress,
        salonPhoneNumber: data.salonPhoneNumber,
      };
      bookings.push(booking);
    });
  } catch (error) {
    console.error(`Error fetching bookings for user ${userId}:`, error);
  }
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
        userId: data.userId || userId,
        name: data.name || data.displayName || '',
        displayName: data.displayName || data.name || '',
        email: data.email || '',
        role: data.role,
        profilePhotoUrl: data.profilePhotoUrl,
        phoneNumber: data.phoneNumber,
        numericId: data.numericId,
        preferences: {
          favoriteServices: data.preferences?.favoriteServices || [],
          priceRange: data.preferences?.priceRange || '',
          preferredLocations: data.preferences?.preferredLocations || [],
        },
        // lastUpdatedAt: data.lastUpdatedAt ? (data.lastUpdatedAt as Timestamp).toDate() : undefined,
      } as UserProfile;
    } else {
      console.log(`No Firestore profile found for UID: ${userId} in getUserProfile.`);
      return null;
    }
  } catch (error: any) {
    console.error(`Error fetching user profile for UID ${userId}:`, error);
    if (error.code === 'permission-denied') {
      console.error(`Firestore permission denied when fetching profile for user ${userId}. Check Firestore rules for /users/{userId}.`);
    }
    return null; // Return null on any error to allow graceful handling
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

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  if (!userId) return [];
  const notifications: Notification[] = [];
  try {
    const q = query(
      collection(firestore, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20) // Increased limit slightly
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      notifications.push({ id: docSnap.id, ...docSnap.data() } as Notification);
    });
  } catch (error: any) {
    console.error("Error fetching user notifications:", error);
    if (error.code === 'permission-denied') {
      console.error(`Firestore permission denied when fetching notifications for user ${userId}. Check Firestore rules for /notifications collection for read access where userId matches.`);
    }
  }
  return notifications;
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  if (!notificationId) return;
  try {
    const notificationRef = doc(firestore, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
     if (error.code === 'permission-denied') {
      console.error(`Firestore permission denied when marking notification ${notificationId} as read. Check Firestore rules for /notifications/{notificationId} for update access where userId matches.`);
    }
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
    const batchPromises: Promise<void>[] = [];
    querySnapshot.forEach((docSnap) => {
      batchPromises.push(updateDoc(doc(firestore, 'notifications', docSnap.id), { read: true }));
    });
    if (batchPromises.length > 0) {
      await Promise.all(batchPromises);
      console.log(`Marked ${batchPromises.length} unread notifications as read for user ${userId}`);
    }
  } catch (error: any) {
    console.error("Error marking all user notifications as read:", error);
    if (error.code === 'permission-denied') {
      console.error(`Firestore permission denied when marking all notifications as read for user ${userId}. Check Firestore rules for batch updates or individual updates on /notifications.`);
    }
  }
};

export async function subscribeToNewsletter(email: string): Promise<{ success: boolean; message: string }> {
  if (!email) {
    return { success: false, message: 'Имейлът е задължителен.' };
  }
  try {
    await addDoc(collection(firestore, 'newsletterSubscribers'), {
      email: email,
      subscribedAt: serverTimestamp(),
    });
    return { success: true, message: 'Вие се абонирахте успешно!' };
  } catch (error: any) {
    console.error('Error subscribing to newsletter:', error);
    if (error.code === 'permission-denied') {
      return { success: false, message: 'Грешка: Нямате права да извършите тази операция.' };
    }
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
  } catch (error: any) {
    console.error("Error fetching newsletter subscribers:", error);
    if (error.code === 'permission-denied') {
      console.error('Firestore permission denied when fetching newsletter subscribers. Ensure admin has read/list access to newsletterSubscribers collection.');
    }
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
  } catch (error: any) {
    // This function is called by non-admins on their profile page.
    // Rules usually restrict non-admins from querying newsletterSubscribers.
    // So, an error (likely permission-denied) is expected here for non-admins.
    // We log it but return false, as the user effectively isn't confirmed as subscribed if we can't check.
    if (error.code === 'permission-denied') {
      // console.warn(`Permission denied for user to check newsletter status for email: ${email}. This is expected if user is not admin.`);
    } else {
      console.error('Could not check newsletter subscription status:', error.message || error);
    }
    return false;
  }
}

export { app, auth, analytics, firestore, FieldValue };
