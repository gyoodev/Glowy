
export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  displayName?: string; // Often used by Firebase Auth, good to have
  email: string;
  profilePhotoUrl?: string;
  role: 'admin' | 'business' | 'customer';
  preferences?: {
    favoriteServices?: string[];
    priceRange?: 'cheap' | 'moderate' | 'expensive' | ''; // Allow empty string for 'any'
    preferredLocations?: string[];
  };
  createdAt: string; // Changed from Timestamp
  phoneNumber?: string;
  numericId?: number;
  lastUpdatedAt?: string; // Changed from Date
}
