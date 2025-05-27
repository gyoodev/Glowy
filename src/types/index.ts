
// UserProfile type includes the 'customer' role
export interface DayWorkingHours {
  open: string;
  close: string;
  isOff: boolean;
}
export type WorkingHoursStructure = Record<string, DayWorkingHours>;

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // in minutes
  categoryIcon?: React.ElementType;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
}

export interface Promotion {
  isActive: boolean;
  expiresAt?: string; // ISO string date
  packageId?: string; // e.g., '7days', '30days'
  packageName?: string; // e.g., "Сребърен план"
  purchasedAt?: any; // Changed from string | undefined to any for FieldValue.serverTimestamp()
  paymentMethod?: 'paypal' | 'stripe' | 'revolut' | 'other';
  transactionId?: string;
}

export interface Salon {
  id: string;
  name: string;
  description: string;
  address?: string;
  city?: string;
  rating: number; // 1-5
  priceRange: 'cheap' | 'moderate' | 'expensive' | '';
  photos?: string[];
  services: Service[];
  reviews: Review[]; // This might store review IDs or basic info if reviews are in a separate collection
  heroImage?: string;
  availability?: Record<string, string[]>;
  ownerId?: string;
  atmosphereForAi?: string;
  targetCustomerForAi?: string;
  uniqueSellingPointsForAi?: string;
  createdAt?: any; // For Firestore Timestamp
  phone?: string;
  email?: string;
  website?: string;
  workingHours?: WorkingHoursStructure;
  promotion?: Promotion;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: 'user' | 'customer' | 'business' | 'admin';
  profilePhotoUrl?: string;
  preferences?: {
    favoriteServices?: string[];
    priceRange?: 'cheap' | 'moderate' | 'expensive' | '';
    preferredLocations?: string[];
  };
  lastUpdatedAt?: Date;
  userId: string; // Firebase Auth UID
  displayName?: string;
  phoneNumber?: string;
  numericId?: number;
}

export interface Booking {
  id: string; // Unique identifier for the booking
  salonId: string; // ID of the associated salon
  salonName: string; // Name of the associated salon
  serviceId: string; // ID of the booked service
  serviceName: string; // Name of the booked service
  userId: string; // ID of the user who made the booking
  startTime: Timestamp; // Start time of the booking (e.g., ISO string or specific format)
  endTime: string; // End time of the booking (e.g., ISO string or specific format)
  date: string; // Date of the booking (ISO date string)
  time: string; // Time of the booking ("HH:mm")
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'; // Current status of the booking
  createdAt?: any; // For Firestore Timestamp
  clientName?: string; // Name of the client (optional)
  clientEmail?: string; // Email of the client (optional)
  clientPhoneNumber?: string; // Phone number of the client (optional)
  salonAddress?: string;
  salonPhoneNumber?: string;
  salonOwnerId?: string; // Added for notifying salon owner
}

export type NotificationType =
  | 'new_booking_business'
  | 'booking_status_change_customer'
  | 'new_review_business'
  | 'new_user_admin'
  | 'new_salon_admin'
  | 'new_payment_admin'
  | 'review_reminder'
  | 'welcome_user'
  | 'generic';

export interface Notification {
  id: string;
  userId: string; // The user who should receive this notification
  message: string;
  link?: string;
  read: boolean;
  createdAt: any; // Firestore Timestamp
  type?: NotificationType;
  relatedEntityId?: string; // e.g., bookingId, salonId, userId
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: any; // Firestore Timestamp
}
