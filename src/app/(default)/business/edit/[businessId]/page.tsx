
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import type { Salon } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { ImagePlus, Trash2, Edit, CalendarDays, Clock, PlusCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, parse } from 'date-fns';
import { bg } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function EditBusinessPage() {
  const router = useRouter();
  const params = useParams();
  const businessId = params.businessId as string;
  const authInstance = getAuth();
  const firestore = getFirestore();
  const { toast } = useToast();

  const [business, setBusiness] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Salon> & { newHeroImageUrl?: string, newGalleryPhotoUrl?: string }>({
    name: '',
    description: '',
    address: '',
    city: '',
    priceRange: 'moderate',
    phone: '',
    email: '',
    website: '',
    workingHours: '',
    heroImage: '',
    photos: [],
    newHeroImageUrl: '',
    newGalleryPhotoUrl: '',
    availability: {}, // Added for availability
  });

  // State for availability management UI
  const [selectedAvailabilityDate, setSelectedAvailabilityDate] = useState<Date | undefined>(undefined);
  const [newTimeForSelectedDate, setNewTimeForSelectedDate] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      if (!user) {
        router.push('/login');
      } else {
        fetchBusiness(user.uid);
      }
    });
    return () => unsubscribe();
  }, [businessId, router, authInstance]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBusiness = async (userId: string) => {
    if (!businessId) {
      setLoading(false);
      toast({ title: 'Грешка', description: 'Липсва ID на бизнеса.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const businessRef = doc(firestore, 'salons', businessId);
      const docSnap = await getDoc(businessRef);
      if (docSnap.exists()) {
        const businessData = { id: docSnap.id, ...docSnap.data() } as Salon;
        if (businessData.ownerId !== userId) {
          toast({ title: 'Неоторизиран достъп', description: 'Нямате права да редактирате този бизнес.', variant: 'destructive' });
          router.push('/business/manage');
          return;
        }
        setBusiness(businessData);
        setFormData({
            name: businessData.name,
            description: businessData.description,
            address: businessData.address || '',
            city: businessData.city || '',
            priceRange: businessData.priceRange,
            phone: businessData.phone || '',
            email: businessData.email || '',
            website: businessData.website || '',
            workingHours: businessData.workingHours || '',
            heroImage: businessData.heroImage || '',
            photos: businessData.photos || [],
            newHeroImageUrl: businessData.heroImage || '', 
            newGalleryPhotoUrl: '',
            availability: businessData.availability || {}, // Initialize availability
        });
      } else {
        toast({ title: 'Не е намерен', description: 'Бизнесът не е намерен.', variant: 'destructive' });
        router.push('/business/manage');
      }
    } catch (error) {
      console.error('Error fetching business:', error);
      toast({ title: 'Грешка', description: 'Неуспешно извличане на данни за бизнеса.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };
  
  const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({...prev, newHeroImageUrl: e.target.value }));
  };

  const handleAddGalleryPhotoUrl = () => {
    if (formData.newGalleryPhotoUrl && formData.newGalleryPhotoUrl.trim() !== '') {
      const newUrl = formData.newGalleryPhotoUrl.trim();
      if (!(formData.photos || []).includes(newUrl)) {
        setFormData(prev => ({
          ...prev,
          photos: [...(prev.photos || []), newUrl],
          newGalleryPhotoUrl: '' 
        }));
      } else {
        toast({ title: 'Дублиран URL', description: 'Този URL вече е добавен в галерията.', variant: 'default' });
        setFormData(prev => ({...prev, newGalleryPhotoUrl: ''}));
      }
    } else {
      toast({ title: 'Грешка', description: 'Моля, въведете валиден URL на снимка.', variant: 'destructive' });
    }
  };

  const removeGalleryPhoto = (photoUrlToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      photos: (prev.photos || []).filter(url => url !== photoUrlToRemove)
    }));
  };

  // --- Availability Management Handlers ---
  const handleAvailabilityDateSelect = (date: Date | undefined) => {
    setSelectedAvailabilityDate(date);
    setNewTimeForSelectedDate(''); // Reset time input when date changes
  };

  const handleAddTimeSlot = () => {
    if (!selectedAvailabilityDate) {
      toast({ title: 'Грешка', description: 'Моля, първо изберете дата.', variant: 'destructive'});
      return;
    }
    if (!newTimeForSelectedDate.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) {
      toast({ title: 'Невалиден формат', description: 'Моля, въведете час във формат HH:MM (напр. 09:30).', variant: 'destructive'});
      return;
    }

    const dateKey = format(selectedAvailabilityDate, 'yyyy-MM-dd');
    setFormData(prev => {
      const currentTimes = prev.availability?.[dateKey] || [];
      if (currentTimes.includes(newTimeForSelectedDate)) {
        toast({ title: 'Дублиран час', description: 'Този час вече е добавен за избраната дата.', variant: 'default'});
        return prev;
      }
      const updatedTimes = [...currentTimes, newTimeForSelectedDate].sort();
      return {
        ...prev,
        availability: {
          ...prev.availability,
          [dateKey]: updatedTimes,
        }
      };
    });
    setNewTimeForSelectedDate('');
  };

  const handleRemoveTimeSlot = (dateKey: string, timeToRemove: string) => {
    setFormData(prev => {
      const currentTimes = prev.availability?.[dateKey] || [];
      const updatedTimes = currentTimes.filter(time => time !== timeToRemove);
      const newAvailability = { ...prev.availability };
      if (updatedTimes.length === 0) {
        delete newAvailability[dateKey]; // Remove date key if no times left
      } else {
        newAvailability[dateKey] = updatedTimes;
      }
      return {
        ...prev,
        availability: newAvailability,
      };
    });
  };
  
  const handleRemoveAllTimesForDate = (dateKey: string) => {
    setFormData(prev => {
        const newAvailability = { ...prev.availability };
        delete newAvailability[dateKey];
        return {
            ...prev,
            availability: newAvailability,
        };
    });
    if (selectedAvailabilityDate && format(selectedAvailabilityDate, 'yyyy-MM-dd') === dateKey) {
        // If the currently selected date's availability was cleared, reflect this in UI potentially
    }
    toast({ title: 'Часовете са премахнати', description: `Всички часове за ${format(parse(dateKey, 'yyyy-MM-dd', new Date()), "PPP", { locale: bg })} са премахнати.`, variant: 'default'});
  };
  // --- End Availability Management Handlers ---


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!businessId || !business) return;
    setSaving(true);

    const dataToUpdate: Partial<Salon> = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        priceRange: formData.priceRange,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        workingHours: formData.workingHours,
        heroImage: formData.newHeroImageUrl?.trim() || '',
        photos: formData.photos || [],
        availability: formData.availability || {}, // Save availability
    };

    try {
      const businessRef = doc(firestore, 'salons', businessId);
      await updateDoc(businessRef, dataToUpdate as any); 
      toast({ title: 'Успех', description: 'Бизнесът е актуализиран успешно.' });
      router.push('/business/manage');
    } catch (error: any) {
      console.error('Error updating business:', error);
      toast({ title: 'Грешка', description: error.message || 'Неуспешно актуализиране на данни за бизнеса.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-6">
        <Skeleton className="h-10 w-1/4 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </CardHeader>
          <CardContent className="grid gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-40 w-full mt-4" />
            <Skeleton className="h-40 w-full mt-4" />
            <Skeleton className="h-64 w-full mt-4" /> {/* Skeleton for availability */}
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!business) return null;

  const today = new Date();
  today.setHours(0,0,0,0);

  const availableDaysModifier = {
    available: Object.keys(formData.availability || {}).filter(dateKey => (formData.availability?.[dateKey]?.length || 0) > 0).map(dateKey => parse(dateKey, 'yyyy-MM-dd', new Date()))
  };


  return (
    <div className="container mx-auto py-10 px-6">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center">
            <Edit className="mr-3 h-8 w-8 text-primary" />
            Редактирай Салон: {business.name}
          </CardTitle>
          <CardDescription>Актуализирайте информацията, снимките, услугите и наличността за Вашия салон.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8">
            {/* General Info Section */}
            <section>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2">Основна Информация</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Име на Салона</Label>
                  <Input id="name" value={formData.name || ''} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Адрес</Label>
                  <Input id="address" value={formData.address || ''} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="city">Град</Label>
                  <Input id="city" value={formData.city || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input id="phone" value={formData.phone || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Имейл</Label>
                  <Input id="email" type="email" value={formData.email || ''} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="website">Уебсайт</Label>
                  <Input id="website" value={formData.website || ''} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="workingHours">Работно време</Label>
                  <Input id="workingHours" value={formData.workingHours || ''} onChange={handleInputChange} placeholder="напр. Пон - Пет: 09:00 - 18:00"/>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea id="description" value={formData.description || ''} onChange={handleInputChange} required rows={5} />
                </div>
              </div>
            </section>

            {/* Hero Image Section */}
            <section>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2">Главна Снимка (URL)</h3>
              <div className="space-y-2">
                <Label htmlFor="newHeroImageUrl">URL на главна снимка</Label>
                <Input id="newHeroImageUrl" type="text" placeholder="https://example.com/hero-image.jpg" value={formData.newHeroImageUrl || ''} onChange={handleHeroImageChange} />
                {formData.newHeroImageUrl && formData.newHeroImageUrl.trim() !== '' && (
                  <div className="mt-2 relative w-full h-64 rounded-md overflow-hidden border group">
                    <Image src={formData.newHeroImageUrl} alt="Преглед на главна снимка" layout="fill" objectFit="cover" data-ai-hint="salon hero image" />
                     <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={() => setFormData(prev => ({...prev, newHeroImageUrl: ''}))}
                        title="Изчисти URL на главната снимка"
                      >
                        <Trash2 size={16} />
                      </Button>
                  </div>
                )}
              </div>
            </section>

            {/* Gallery Section */}
            <section>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2">Фото Галерия (URL адреси)</h3>
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                    <div className="flex-grow space-y-1">
                        <Label htmlFor="newGalleryPhotoUrl">URL на нова снимка за галерията</Label>
                        <Input 
                            id="newGalleryPhotoUrl" 
                            type="text" 
                            placeholder="https://example.com/gallery-image.jpg" 
                            value={formData.newGalleryPhotoUrl || ''} 
                            onChange={(e) => setFormData(prev => ({...prev, newGalleryPhotoUrl: e.target.value}))} 
                        />
                    </div>
                    <Button type="button" variant="outline" onClick={handleAddGalleryPhotoUrl} className="whitespace-nowrap">
                        <ImagePlus size={18} className="mr-2"/> Добави URL
                    </Button>
                </div>

                {(formData.photos && formData.photos.length > 0) ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {formData.photos.map((photoUrl, index) => (
                      <div key={`gallery-${index}-${photoUrl}`} className="relative group aspect-square">
                        <Image src={photoUrl} alt={`Снимка от галерия ${index + 1}`} layout="fill" objectFit="cover" className="rounded-md border" data-ai-hint="salon interior detail" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          onClick={() => removeGalleryPhoto(photoUrl)}
                          title="Премахни тази снимка"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">Галерията е празна. Добавете URL адреси на снимки.</p>
                )}
              </div>
            </section>
            
            {/* Availability Management Section */}
            <section>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2 flex items-center">
                <CalendarDays className="mr-2 h-5 w-5 text-primary" />
                Управление на наличността
              </h3>
              <div className="grid md:grid-cols-2 gap-6 items-start">
                <div>
                  <Label className="block mb-2 font-medium">Изберете дата от календара:</Label>
                  <Calendar
                    mode="single"
                    selected={selectedAvailabilityDate}
                    onSelect={handleAvailabilityDateSelect}
                    disabled={(date) => date < today}
                    className="rounded-md border shadow-sm p-0"
                    modifiers={availableDaysModifier}
                    modifiersStyles={{
                        available: { fontWeight: 'bold', border: "2px solid hsl(var(--primary))", borderRadius: 'var(--radius)' }
                    }}
                    locale={{
                      localize: {
                        month: n => ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'][n],
                        day: n => ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][n]
                      },
                      formatLong: { date: () => 'dd/MM/yyyy' }
                    } as any}
                  />
                </div>

                {selectedAvailabilityDate && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="newTimeSlot" className="font-medium">
                        Часове за: <span className="font-bold text-primary">{format(selectedAvailabilityDate, "PPP", { locale: bg })}</span>
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          id="newTimeSlot"
                          type="text"
                          placeholder="HH:MM (напр. 09:30)"
                          value={newTimeForSelectedDate}
                          onChange={(e) => setNewTimeForSelectedDate(e.target.value)}
                          className="flex-grow"
                        />
                        <Button type="button" onClick={handleAddTimeSlot} size="sm">
                          <PlusCircle size={16} className="mr-1" /> Добави
                        </Button>
                      </div>
                    </div>

                    {(formData.availability?.[format(selectedAvailabilityDate, 'yyyy-MM-dd')]?.length || 0) > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Записани часове:</h4>
                        <div className="flex flex-wrap gap-2">
                          {formData.availability?.[format(selectedAvailabilityDate, 'yyyy-MM-dd')]?.map(time => (
                            <Badge key={time} variant="secondary" className="text-base py-1 px-2">
                              {time}
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="ml-1.5 h-4 w-4 p-0 hover:bg-destructive/20"
                                onClick={() => handleRemoveTimeSlot(format(selectedAvailabilityDate, 'yyyy-MM-dd'), time)}
                              >
                                <Trash2 size={12} className="text-destructive" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                         <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm" 
                            className="mt-2 w-full"
                            onClick={() => handleRemoveAllTimesForDate(format(selectedAvailabilityDate, 'yyyy-MM-dd'))}
                          >
                            <Trash2 size={16} className="mr-1" /> Премахни всички часове за тази дата
                          </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">Няма добавени часове за тази дата.</p>
                    )}
                  </div>
                )}
                {!selectedAvailabilityDate && (
                    <div className="md:col-span-1 flex items-center justify-center text-muted-foreground h-full">
                        <p>Изберете дата от календара, за да управлявате свободните часове.</p>
                    </div>
                )}
              </div>
            </section>

          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full md:w-auto text-lg py-3" disabled={saving || loading}>
              {saving ? 'Запазване...' : 'Запази Промените'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

