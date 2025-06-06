import { Timestamp } from 'firebase/firestore';
import type {
  Booking,
  Review,
  Service,
  UserProfile,
  Salon,
  Notification,
  NewsletterSubscriber,
} from '@/types';

function timestampToISOString(value: Timestamp | string | undefined | Date): string {
  if (!value) return new Date().toISOString(); // Default to now if undefined/null
  if (typeof value === 'string') return value; // Already a string
  if (value instanceof Date) return value.toISOString(); // It's a JS Date
  if (value instanceof Timestamp) return value.toDate().toISOString(); // It's a Firestore Timestamp
  return new Date().toISOString(); // Fallback
}

// -------------------- Booking --------------------
export function mapBooking(raw: any): Booking {
  return {
    id: raw.id,
    userId: raw.userId,
    salonId: raw.salonId,
    serviceId: raw.serviceId,
    // Ensure startTime and endTime are handled, they might be Timestamps or already strings
    startTime: timestampToISOString(raw.startTime),
    endTime: timestampToISOString(raw.endTime),
    salonName: raw.salonName || 'N/A',
    serviceName: raw.serviceName || 'N/A',
    date: raw.date || new Date().toISOString().split('T')[0], // date is already typically a string 'YYYY-MM-DD'
    time: raw.time || 'N/A',
    status: raw.status as Booking['status'] || 'pending',
    clientName: raw.clientName || 'N/A',
    clientEmail: raw.clientEmail || 'N/A',
    clientPhoneNumber: raw.clientPhoneNumber || 'N/A',
    createdAt: timestampToISOString(raw.createdAt),
    salonAddress: raw.salonAddress || 'N/A',
    salonPhoneNumber: raw.salonPhoneNumber || 'N/A',
    salonOwnerId: raw.salonOwnerId || 'N/A',
    service: raw.service as Service || { id: '', name: 'N/A', duration: 0, price: 0, description: '' },
  };
}

// -------------------- Review --------------------
// Assuming a more complete Review type might be used elsewhere.
// The current Review type in `types/review.ts` is minimal.
// This mapper matches what might be expected based on `ReviewCard` and `AddReviewForm`.
export function mapReview(raw: any, id?: string): Review {
  return {
    id: id || raw.id,
    userId: raw.userId || '',
    salonId: raw.salonId || '',
    rating: raw.rating ?? 0,
    comment: raw.comment || '',
    date: timestampToISOString(raw.date),
    // Fields used by ReviewCard, potentially set during review creation
    userName: raw.userName || 'Анонимен потребител',
    userAvatar: raw.userAvatar || 'https://placehold.co/40x40.png',
    // Fields from types/review.ts
    reply: raw.reply || '',
    reviewedBy: raw.reviewedBy || '', // This field is a bit ambiguous
  };
}

// -------------------- UserProfile --------------------
export function mapUserProfile(raw: any, idOverride?: string): UserProfile {
  return {
    id: idOverride || raw.id || raw.userId || '', // Ensure ID is present
    userId: raw.userId || idOverride || raw.id || '', // Ensure userId is present
    name: raw.name || raw.displayName || 'Потребител',
    displayName: raw.displayName || raw.name || 'Потребител',
    email: raw.email || '',
    profilePhotoUrl: raw.profilePhotoUrl || '',
    role: raw.role || 'customer',
    preferences: raw.preferences || {
      favoriteServices: [],
      priceRange: '',
      preferredLocations: [],
    },
    createdAt: timestampToISOString(raw.createdAt),
    phoneNumber: raw.phoneNumber || '',
    numericId: raw.numericId || undefined, // Keep as number | undefined
    lastUpdatedAt: raw.lastUpdatedAt ? timestampToISOString(raw.lastUpdatedAt) : undefined,
  };
}

// -------------------- Salon --------------------
// This needs to be comprehensive based on all fields used for a Salon.
export function mapSalon(raw: any, id?: string): Salon {
  const services = Array.isArray(raw.services) ? raw.services.map((s: any) => ({
    id: s.id || '',
    name: s.name || 'Unnamed Service',
    description: s.description || '',
    price: typeof s.price === 'number' ? s.price : 0,
    duration: typeof s.duration === 'number' ? s.duration : 0,
    categoryIcon: s.categoryIcon, // This will be undefined if not present
  })) : [];

  const workingHours = raw.workingHours || {};
  // Ensure all days are present in workingHours
  const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  daysOfWeek.forEach(day => {
    if (!workingHours[day]) {
      workingHours[day] = { open: '', close: '', isOff: true }; // Default to closed if day is missing
    }
  });
  
  return {
    id: id || raw.id,
    name: raw.name || 'Неизвестен салон',
    description: raw.description || '',
    ownerId: raw.ownerId || '',
    address: raw.address || '',
    city: raw.city || '', // Added city
    priceRange: raw.priceRange || 'moderate', // Added priceRange
    phoneNumber: raw.phoneNumber || raw.phone || '', // Added phone
    email: raw.email || '', // Added email
    website: raw.website || '', // Added website
    services: services,
    photos: Array.isArray(raw.photos) ? raw.photos : [],
    heroImage: raw.heroImage || '', // Added heroImage
    location: raw.location || { lat: 0, lng: 0 },
    rating: typeof raw.rating === 'number' ? raw.rating : 0,
    createdAt: timestampToISOString(raw.createdAt),
    availability: raw.availability || {}, // Added availability
    workingHours: workingHours, // Added workingHours
    promotion: raw.promotion, // Added promotion, ensure it's mapped if complex
    // Fields from CreateBusinessPage that might be missing
    atmosphereForAi: raw.atmosphereForAi || '',
    targetCustomerForAi: raw.targetCustomerForAi || '',
    uniqueSellingPointsForAi: raw.uniqueSellingPointsForAi || '',
  };
}

// -------------------- Notification --------------------
export function mapNotification(raw: any, id?: string): Notification {
  return {
    id: id || raw.id,
    userId: raw.userId,
    message: raw.message || '', // Title was removed from type, message is main content
    type: raw.type || 'info',
    read: raw.read ?? false,
    createdAt: timestampToISOString(raw.createdAt),
    link: raw.link, // link is optional
    relatedEntityId: raw.relatedEntityId, // optional
  };
}

// -------------------- NewsletterSubscriber --------------------
export function mapNewsletterSubscriber(raw: any, id?: string): NewsletterSubscriber {
  return {
    id: id || raw.id,
    email: raw.email || '',
    subscribedAt: timestampToISOString(raw.subscribedAt),
  };
}
