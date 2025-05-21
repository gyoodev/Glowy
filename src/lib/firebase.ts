
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import type { UserProfile, Service, Booking } from '@/types'; // Ensure Service type is imported

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
const firestore = getFirestore(app); // Initialize firestore once

let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}


// Function to create a new booking
export const createBooking = async (bookingDetails: {
  salonId: string;
  salonName: string;
  userId: string;
  service: Service;
  date: string;
  time: string;
}) => {
  try {
    const bookingDataForFirestore = {
      salonId: bookingDetails.salonId,
      salonName: bookingDetails.salonName, // Storing salonName
      userId: bookingDetails.userId,
      serviceId: bookingDetails.service.id,
      serviceName: bookingDetails.service.name,
      date: bookingDetails.date,
      time: bookingDetails.time,
      status: 'confirmed', // Default status
      createdAt: Timestamp.fromDate(new Date()),
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
export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  const bookings: Booking[] = [];
  // Example: exclude cancelled, order by creation date descending
  const q = query(
    collection(firestore, 'bookings'),
    where('userId', '==', userId)
    // orderBy('createdAt', 'desc') // This would require a composite index if 'status' is also filtered with inequality
  );
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    // Ensure the fetched data conforms to the Booking type
    const data = doc.data();
    const booking: Booking = {
      id: doc.id,
      salonId: data.salonId,
      salonName: data.salonName,
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      date: data.date,
      time: data.time,
      status: data.status as Booking['status'], // Type assertion for status
      // Optionally map other fields if they exist and are part of Booking type
    };
    bookings.push(booking);
  });
  return bookings;
};

// Function to get user profile data by UID
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
      // Ensure the data conforms to UserProfile, especially nested objects
      return {
        id: userDocSnap.id,
        name: data.name || data.displayName || '', // Handle potential variations
        email: data.email || '',
        role: data.role,
        userId: data.userId || userId, // Ensure userId field exists
        profilePhotoUrl: data.profilePhotoUrl,
        preferences: {
          favoriteServices: data.preferences?.favoriteServices || [],
          priceRange: data.preferences?.priceRange || '',
          preferredLocations: data.preferences?.preferredLocations || [],
        },
        // Add any other fields from UserProfile type with defaults if necessary
      } as UserProfile;
    } else {
      console.log(`No profile found for UID: ${userId} in getUserProfile.`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile by UID (getUserProfile):', error);
    return null; // Return null on error instead of throwing
  }
};


// Function to get user profile data by email
export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  if (!email) {
    console.warn("Attempted to fetch profile with null or undefined email.");
    return null;
  }
  try {
    const usersQuery = query(collection(firestore, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(usersQuery);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const data = userDoc.data();
      return {
        id: userDoc.id,
        name: data.name || data.displayName || '',
        email: data.email || '',
        role: data.role,
        userId: data.userId || userDoc.id,
        profilePhotoUrl: data.profilePhotoUrl,
        preferences: {
          favoriteServices: data.preferences?.favoriteServices || [],
          priceRange: data.preferences?.priceRange || '',
          preferredLocations: data.preferences?.preferredLocations || [],
        },
      } as UserProfile;
    } else {
      console.log(`No profile found for email: ${email} in getUserProfileByEmail.`);
      return null;
    }
  } catch (error: any) {
    console.error('Error fetching user profile by email (getUserProfileByEmail):', error);
    if (error.code === 'failed-precondition') {
        console.error(
        "Firestore query failed: This usually means you're missing a composite index " +
        "for the query on the 'email' field in the 'users' collection. " +
        "Check the Firebase console for a link to create it."
        );
    }
    // throw error; // Consider returning null instead of throwing for robustness in calling components
    return null;
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
export { app, auth, analytics }; // firestore is already initialized and exported by getFirestore(app)
