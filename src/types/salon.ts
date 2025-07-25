
import type { Service } from './service';
import type { Promotion } from './promotion'; 

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
  region?: string;
  address: string;
  city: string;
  neighborhood?: string;
  street?: string;
  streetNumber?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  services?: Service[];
  workingMethod?: 'appointment' | 'walk_in' | 'both';
  photos?: string[];
  heroImage?: string;
  location?: { lat: number; lng: number; } | null;
  rating?: number;
  reviewCount?: number;
  createdAt?: string; 
  lastUpdatedAt?: string;
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
