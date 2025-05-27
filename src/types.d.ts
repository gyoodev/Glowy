import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  email?: string | null;
  displayName?: string | null;
  name?: string | null;
  phoneNumber?: string | null;
  role?: 'user' | 'business' | 'admin' | 'customer';
  // Add other user profile properties here as needed
  createdAt?: any; // Added for firebase timestamp
}

export interface SalonProfile {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  services?: string[];
  imageUrl?: string;
  ownerId: string; // Link to the user who owns the salon
  createdAt?: Timestamp; // Added for firebase timestamp
  // Add other salon profile properties here
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number; // in minutes
  price: number;
  salonId: string; // Link to the salon providing the service
  // Add other service properties here
}

export interface Booking {
  id: string;
  userId: string; // Link to the user who made the booking
  salonId: string; // Link to the salon
  serviceId: string; // Link to the service booked
  startTime: Timestamp; // Using Firebase Timestamp
  endTime: Timestamp; // Using Firebase Timestamp
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Timestamp; // Using Firebase Timestamp
  // Add other booking properties here
}

// Consider adding types for Reviews, Payments, etc.