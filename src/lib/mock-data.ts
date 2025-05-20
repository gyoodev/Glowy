import type { Salon, Service, Review, UserProfile, Booking } from '@/types';
import { Scissors, Brush, Palette, Sparkles, Droplets, Sun } from 'lucide-react';

export const mockServices: Service[] = [
  { id: 's1', name: 'Women\'s Haircut', description: 'Shampoo, cut, and style for women.', price: 60, duration: 60, categoryIcon: Scissors },
  { id: 's2', name: 'Men\'s Haircut', description: 'Classic men\'s cut and style.', price: 40, duration: 45, categoryIcon: Scissors },
  { id: 's3', name: 'Full Color', description: 'Single process all-over color.', price: 120, duration: 120, categoryIcon: Palette },
  { id: 's4', name: 'Highlights', description: 'Partial or full highlights.', price: 150, duration: 180, categoryIcon: Sparkles },
  { id: 's5', name: 'Manicure', description: 'Classic manicure with polish.', price: 35, duration: 45, categoryIcon: Brush },
  { id: 's6', name: 'Pedicure', description: 'Relaxing pedicure with massage and polish.', price: 50, duration: 60, categoryIcon: Droplets },
  { id: 's7', name: 'Facial', description: 'Deep cleansing and revitalizing facial.', price: 90, duration: 75, categoryIcon: Sun },
];

export const mockReviews: Review[] = [
  { id: 'r1', userName: 'Alice Wonderland', rating: 5, comment: 'Absolutely loved my haircut! The stylist was amazing.', date: '2024-05-10T10:00:00Z', userAvatar: 'https://placehold.co/40x40.png' },
  { id: 'r2', userName: 'Bob The Builder', rating: 4, comment: 'Great service and friendly staff. My color turned out perfect.', date: '2024-05-12T14:30:00Z', userAvatar: 'https://placehold.co/40x40.png' },
  { id: 'r3', userName: 'Charlie Brown', rating: 5, comment: 'Best facial I\'ve ever had. So relaxing!', date: '2024-05-15T11:00:00Z' },
];

export const mockSalons: Salon[] = [
  {
    id: 'salon1',
    name: 'Glamour & Glow Studio',
    description: 'Experience luxury and transformation at Glamour & Glow Studio. We offer a wide range of beauty services to make you look and feel your best. Our expert stylists are dedicated to providing personalized care in a chic and relaxing atmosphere.',
    address: '123 Beauty Ave, Glam City, GC 12345',
    city: 'Glam City',
    rating: 4.8,
    priceRange: 'moderate',
    photos: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
    ],
    services: [mockServices[0], mockServices[2], mockServices[4], mockServices[6]],
    reviews: mockReviews.slice(0, 2),
    heroImage: 'https://placehold.co/1200x400.png',
    availability: {
      [(new Date(Date.now() + 86400000 * 1)).toISOString().split('T')[0]]: ['09:00', '10:00', '14:00', '15:00'],
      [(new Date(Date.now() + 86400000 * 2)).toISOString().split('T')[0]]: ['09:30', '11:00', '13:00', '16:00'],
      [(new Date(Date.now() + 86400000 * 3)).toISOString().split('T')[0]]: ['10:00', '12:00', '15:30'],
    }
  },
  {
    id: 'salon2',
    name: 'The Cutting Edge',
    description: 'Modern styles and classic cuts at The Cutting Edge. We specialize in hair transformations and precision styling. Our salon provides a vibrant and friendly environment for all your hair care needs.',
    address: '456 Style St, Trendytown, TT 67890',
    city: 'Trendytown',
    rating: 4.5,
    priceRange: 'cheap',
    photos: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
    ],
    services: [mockServices[1], mockServices[3]],
    reviews: [mockReviews[2]],
    heroImage: 'https://placehold.co/1200x400.png',
     availability: {
      [(new Date(Date.now() + 86400000 * 1)).toISOString().split('T')[0]]: ['10:00', '11:00', '13:00', '14:00'],
      [(new Date(Date.now() + 86400000 * 2)).toISOString().split('T')[0]]: ['10:30', '12:00', '15:00'],
    }
  },
  {
    id: 'salon3',
    name: 'Serene Spa & Salon',
    description: 'Indulge in tranquility at Serene Spa & Salon. We offer a holistic approach to beauty and wellness, from rejuvenating facials to luxurious manicures and pedicures. Escape the everyday and find your serenity with us.',
    address: '789 Relax Rd, Peaceful Valley, PV 10112',
    city: 'Peaceful Valley',
    rating: 4.9,
    priceRange: 'expensive',
    photos: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
    ],
    services: [mockServices[4], mockServices[5], mockServices[6]],
    reviews: mockReviews,
    heroImage: 'https://placehold.co/1200x400.png',
    availability: {
      [(new Date(Date.now() + 86400000 * 1)).toISOString().split('T')[0]]: ['11:00', '14:30'],
      [(new Date(Date.now() + 86400000 * 3)).toISOString().split('T')[0]]: ['10:00', '11:30', '13:30', '16:30'],
    }
  },
];

export const mockUserProfile: UserProfile = {
  id: 'user1',
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  profilePhotoUrl: 'https://placehold.co/100x100.png',
  preferences: {
    favoriteServices: ['Women\'s Haircut', 'Facial'],
    priceRange: 'moderate',
    preferredLocations: ['Glam City', 'Trendytown'],
  },
};

export const mockBookings: Booking[] = [
  { id: 'b1', salonId: 'salon1', salonName: 'Glamour & Glow Studio', serviceId: 's1', serviceName: 'Women\'s Haircut', date: '2024-04-20T00:00:00Z', time: '10:00', status: 'completed' },
  { id: 'b2', salonId: 'salon3', salonName: 'Serene Spa & Salon', serviceId: 's7', serviceName: 'Facial', date: '2024-05-05T00:00:00Z', time: '15:00', status: 'completed' },
  { id: 'b3', salonId: 'salon1', salonName: 'Glamour & Glow Studio', serviceId: 's5', serviceName: 'Manicure', date: (new Date(Date.now() + 86400000 * 5)).toISOString().split('T')[0], time: '11:00', status: 'confirmed' },
];

export const getSalonById = (id: string): Salon | undefined => mockSalons.find(salon => salon.id === id);
