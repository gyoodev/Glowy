
import type { Service } from '@/types';
import { Button } from '@/components/ui/button';
import { Tag } from 'lucide-react'; // Using Tag as a default icon
import { formatPrice } from '@/lib/utils'; // Import the new formatter

interface ServiceListItemProps {
  service: Service;
  onBook?: (serviceId: string) => void;
  isBookingEnabled: boolean;
}

export function ServiceListItem({ service, onBook, isBookingEnabled }: ServiceListItemProps) {
  // Use service.categoryIcon if available, otherwise default to Tag
  const IconComponent = service.categoryIcon || Tag;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b last:border-b-0 hover:bg-secondary/50 transition-colors duration-200 rounded-md">
      <div className="flex-grow mb-4 sm:mb-0">
        <div className="flex items-center mb-1">
          <IconComponent className="h-5 w-5 mr-2 text-primary" />
          <h4 className="text-lg font-semibold text-foreground">{service.name}</h4>
        </div>
        {service.description && ( // Conditionally render description if it exists
          <p className="text-sm text-muted-foreground mb-1 sm:pl-7">{service.description}</p>
        )}
        <div className="flex items-center space-x-4 text-sm text-muted-foreground sm:pl-7">
          <span>{formatPrice(service.price)}</span>
          <span>{service.duration || 'N/A'} мин.</span>
        </div>
      </div>
      {isBookingEnabled && (
        <Button onClick={() => { if (onBook) { onBook(service.id); } }} size="sm" className="mt-2 sm:mt-0 self-start sm:self-center">
          Резервирай
        </Button>
      )}
    </div>
  );
}
