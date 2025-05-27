import { Timestamp } from 'firebase/firestore';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: Timestamp;
}