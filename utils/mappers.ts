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

function timestampToISOString(value: Timestamp | string | undefined): string {
  if (!value) return '';
  return typeof value === 'string' ? value : value.toDate().toISOString();
}

// -------------------- Booking --------------------
export function mapBooking(raw: any): Booking {
  return {
    id: raw.id,
    userId: raw.userId,
    salonId: raw.salonId,
    serviceId: raw.serviceId,
    startTime: timestampToISOString(raw.startTime),
    endTime: timestampToISOString(raw.endTime),
    salonName: raw.salonName || 'N/A',
    serviceName: raw.serviceName || 'N/A',
    date: raw.date || new Date().toISOString().split('T')[0],
    time: raw.time || 'N/A',
    status: raw.status as Booking['status'],
    clientName: raw.clientName || 'N/A',
    clientEmail: raw.clientEmail || 'N/A',
    clientPhoneNumber: raw.clientPhoneNumber || 'N/A',
    createdAt: timestampToISOString(raw.createdAt) || new Date().toISOString(),
    salonAddress: raw.salonAddress || 'N/A',
    salonPhoneNumber: raw.salonPhoneNumber || 'N/A',
    salonOwnerId: raw.salonOwnerId || 'N/A',
    service: raw.service as Service || {
      name: 'N/A',
      duration: 0,
      price: 0,
    },
  };
}

// -------------------- Review --------------------
export function mapReview(raw: any): Review {
  return {
    id: raw.id,
    userId: raw.userId,
    salonId: raw.salonId || 'N/A',
    rating: raw.rating ?? 0,
    comment: raw.comment || '',
    date: timestampToISOString(raw.date),
    reply: raw.reply || '',
    reviewedBy: raw.reviewedBy || '',
  };
}

// -------------------- UserProfile --------------------
export function mapUserProfile(raw: any, idOverride?: string): UserProfile {
  return {
    id: idOverride || raw.id || '',
    userId: raw.userId || '',
    name: raw.name || 'Потребител',
    email: raw.email || '',
    profilePhotoUrl: raw.profilePhotoUrl || '',
    role: raw.role || 'customer',
    preferences: raw.preferences || {
      favoriteServices: [],
      priceRange: '',
      preferredLocations: [],
    },
    createdAt: timestampToISOString(raw.createdAt),
  };
}

// -------------------- Salon --------------------
export function mapSalon(raw: any): Salon {
  return {
    id: raw.id,
    name: raw.name || 'Неизвестен салон',
    description: raw.description || '',
    ownerId: raw.ownerId || '',
    address: raw.address || '',
    phoneNumber: raw.phoneNumber || '',
    services: raw.services || [],
    createdAt: timestampToISOString(raw.createdAt),
    photos: raw.photos || [],
    rating: raw.rating ?? 0,
    location: raw.location || { lat: 0, lng: 0 },
  };
}

// -------------------- Notification --------------------
export function mapNotification(raw: any): Notification {
  return {
    id: raw.id,
    userId: raw.userId,
    title: raw.title || '',
    message: raw.message || '',
    type: raw.type || 'info',
    read: raw.read ?? false,
    createdAt: timestampToISOString(raw.createdAt),
  };
}

// -------------------- NewsletterSubscriber --------------------
export function mapNewsletterSubscriber(raw: any): NewsletterSubscriber {
  return {
    id: raw.id,
    email: raw.email || '',
    subscribedAt: timestampToISOString(raw.subscribedAt),
  };
}