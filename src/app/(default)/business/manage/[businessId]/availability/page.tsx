
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { Salon } from '@/types';
import { auth, firestore } from '@/lib/firebase';
import { mapSalon } from '@/utils/mappers';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowLeft, CalendarPlus, Clock, Loader2, Trash2 } from 'lucide-react';
import { format, parse } from 'date-fns';
import { bg } from 'date-fns/locale';

// Generate predefined time slots for quick adding
const predefinedTimeSlots = Array.from({ length: 22 }, (_, i) => { // 08:00 to 18:30
  const hour = Math.floor(i / 2) + 8;
  const minute = (i % 2) * 30;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

export default function AvailabilityManagementPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const businessId = params?.businessId as string;

  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [manualTime, setManualTime] = useState('');

  const fetchSalonData = useCallback(async () => {
    if (!businessId) {
      setError('Невалиден ID на бизнес.');
      setIsLoading(false);
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      const salonRef = doc(firestore, 'salons', businessId);
      const salonSnap = await getDoc(salonRef);
      if (!salonSnap.exists() || salonSnap.data().ownerId !== user.uid) {
        setError('Салонът не е намерен или нямате права за достъп.');
        setSalon(null);
        return;
      }
      const salonData = mapSalon(salonSnap.data(), salonSnap.id);
      setSalon(salonData);
      setAvailability(salonData.availability || {});
    } catch (err) {
      console.error("Error fetching salon data:", err);
      setError('Възникна грешка при зареждане на данните за салона.');
    } finally {
      setIsLoading(false);
    }
  }, [businessId, router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchSalonData();
      else router.push('/login');
    });
    return () => unsubscribe();
  }, [fetchSalonData, router]);

  const handleAddTimeSlot = useCallback((time: string) => {
    if (!selectedDate || !time.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
        toast({ title: "Грешен формат", description: "Моля, въведете час във формат HH:mm.", variant: "destructive" });
        return;
    }
    
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    setAvailability(prev => {
      const currentSlots = prev[dateKey] || [];
      if (currentSlots.includes(time)) {
        toast({ title: "Дублиран час", description: `Часът ${time} вече съществува за тази дата.` });
        return prev;
      }
      const updatedSlots = [...currentSlots, time].sort();
      return { ...prev, [dateKey]: updatedSlots };
    });
    setManualTime(''); // Clear manual input after adding
  }, [selectedDate, toast]);

  const handleRemoveTimeSlot = useCallback((time: string) => {
    if (!selectedDate) return;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    setAvailability(prev => {
      const updatedSlots = (prev[dateKey] || []).filter(slot => slot !== time);
      return { ...prev, [dateKey]: updatedSlots };
    });
  }, [selectedDate]);

  const handleSaveChanges = async () => {
    if (!salon) return;
    setIsSaving(true);
    try {
      const salonRef = doc(firestore, 'salons', salon.id);
      await updateDoc(salonRef, { availability });
      toast({ title: 'Успех!', description: 'Промените в наличността бяха запазени.' });
    } catch (err) {
      console.error("Error saving availability:", err);
      toast({ title: 'Грешка', description: 'Неуспешно запазване на промените.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const slotsForSelectedDate = availability[selectedDateKey] || [];

  if (isLoading) {
    return <div className="container mx-auto py-10"><Skeleton className="h-96 w-full" /></div>;
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Грешка</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button asChild variant="outline"><Link href="/business/manage"><ArrowLeft className="mr-2 h-4 w-4" />Назад</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" size="sm" asChild className="mb-4">
        <Link href="/business/manage"><ArrowLeft className="mr-2 h-4 w-4" />Назад към управление</Link>
      </Button>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Управление на наличност</h1>
        <p className="text-muted-foreground">Календар на наличността за салон "{salon?.name}".</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Изберете дата</CardTitle></CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="p-0"
              disabled={{ before: new Date() }}
              modifiers={{ available: (date) => availability[format(date, 'yyyy-MM-dd')]?.length > 0 }}
              modifiersStyles={{ available: { fontWeight: 'bold', color: 'hsl(var(--primary))' } }}
              locale={bg}
            />
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Часове за: {selectedDate ? format(selectedDate, 'PPP', { locale: bg }) : 'Изберете дата'}</CardTitle>
              <CardDescription>Преглед и управление на свободните часове за избрания ден.</CardDescription>
            </CardHeader>
            <CardContent>
              {slotsForSelectedDate.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {slotsForSelectedDate.map(time => (
                    <div key={time} className="flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                      <span className="font-mono text-sm">{time}</span>
                      <button onClick={() => handleRemoveTimeSlot(time)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Няма добавени свободни часове за тази дата.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center"><CalendarPlus className="mr-2 h-5 w-5"/>Добавяне на часове</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="manualTime" className="text-sm font-medium">Ръчно добавяне</label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="manualTime"
                    type="time"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="font-mono"
                  />
                  <Button onClick={() => handleAddTimeSlot(manualTime)} disabled={!manualTime}>Добави</Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Бързо добавяне (на всеки 30 мин)</label>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 mt-2">
                  {predefinedTimeSlots.map(time => (
                    <Button
                      key={time}
                      variant="outline"
                      size="sm"
                      className="font-mono"
                      onClick={() => handleAddTimeSlot(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
             <CardFooter>
                <Button onClick={handleSaveChanges} disabled={isSaving} className="w-full sm:w-auto">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
                    {isSaving ? 'Запазване...' : 'Запази промените в наличността'}
                </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
