
import type { Timestamp } from 'firebase/firestore';

export interface SiteAlert {
  id: string;
  message: string;
  type: 'important' | 'message' | 'info';
  isActive: boolean;
  createdAt: Timestamp;
  expiresAt?: Timestamp | null;
}
