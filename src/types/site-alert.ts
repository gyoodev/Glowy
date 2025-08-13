import type { Timestamp } from 'firebase/firestore';

export type SiteAlertType = 'important' | 'info' | 'success';

export interface SiteAlert {
  id: string;
  message: string;
  type: SiteAlertType;
  isActive: boolean;
  createdAt: string; // Storing as ISO string on the client
}
