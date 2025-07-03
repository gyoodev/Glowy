
import { Timestamp } from 'firebase/firestore';
import type {
  Booking,
  Review,
  Service,
  UserProfile,
  Salon,
  Notification,
  NewsletterSubscriber,
  DayWorkingHours,
  WorkingHoursStructure,
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
export function mapReview(raw: any, id?: string): Review {
  return {
    id: id || raw.id,
    userId: raw.userId || '',
    salonId: raw.salonId || '',
    rating: raw.rating ?? 0,
    comment: raw.comment || '',
    date: timestampToISOString(raw.date),
    userName: raw.userName || 'Анонимен потребител',
    userAvatar: raw.userAvatar || 'https://placehold.co/40x40.png',
    reply: raw.reply || '',
    reviewedBy: raw.reviewedBy || '',
  };
}

// -------------------- UserProfile --------------------
export function mapUserProfile(raw: any, idOverride?: string): UserProfile {
  return {
    id: idOverride || raw.id || raw.userId || '', 
    userId: raw.userId || idOverride || raw.id || '', 
    name: raw.name || raw.displayName || 'Потребител',
    displayName: raw.displayName || raw.name || 'Потребител',
    email: raw.email || '',
    profilePhotoUrl: raw.profilePhotoUrl || '',
    role: raw.role || 'customer',
    preferences: raw.preferences || {
      favoriteServices: [],
      priceRange: '',
      preferredLocations: [],
      favoriteSalons: [], // Added favoriteSalons here for consistency
    },
    createdAt: timestampToISOString(raw.createdAt),
    phoneNumber: raw.phoneNumber || '',
    numericId: raw.numericId || undefined, 
    lastUpdatedAt: raw.lastUpdatedAt ? timestampToISOString(raw.lastUpdatedAt) : undefined,
  };
}

// -------------------- Salon --------------------
const daysOrder: (keyof WorkingHoursStructure)[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export function mapSalon(raw: any, id?: string): Salon {
  const services = Array.isArray(raw.services) ? raw.services.map((s: any) => ({
    id: s.id || '',
    name: s.name || 'Unnamed Service',
    description: s.description || '',
    price: typeof s.price === 'number' ? s.price : 0,
    duration: typeof s.duration === 'number' ? s.duration : 0,
    categoryIcon: s.categoryIcon,
  })) : [];

  let workingHours: WorkingHoursStructure = {};
  if (typeof raw.workingHours === 'object' && raw.workingHours !== null) {
    daysOrder.forEach(dayKey => {
      if (raw.workingHours[dayKey]) {
        workingHours[dayKey] = {
          open: raw.workingHours[dayKey].open || '',
          close: raw.workingHours[dayKey].close || '',
          isOff: raw.workingHours[dayKey].isOff ?? true, 
        };
      } else {
        // Default to closed if day is explicitly missing from a provided workingHours object
        workingHours[dayKey] = { open: '', close: '', isOff: true };
      }
    });
  } else {
    // Default working hours if raw.workingHours is not provided or not an object
    daysOrder.forEach(dayKey => {
      if (dayKey === 'saturday' || dayKey === 'sunday') {
        workingHours[dayKey] = { open: '', close: '', isOff: true };
      } else if (dayKey === 'saturday') { // This condition was previously unreachable
         workingHours[dayKey] = { open: '10:00', close: '14:00', isOff: false };
      }
      else {
        workingHours[dayKey] = { open: '09:00', close: '18:00', isOff: false };
      }
       // Ensure Saturday has specific default if needed, and Sunday defaults to closed
       if (dayKey === 'saturday' && !raw.workingHours?.[dayKey]) workingHours[dayKey] = { open: '10:00', close: '14:00', isOff: false };
       if (dayKey === 'sunday' && !raw.workingHours?.[dayKey]) workingHours[dayKey] = { open: '', close: '', isOff: true };
    });
  }

  let mappedLocation: { lat: number; lng: number } | undefined = undefined;
  if (raw.location && typeof raw.location.lat === 'number' && typeof raw.location.lng === 'number') {
     mappedLocation = { lat: raw.location.lat, lng: raw.location.lng };
  }

  return {
    id: id || raw.id,
    name: raw.name || 'Неизвестен салон',
    description: raw.description || '',
    ownerId: raw.ownerId || '',
    address: raw.address || '',
    city: raw.city || '',
    region: raw.region || '',
    neighborhood: raw.neighborhood || '',
    street: raw.street || '',
    streetNumber: raw.streetNumber || '',
    priceRange: raw.priceRange || 'moderate',
    phoneNumber: raw.phoneNumber || raw.phone || '',
    email: raw.email || '',
    website: raw.website || '',
    services: services,
    photos: Array.isArray(raw.photos) ? raw.photos : [],
    heroImage: raw.heroImage || '',
    location: mappedLocation,
    rating: typeof raw.rating === 'number' ? raw.rating : 0,
    reviewCount: typeof raw.reviewCount === 'number' ? raw.reviewCount : 0,
    createdAt: timestampToISOString(raw.createdAt),
    lastUpdatedAt: raw.lastUpdatedAt ? timestampToISOString(raw.lastUpdatedAt) : undefined,
    availability: raw.availability || {},
    workingHours: workingHours,
    promotion: raw.promotion ? {
        isActive: raw.promotion.isActive,
        packageId: raw.promotion.packageId,
        packageName: raw.promotion.packageName,
        purchasedAt: timestampToISOString(raw.promotion.purchasedAt) || '',
        expiresAt: timestampToISOString(raw.promotion.expiresAt) || '',
        paymentMethod: raw.promotion.paymentMethod,
        transactionId: raw.promotion.transactionId
    } : undefined,
    atmosphereForAi: raw.atmosphereForAi || '',
    targetCustomerForAi: raw.targetCustomerForAi || '',
    uniqueSellingPointsForAi: raw.uniqueSellingPointsForAi || '',
    status: raw.status || 'approved', // Ensure status is included
    workingMethod: raw.workingMethod || 'walk_in',
  };
}

// -------------------- Notification --------------------
export function mapNotification(raw: any, id?: string): Notification {
  return {
    id: id || raw.id,
    userId: raw.userId,
    message: raw.message || '',
    type: raw.type || 'info',
    read: raw.read ?? false,
    createdAt: timestampToISOString(raw.createdAt),
    link: raw.link,
    relatedEntityId: raw.relatedEntityId,
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
