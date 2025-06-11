
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
  | 'new_salon_admin'      // For admin when a new salon is created and needs approval
  | 'salon_approved'       // For business owner when salon is approved
  | 'salon_rejected'       // For business owner when salon is rejected
  | 'new_contact_admin'    // For admin when a new contact form is submitted
  // New Types:
  | 'booking_reminder_customer'
  | 'review_published_customer'
  | 'favorite_salon_update_customer'
  | 'password_reset_customer'
  | 'saved_service_alert_customer'
  | 'booking_cancelled_by_customer_business'
  | 'promotion_expiring_soon_business'
  | 'promotion_expired_business'
  | 'monthly_summary_business'
  | 'content_reported_admin'
  | 'payment_dispute_admin';

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

