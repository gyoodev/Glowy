
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
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  comment: string;
  date: string; // ISO date string
  userId?: string;
  salonId?: string;
}

export interface Promotion {
  isActive: boolean;
  expiresAt?: string; // ISO string date
  packageId?: string; // e.g., '7days', '30days'
  packageName?: string; // e.g., "Сребърен план"
  purchasedAt?: string; // ISO string date
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
  role?: 'customer' | 'business' | 'admin';
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
  id: string;
  salonId: string;
  salonName: string;
  serviceId: string;
  serviceName: string;
  userId: string;
  date: string; // ISO date string
  time: string; // "HH:mm"
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  createdAt?: any; // For Firestore Timestamp
  clientName: string;
  clientEmail: string;
  clientPhoneNumber: string;
  salonAddress?: string;
  salonPhoneNumber?: string;
}

export type NotificationType =
  | 'new_booking_business'
  | 'booking_status_change_customer'
  | 'new_review_business'
  | 'new_user_admin'
  | 'new_salon_admin'
  | 'new_payment_admin'
  | 'review_reminder'
  | 'welcome_user' // Added welcome user type
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
