
export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'new_booking_business'
  | 'booking_status_change_customer'
  | 'new_review_business'
  | 'new_payment_admin'
  | 'welcome_user'
  | 'new_user_admin'       // For admin when a new user registers
  | 'new_salon_admin';     // For admin when a new salon is created

export interface Notification {
  id: string;
  userId: string;
  message: string; // Title was removed previously
  type: NotificationType;
  read: boolean;
  createdAt: string; // Changed from Timestamp
  link?: string;
  relatedEntityId?: string; // e.g., bookingId, reviewId, userId, salonId
}
