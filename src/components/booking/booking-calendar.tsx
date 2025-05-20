'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface BookingCalendarProps {
  salonName: string;
  serviceName?: string;
  availability?: Record<string, string[]>; // Date string -> array of time slots "HH:mm"
}

export function BookingCalendar({ salonName, serviceName, availability = {} }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setAvailableTimes(availability[dateString] || []);
      setSelectedTime(undefined); // Reset time when date changes
    } else {
      setAvailableTimes([]);
    }
  }, [selectedDate, availability]);

  const handleBookSlot = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Непълна селекция",
        description: "Моля, изберете дата и час.",
        variant: "destructive",
      });
      return;
    }
    
    const bookingDetails = `Резервацията е потвърдена за ${serviceName || 'услуга'} в ${salonName} на ${selectedDate.toLocaleDateString('bg-BG')} в ${selectedTime}.`;
    toast({
      title: "Резервацията е успешна!",
      description: bookingDetails,
    });
    // Here you would typically call an API to finalize the booking
    console.log(bookingDetails);
    setSelectedDate(undefined);
    setSelectedTime(undefined);
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
            disabled={(date) => date < today || !!availability[date.toISOString().split('T')[0]] && availability[date.toISOString().split('T')[0]].length === 0}
            modifiers={{
              available: (date) => !!availability[date.toISOString().split('T')[0]] && availability[date.toISOString().split('T')[0]].length > 0,
            }}
            modifiersStyles={{
                available: { border: "2px solid hsl(var(--primary))", borderRadius: 'var(--radius)'}
            }}
            locale={{
                localize: {
                  month: n => ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'][n],
                  day: n => ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][n]
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
                    onClick={() => setSelectedTime(time)}
                    className="w-full"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Няма свободни часове за тази дата.</p>
            )}
            {selectedTime && (
              <Button onClick={handleBookSlot} className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground">
                Потвърди резервация за {selectedTime}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
