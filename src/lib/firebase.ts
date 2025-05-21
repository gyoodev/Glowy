
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
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
export const createBooking = async (bookingDetails: { salonId: string; service: string; date: string; time: string; userId: string }) => {
  try {
    const docRef = await addDoc(collection(firestore, 'bookings'), bookingDetails);
    console.log('Booking created with ID:', docRef.id);
    return docRef.id; // Return the ID of the newly created booking
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error; // Re-throw the error for handling in the calling code
  }
};

// Function to get bookings for a specific user
export const getUserBookings = async (userId: string) => {
  const bookings: any[] = [];
  const q = query(collection(firestore, 'bookings'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    bookings.push({ id: doc.id, ...doc.data() });
  });
  return bookings;
};

// Function to get user profile data
export const getUserProfile = async (userId: string) => {
  try {
    const userDocRef = doc(firestore, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return { id: userDocSnap.id, ...userDocSnap.data() };
    } else {
      return null; // User document not found
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error; // Re-throw the error
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
    throw error; // Re-throw the error
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
    throw error; // Re-throw the error
  }
};
export { app, auth, analytics };
