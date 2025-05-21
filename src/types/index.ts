
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

export interface Salon {
  id: string;
  name: string; // Ще бъде преведено в mock-data
  description: string; // Ще бъде преведено в mock-data
  address?: string; // Ще бъде преведено в mock-data
  city?: string; // Ще бъде преведено в mock-data
  rating: number; // 1-5
  priceRange: 'cheap' | 'moderate' | 'expensive'; // Стойностите остават на английски за логика, етикетите се превеждат в UI
  photos?: string[]; // URLs to photos - Should always be an array, even if empty
  services: Service[]; // In a real app, these might be IDs referencing a separate services collection
  reviews: Review[]; // In a real app, these might be IDs referencing a separate reviews collection
  heroImage?: string; // URL to a hero image - Made optional
  availability?: Record<string, string[]>; // Date string -> array of time slots e.g., "HH:mm"
  ownerId?: string; // UID of the business owner
  // Fields for AI generation, might not be stored directly if only used for generating the main description
  serviceDetailsForAi?: string;
  atmosphereForAi?: string;
  targetCustomerForAi?: string;
  uniqueSellingPointsForAi?: string;
  createdAt?: any; // For Firestore Timestamp
  phone?: string; // Optional phone number
  email?: string; // Optional email
  website?: string; // Optional website
  workingHours?: string; // Optional working hours
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
  userId?: string; // Firebase Auth UID
  displayName?: string; // From Firebase Auth or user input
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
  clientName?: string; // Optional: For displaying in business owner's view
  clientEmail?: string; // Optional: For displaying in business owner's view
}

