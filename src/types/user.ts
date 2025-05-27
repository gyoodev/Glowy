import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  profilePhotoUrl: string;
  role: 'admin' | 'business' | 'customer';
  preferences: {
    favoriteServices: string[];
    priceRange: string;
    preferredLocations: string[];
  };
  createdAt: Timestamp;
}