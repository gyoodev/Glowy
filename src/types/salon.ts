
import type { Service } from './service';
import type { Promotion } from './promotion'; // Assuming promotion type is in its own file or index

export interface DayWorkingHours {
  open: string;
  close: string;
  isOff: boolean;
}
export type WorkingHoursStructure = Record<string, DayWorkingHours>;

export interface Salon {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  address: string;
  city: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  services?: Service[];
  photos?: string[];
  heroImage?: string;
  location?: { lat: number; lng: number };
  rating?: number;
  reviewCount?: number; // Added optional reviewCount property
  createdAt: string; 
  priceRange?: 'cheap' | 'moderate' | 'expensive' | '';
  availability?: Record<string, string[]>; 
  workingHours?: WorkingHoursStructure;
  promotion?: Promotion;
  atmosphereForAi?: string;
  targetCustomerForAi?: string;
  isFavorite?: boolean;
  uniqueSellingPointsForAi?: string;
  status: 'pending_approval' | 'approved' | 'rejected';
}

