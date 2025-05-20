import type { Service } from '@/types';
import { Button } from '@/components/ui/button';
import { Tag } from 'lucide-react';

interface ServiceListItemProps {
  service: Service;
  onBook: (serviceId: string) => void;
}

export function ServiceListItem({ service, onBook }: ServiceListItemProps) {
  const IconComponent = service.categoryIcon || Tag;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b last:border-b-0 hover:bg-secondary/50 transition-colors duration-200 rounded-md">
      <div className="flex-grow mb-4 sm:mb-0">
        <div className="flex items-center mb-1">
          <IconComponent className="h-5 w-5 mr-2 text-primary" />
          <h4 className="text-lg font-semibold text-foreground">{service.name}</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-1 sm:pl-7">{service.description}</p>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground sm:pl-7">
          <span>{service.price.toFixed(2)} лв.</span>
          <span>{service.duration} мин.</span>
        </div>
      </div>
      <Button onClick={() => onBook(service.id)} size="sm" className="mt-2 sm:mt-0 self-start sm:self-center">
        Резервирай
      </Button>
    </div>
  );
}
