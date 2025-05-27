import { Timestamp } from 'firebase/firestore';
import { Service } from './service';

export interface Salon {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  address: string;
  phoneNumber: string;
  services: Service[];
  photos: string[];
  location: { lat: number; lng: number };
  rating: number;
  createdAt: Timestamp;
}