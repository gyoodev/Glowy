
export interface Service {
  id: string;
  name: string;
  description?: string; // Made optional as per ServiceListItem
  category?: string; // Added category field
  duration: number;
  price: number;
  categoryIcon?: React.ElementType; // Keep if used for icons elsewhere
}
