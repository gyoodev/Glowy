
export interface Service {
  id: string;
  name: string;
  description?: string;
  category: string;
  duration: number;
  price: number;
  categoryIcon?: React.ElementType;
}
