
export interface DayWorkingHours {
  open: string;
  close: string;
  isOff: boolean;
}
export type WorkingHoursStructure = Record<string, DayWorkingHours>;

export interface Service {
  id: string;
  name: string; // Ще бъде преведено в mock-data
  description: string; // Ще бъде преведено в mock-data
  price: number;
  duration: number; // in minutes
  categoryIcon?: React.ElementType; // For Lucide icons
}

export interface Review {
  id: string;
  userName: string; // Ще бъде преведено в mock-data
  userAvatar?: string;
  rating: number; // 1-5
  comment: string; // Ще бъде преведено в mock-data
  date: string; // ISO date string
  userId?: string; // Added for consistency
  salonId?: string; // Added for consistency
}

export interface Promotion {
  isActive: boolean;
  expiresAt?: string; // ISO string date
  packageId?: string; // e.g., '7days', '30days'
  purchasedAt?: string; // ISO string date
  packageName?: string; // e.g., "7 Дни Промоция"
  paymentMethod?: 'paypal' | 'stripe' | 'revolut' | 'other'; // Added for tracking
  transactionId?: string; // Added for tracking
}

export interface Salon {
  id: string;
  name: string; // Ще бъде преведено в mock-data
  description: string; // Ще бъде преведено в mock-data
  address?: string; // Ще бъде преведено в mock-data
  city?: string; // Ще бъде преведено в mock-data
  rating: number; // 1-5
  priceRange: 'cheap' | 'moderate' | 'expensive' | ''; // Updated to include empty string for "any"
  photos?: string[]; // URLs to photos - Should always be an array, even if empty
  services: Service[]; // In a real app, these might be IDs referencing a separate services collection
  reviews: Review[]; // In a real app, these might be IDs referencing a separate reviews collection
  heroImage?: string; // URL to a hero image
  availability?: Record<string, string[]>; // Date string -> array of time slots e.g., "HH:mm"
  ownerId?: string; // UID of the business owner
  // Fields for AI generation, might not be stored directly if only used for generating the main description
  atmosphereForAi?: string;
  targetCustomerForAi?: string;
  uniqueSellingPointsForAi?: string;
  createdAt?: any; // For Firestore Timestamp
  phone?: string;
  email?: string;
  website?: string;
  workingHours?: WorkingHoursStructure; // Updated type
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
  displayName?: string; // From Firebase Auth or user input
  phoneNumber?: string;
}

export interface Booking {
  id: string;
  salonId: string;
  salonName: string;
  serviceId: string;
  serviceName: string;
  userId: string; // UID of the user who made the booking
  date: string; // ISO date string
  time: string; // "HH:mm"
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  createdAt?: any; // For Firestore Timestamp
  clientName: string;
  clientEmail: string;
  clientPhoneNumber: string;
  salonAddress?: string; // Added for displaying in booking history
  salonPhoneNumber?: string; // Added for displaying in booking history
}
