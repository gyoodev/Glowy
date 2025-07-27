'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
// sendReviewReminderEmail is not used here anymore

export interface BookingCalendarProps {
  salonName: string;
  serviceName?: string;
  availability?: Record<string, string[]>; // Date string -> array of time slots "HH:mm"
  onDateChange: (date: Date) => void;
  onTimeSelect?: (date: Date | undefined, time: string | undefined) => void;
}

export default function BookingCalendar({ salonName, serviceName, availability = {}, onDateChange, onTimeSelect }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const { toast } = useToast(); // toast is not used in this component anymore

  const availableTimes = selectedDate ? availability[format(selectedDate, 'yyyy-MM-dd')] || [] : [];
  
  useEffect(() => {
    if (selectedDate) {
      onDateChange(selectedDate);
      setSelectedTime(undefined); // Reset time when date changes
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);


  const handleTimeSlotClick = (time: string) => {
    setSelectedTime(time);
    // Call the parent callback with the selected date and time
    if (onTimeSelect) {
      onTimeSelect(selectedDate, time);
      // The problematic toast that was here has been removed.
      // Email simulation logic is moved to the parent component after actual booking confirmation.
    }
  };
  
  const today = new Date();
  today.setHours(0,0,0,0);



  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Clock className="mr-2 h-5 w-5 text-primary" />
          Резервирайте час
          {serviceName && <span className="text-sm text-muted-foreground ml-2">за {serviceName}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-full md:w-auto">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border p-0"
            disabled={{ before: today }}
            modifiers={{
              available: (date) => (availability[format(date, 'yyyy-MM-dd')]?.length || 0) > 0,
            }}
            modifiersStyles={{
                available: { border: "2px solid hsl(var(--primary))", borderRadius: 'var(--radius)'}
            }}
            locale={{
                localize: {
                  month: (n: number) => ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'][n],
                  day: (n: number) => ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][n]
                },
                formatLong: {
                  date: () => 'dd/MM/yyyy'
                }
            } as any} // Type assertion to bypass strict locale type, assuming basic structure is compatible
          />
        </div>
        {selectedDate && (
          <div className="flex-grow w-full md:w-auto">
            <h4 className="text-md font-semibold mb-3 text-foreground">
              Свободни часове за {selectedDate.toLocaleDateString('bg-BG')}
            </h4>
            {availableTimes.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableTimes.map(time => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? 'default' : 'outline'}
                    onClick={() => handleTimeSlotClick(time)}
                    className="w-full"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Няма свободни часове за тази дата.</p>
            )}
            {/* The Book Now button here is redundant if the parent page handles confirmation */}
            {/* {selectedTime && (
              <div className="mt-4">
                <Button className="w-full">
                  Book Now
                </Button>
              </div>
            )} */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
