
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
  location?: { lat: number; lng: number }; // Made optional
  rating?: number;
  createdAt: string; // Changed from Timestamp
  priceRange?: 'cheap' | 'moderate' | 'expensive' | '';
  availability?: Record<string, string[]>; // Date string -> array of time slots "HH:mm"
  workingHours?: WorkingHoursStructure;
  promotion?: Promotion;
  // AI generation helper fields - optional as they might not always be present
  atmosphereForAi?: string;
  targetCustomerForAi?: string;
  uniqueSellingPointsForAi?: string;
  // reviews array is usually fetched separately, not stored directly on salon doc for scalability
}
