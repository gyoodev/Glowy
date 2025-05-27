
import type { Service } from './service';

export interface Booking {
  id: string;
  userId: string;
  salonId: string;
  serviceId: string;
  startTime: string; // Changed from Timestamp
  endTime: string;   // Changed from Timestamp
  salonName: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  clientName: string;
  clientEmail: string;
  clientPhoneNumber: string;
  createdAt: string; // Changed from Timestamp
  salonAddress?: string;
  salonPhoneNumber?: string;
  salonOwnerId?: string;
  service?: Service; // Made optional as it might not always be populated from booking doc
}
