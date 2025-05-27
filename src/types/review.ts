import { Timestamp } from 'firebase/firestore';

export interface Review {
  id: string;
  userId: string;
  salonId: string;
  rating: number;
  comment: string;
  reply: string;
  date: Timestamp;
  reviewedBy: string;
}