
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
}

export interface Salon {
  id: string;
  name: string; // Ще бъде преведено в mock-data
  description: string; // Ще бъде преведено в mock-data
  address: string; // Ще бъде преведено в mock-data
  city: string; // Ще бъде преведено в mock-data
  rating: number; // 1-5
  priceRange: 'cheap' | 'moderate' | 'expensive'; // Стойностите остават на английски за логика, етикетите се превеждат в UI
  photos: string[]; // URLs to photos
  services: Service[];
  reviews: Review[];
  heroImage: string; // URL to a hero image
  availability?: Record<string, string[]>; // Date string -> array of time slots e.g., "HH:mm"
}

export interface UserProfile {
  id: string;
  name: string; // Ще бъде преведено в mock-data
  email: string;
  role?: string;
  profilePhotoUrl?: string;
  preferences?: {
    favoriteServices?: string[]; // Ще бъде преведено в mock-data
    priceRange?: 'cheap' | 'moderate' | 'expensive'; // Стойностите остават на английски
    preferredLocations?: string[]; // Ще бъде преведено в mock-data
  };
}

export interface Booking {
  id: string;
  salonId: string;
  salonName: string; // Ще бъде преведено в mock-data
  serviceId: string;
  serviceName: string; // Ще бъде преведено в mock-data
  date: string; // ISO date string
  time: string; // "HH:mm"
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'; // Стойностите остават на английски за логика, етикетите се превеждат в UI
}
