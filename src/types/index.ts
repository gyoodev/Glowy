
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  categoryIcon?: React.ElementType; // For Lucide icons
}

export interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  comment: string;
  date: string; // ISO date string
}

export interface Salon {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  rating: number; // 1-5
  priceRange: 'cheap' | 'moderate' | 'expensive';
  photos: string[]; // URLs to photos
  services: Service[];
  reviews: Review[];
  heroImage: string; // URL to a hero image
  availability?: Record<string, string[]>; // Date string -> array of time slots e.g., "HH:mm"
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profilePhotoUrl?: string;
  preferences?: {
    favoriteServices?: string[];
    priceRange?: 'cheap' | 'moderate' | 'expensive';
    preferredLocations?: string[];
  };
}

export interface Booking {
  id: string;
  salonId: string;
  salonName: string;
  serviceId: string;
  serviceName: string;
  date: string; // ISO date string
  time: string; // "HH:mm"
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
}
