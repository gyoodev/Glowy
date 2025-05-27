
export interface Review {
  id: string;
  userId: string;
  salonId: string;
  rating: number;
  comment: string;
  date: string; // Changed from Timestamp
  userName: string; // Added based on ReviewCard usage
  userAvatar?: string; // Added based on ReviewCard usage
  reply?: string;
  reviewedBy?: string; // This field's purpose might need clarification
}
