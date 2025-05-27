import { Timestamp } from 'firebase/firestore';
import { Service } from './service';

export interface Booking {
  id: string;
  userId: string;
  salonId: string;
  serviceId: string;
  startTime: Timestamp;
  endTime: Timestamp;
  salonName: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  clientName: string;
  clientEmail: string;
  clientPhoneNumber: string;
  createdAt: Timestamp;
  salonAddress: string;
  salonPhoneNumber: string;
  salonOwnerId: string;
  service: Service;
}