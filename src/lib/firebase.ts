
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import type { UserProfile, Service } from '@/types'; // Ensure Service type is imported

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBl6-VkACEuUwr0A9DvEBIZGZ59IiffK0M", 
  authDomain: "glowy-gyoodev.firebaseapp.com",
  projectId: "glowy-gyoodev",
  storageBucket: "glowy-gyoodev.firebasestorage.app",
  messagingSenderId: "404029225537",
  appId: "1:404029225537:web:2f9144a90f82f82eff64c0",
  measurementId: "G-6Z1J5B647X"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);

let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

const firestore = getFirestore(app);

// Function to create a new booking
export const createBooking = async (bookingDetails: {
  salonId: string;
  salonName: string; // Added salonName
  userId: string;
  service: Service; // Use the specific Service type
  date: string;
  time: string;
}) => {
  try {
    const bookingDataForFirestore = {
      salonId: bookingDetails.salonId,
      salonName: bookingDetails.salonName,
      userId: bookingDetails.userId,
      serviceId: bookingDetails.service.id,
      serviceName: bookingDetails.service.name,
      // Optionally add other serializable service details if needed for history
      // e.g., serviceDescription: bookingDetails.service.description,
      // e.g., servicePrice: bookingDetails.service.price,
      date: bookingDetails.date,
      time: bookingDetails.time,
      status: 'confirmed', // Default status
      createdAt: Timestamp.fromDate(new Date()),
      // DO NOT include the full service object or its categoryIcon here
    };
    const docRef = await addDoc(collection(firestore, 'bookings'), bookingDataForFirestore);
    console.log('Booking created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error; // Re-throw the error to be caught by the calling function
  }
};

// Function to get bookings for a specific user
export const getUserBookings = async (userId: string) => {
  const bookings: any[] = [];
  const q = query(collection(firestore, 'bookings'), where('userId', '==', userId), where('status', '!=', 'cancelled')); // Example: exclude cancelled
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    bookings.push({ id: doc.id, ...doc.data() });
  });
  return bookings;
};

// Function to get user profile data by UID
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(firestore, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
    } else {
      console.log(`No profile found for UID: ${userId}`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile by UID:', error);
    throw error;
  }
};


// Function to get user profile data by email (still uses UID as doc ID eventually)
export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  if (!email) {
    console.warn("Attempted to fetch profile with null or undefined email.");
    return null;
  }
  try {
    const usersQuery = query(collection(firestore, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(usersQuery);
    if (!querySnapshot.empty) {
      // Assuming email is unique, so take the first one.
      const userDoc = querySnapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() } as UserProfile;
    } else {
      console.log(`No profile found for email: ${email}`);
      return null; // User document not found for this email
    }
  } catch (error: any) {
    console.error('Error fetching user profile by email:', error);
    if (error.code === 'failed-precondition') {
        console.error(
        "Firestore query failed: This usually means you're missing a composite index " +
        "for the query on the 'email' field in the 'users' collection. " +
        "Check the Firebase console for a link to create it."
        );
    }
    throw error; 
  }
};


// Function to update a user's role
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

// Function to get booking status
export const getBookingStatus = async (bookingId: string) => {
  try {
    const bookingDocRef = doc(firestore, 'bookings', bookingId);
    const bookingDocSnap = await getDoc(bookingDocRef);

    if (bookingDocSnap.exists()) {
      return bookingDocSnap.data().status || null; // Return status or null if missing
    } else {
      return null; // Booking document not found
    }
  } catch (error) {
    console.error('Error fetching booking status:', error);
    throw error;
  }
};
export { app, auth, analytics, firestore };
