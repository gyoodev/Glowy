import type { Booking } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, Scissors, MapPin } from 'lucide-react'; // Assuming Scissors for generic service
import { format } from 'date-fns';
import { bg } from 'date-fns/locale'; // Import Bulgarian locale

interface BookingHistoryItemProps {
  booking: Booking;
}

// Define Bulgarian translations for statuses
const statusTranslations: Record<Booking['status'], string> = {
  confirmed: 'потвърдена',
  pending: 'чакаща',
  cancelled: 'отказана',
  completed: 'завършена',
};


export function BookingHistoryItem({ booking }: BookingHistoryItemProps) {
  const getStatusVariant = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'completed': return 'secondary';
      case 'pending': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };
  
  const translatedStatus = statusTranslations[booking.status] || booking.status;


  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <CardTitle className="text-lg font-semibold mb-1 sm:mb-0">{booking.serviceName}</CardTitle>
          <Badge variant={getStatusVariant(booking.status)} className="capitalize self-start sm:self-center">{translatedStatus}</Badge>
        </div>
        <CardDescription className="flex items-center text-sm">
            <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /> {booking.salonName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center text-muted-foreground">
          <CalendarDays className="h-4 w-4 mr-2 text-primary" />
          <span>{format(new Date(booking.date), 'MMMM dd, yyyy', { locale: bg })}</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <Clock className="h-4 w-4 mr-2 text-primary" />
          <span>{booking.time}</span>
        </div>
      </CardContent>
    </Card>
  );
}
