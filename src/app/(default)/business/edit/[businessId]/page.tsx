
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image'; // Keep Image import
import { ImagePlus, Trash2, Edit, Clock, ChevronsUpDown, Check, FileText, Loader2 } from 'lucide-react'; // Remove CalendarDays, Briefcase, CalendarCheck
import { Calendar } from '@/components/ui/calendar';
import { format, parse } from 'date-fns';
import { bg } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { allBulgarianCities } from '@/lib/mock-data';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'; // Keep Popover imports
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'; // Keep Command imports
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { cn } from '@/lib/utils'; // Removed capitalizeFirstLetter as it's not used
import { zodResolver } from "@hookform/resolvers/zod"
import type { Salon, WorkingHoursStructure, Service } from '@/types';
import { z } from 'zod';
import { type Locale } from 'date-fns';
import { type SubmitHandler } from 'react-hook-form';
import { mapSalon } from '@/utils/mappers'; 
import { auth } from '@/lib/firebase';

// Keep predefinedTimeSlots as it might be used for working hours or future availability features not tied to a specific date picker

const predefinedTimeSlots = Array.from({ length: 20 }, (_, i) => { // From 08:00 to 17:30 in 30 min intervals
  const hour = Math.floor(i / 2) + 8;
  const minute = (i % 2) * 30;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

const generateFullDayTimeOptions = () => {
  const options = [];
  for (let i = 0; i < 48; i++) { // 24 hours * 2 slots per hour
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    options.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  }
  return options;
};
const fullDayTimeOptions = generateFullDayTimeOptions();

const daysOfWeek = [
  { key: 'monday', label: 'Понеделник' },
  { key: 'tuesday', label: 'Вторник' },
  { key: 'wednesday', label: 'Сряда' },
  { key: 'thursday', label: 'Четвъртък' },
  { key: 'friday', label: 'Петък' },
  { key: 'saturday', label: 'Събота' },
  { key: 'sunday', label: 'Неделя' },
];

const defaultWorkingHours: WorkingHoursStructure = daysOfWeek.reduce((acc, day) => {
  acc[day.key] = {
    open: day.key === 'sunday' ? '' : '09:00',
    close: day.key === 'sunday' ? '' : '18:00',
    isOff: day.key === 'sunday',
  };
  if (day.key === 'saturday') {
    acc[day.key] = { open: '10:00', close: '14:00', isOff: false };
  }
  return acc;
}, {} as WorkingHoursStructure);

const editBusinessSchema = z.object({
  name: z.string().min(1, 'Името на салона е задължително.'),
  description: z.string().min(1, 'Описанието е задължително.'),
  address: z.string().optional(),
  city: z.string().optional(),
  priceRange: z.enum(['cheap', 'moderate', 'expensive', '']).optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: "Невалиден имейл адрес." }).optional().or(z.literal('')),
  website: z.string().url({ message: "Невалиден URL адрес на уебсайт." }).optional().or(z.literal('')),
  workingMethod: z.enum(['appointment', 'walk_in']).optional(),
 workingHours: z.record(z.string(), z.object({
    open: z.string(),
    close: z.string(),
    isOff: z.boolean(),
  })).optional(),
  heroImage: z.string().optional(),
  photos: z.array(z.string()).optional(),
  newHeroImageUrl: z.string().url({ message: "Моля, въведете валиден URL." }).optional().or(z.literal('')),
  newGalleryPhotoUrl: z.string().url({ message: "Моля, въведете валиден URL." }).optional().or(z.literal('')),
  availability: z.record(z.string(), z.array(z.string())).optional(),
 services: z.array(z.any()).optional(), // Removed serviceSchema validation
});

type EditBusinessFormValues = z.infer<typeof editBusinessSchema>;


export default function EditBusinessPage() {
  const router = useRouter();
  const params = useParams();
  const firestore = getFirestore();
  const { toast } = useToast();

  const [business, setBusiness] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);

  const sortedBulgarianCities = useMemo(() => [...allBulgarianCities].sort((a, b) => a.localeCompare(b, 'bg')), []);

  const businessId = params?.businessId as string;
  const form = useForm<EditBusinessFormValues>({
    resolver: zodResolver(editBusinessSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      city: '',
      priceRange: 'moderate',
      phone: '',
      email: '',
      website: '',
 workingMode: 'appointment',
      workingHours: defaultWorkingHours as CorrectTypeForWorkingMode['workingHours'],
      heroImage: '',
      photos: [],
      newHeroImageUrl: '',
      newGalleryPhotoUrl: '',
      availability: {},
      services: [],
    },
  });


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
      } else {
        fetchBusinessData(user.uid);
      }
    });
    return () => unsubscribe();
 }, [businessId, router]);
  const fetchBusinessData = async (userId: string) => { 
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
        const businessData = mapSalon(docSnap.data(), docSnap.id);
        if (businessData.ownerId !== userId) {
          toast({ title: 'Неоторизиран достъп', description: 'Нямате права да редактирате този бизнес.', variant: 'destructive' });
          router.push('/business/manage');
          return;
        }
        setBusiness(businessData);

        let initialWorkingHours = { ...defaultWorkingHours };
        if (typeof businessData.workingHours === 'object' && businessData.workingHours !== null) {
          for (const dayKey of daysOfWeek.map(d => d.key)) {
            if (businessData.workingHours[dayKey]) {
              initialWorkingHours[dayKey] = { ...defaultWorkingHours[dayKey], ...businessData.workingHours[dayKey] };
            }
          }
        }

        form.reset({
            name: businessData.name,
            description: businessData.description,
            address: businessData.address || '',
            city: businessData.city || '',
            priceRange: businessData.priceRange || 'moderate',
            phone: businessData.phoneNumber || '',
            email: businessData.email || '',
            website: businessData.website || '',
            workingMode: businessData.workingMethod || 'appointment',
            workingHours: initialWorkingHours,
            heroImage: businessData.heroImage || '',
            photos: businessData.photos || [],
            newHeroImageUrl: businessData.heroImage || '',
            newGalleryPhotoUrl: '',
            availability: businessData.availability || {},
            services: businessData.services || [], // Keep services data without detailed mapping
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

  const handleAddGalleryPhotoUrl = () => {
    const newGalleryPhotoUrl = form.getValues('newGalleryPhotoUrl');
    if (newGalleryPhotoUrl && newGalleryPhotoUrl.trim() !== '') {
      const currentPhotos = form.getValues('photos') || [];
      if (!currentPhotos.includes(newGalleryPhotoUrl.trim())) {
        form.setValue('photos', [...currentPhotos, newGalleryPhotoUrl.trim()]);
        form.setValue('newGalleryPhotoUrl', '');
      } else {
        toast({ title: 'Дублиран URL', description: 'Този URL вече е добавен в галерията.', variant: 'default' });
        form.setValue('newGalleryPhotoUrl', '');
      }
    } else {
      toast({ title: 'Грешка', description: 'Моля, въведете валиден URL на снимка.', variant: 'destructive' });
    }
  };

  const removeGalleryPhoto = (photoUrlToRemove: string) => {
    const currentPhotos = form.getValues('photos') || [];
    form.setValue('photos', currentPhotos.filter(url => url !== photoUrlToRemove));
  };


  const onSubmit: SubmitHandler<EditBusinessFormValues> = async (data) => {
    if (!businessId || !business) return;
    setSaving(true);

    const dataToUpdate: Partial<Salon> = {
        name: data.name,
        description: data.description,
        address: data.address,
 city: data.city,
        priceRange: data.priceRange,
        phoneNumber: data.phone, 
        email: data.email,
        website: data.website,
 workingMode: data.workingMethod,
        workingHours: data.workingHours,
        heroImage: data.newHeroImageUrl?.trim() || data.heroImage || '',
        photos: data.photos || [],
        services: data.services?.map(s => ({
          id: s.id || `custom_service_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, // Ensure ID for new custom services
          name: s.name,
          description: s.description || '',
          price: Number(s.price),
          duration: Number(s.duration)
        })) || [],
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
            <Skeleton className="h-64 w-full mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!business) return null;
  const today = new Date();
  today.setHours(0,0,0,0);

  return (
    <>
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-4xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center">
            <Edit className="mr-3 h-8 w-8 text-primary" />
            Редактирай Салон: {form.watch('name') || business.name}
          </CardTitle>
          <CardDescription>Актуализирайте информацията, снимките, услугите и наличността за Вашия салон.</CardDescription>
 </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="details" className="w-full">
           <TabsList className="inline-flex h-auto w-full flex-wrap items-center justify-center rounded-lg bg-muted p-1.5 text-muted-foreground mb-6 gap-1.5">
              <TabsTrigger value="details" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-lg">
                  <FileText className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Детайли
              </TabsTrigger>
              <TabsTrigger value="workingHours" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-lg">
                  <Clock className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Работно Време
              </TabsTrigger>
            </TabsList>
            <CardContent className="space-y-8">
              <div className="flex-1 min-w-0">
                <TabsContent value="details" className="mt-0 space-y-8 bg-card p-4 sm:p-6 rounded-lg shadow-md">
                  <section>
                    <h3 className="text-xl font-semibold mb-4 border-b pb-2">Основна Информация</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Име на Салона</Label>
                        <Controller
                          name="name"
                          control={form.control}
                          render={({ field }) => <Input id="name" {...field} required />}
                        />
                        {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                      </div>
                       <div className="space-y-2">
                        <Label htmlFor="address">Адрес</Label>
                        <Controller
                          name="address"
                          control={form.control}
                          render={({ field }) => <Input id="address" {...field} />}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">Град</Label>
                        <Popover open={cityPopoverOpen} onOpenChange={setCityPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={cityPopoverOpen}
                              className="w-full justify-between font-normal"
                            >
                              {form.watch('city')
                                ? sortedBulgarianCities.find(
                                    (city) => city === form.watch('city')
                                  )
                                : "Изберете град..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Търсене на град..." />
                              <CommandList>
                                <CommandEmpty>Няма намерен град.</CommandEmpty>
                                <CommandGroup>
                                  {sortedBulgarianCities.map((city) => (
                                    <CommandItem
                                      key={city}
                                      value={city}
                                      onSelect={(currentValue) => {
                                        form.setValue('city', currentValue === form.watch('city') ? "" : currentValue);
                                        setCityPopoverOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          form.watch('city') === city ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {city}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Телефон</Label>
                         <Controller
                          name="phone"
                          control={form.control}
                          render={({ field }) => <Input id="phone" {...field} />}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Имейл</Label>
                        <Controller
                          name="email"
                          control={form.control}
                          render={({ field }) => <Input id="email" type="email" {...field} />}
                        />
                        {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Уебсайт</Label>
                        <Controller
                          name="website"
                          control={form.control}
                          render={({ field }) => <Input id="website" {...field} />}
                        />
                         {form.formState.errors.website && <p className="text-sm text-destructive">{form.formState.errors.website.message}</p>}
                      </div>
                       <div className="space-y-2">
 <Label htmlFor="workingMethod">Метод на работа</Label>
                          <Controller
 name="workingMethod"
                            control={form.control}
                            render={({ field }) => (
 <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger id="workingMethod">
 <SelectValue placeholder="Изберете метод" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="appointment">С резервация на час</SelectItem>
 <SelectItem value="walk_in">Без резервации</SelectItem>
 </SelectContent>
 </Select>
                            )}
                          />
                          {form.formState.errors.workingMethod && <p className="text-sm text-destructive">{form.formState.errors.workingMethod.message}</p>}
                       </div>
                       
                       <div className="space-y-2">
                          <Label htmlFor="priceRange">Ценови диапазон</Label>
                          <Controller
                            name="priceRange"
                            control={form.control}
                            render={({ field }) => (
                              <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                              >
                                  <SelectTrigger id="priceRange">
                                      <SelectValue placeholder="Изберете ценови диапазон" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="cheap">Евтино ($)</SelectItem>
                                      <SelectItem value="moderate">Умерено ($$)</SelectItem>
                                      <SelectItem value="expensive">Скъпо ($$$)</SelectItem>
                                  </SelectContent>
                              </Select>
                            )}
                          />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="description">Описание</Label>
                         <Controller
                          name="description"
                          control={form.control}
                          render={({ field }) => <Textarea id="description" {...field} required rows={5} />}
                        />
                        {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xl font-semibold mb-4 border-b pb-2">Главна Снимка (URL)</h3>
                    <div className="space-y-2">
                      <Label htmlFor="newHeroImageUrl">URL на главна снимка</Label>
                      <Controller
                        name="newHeroImageUrl"
                        control={form.control}
                        render={({ field }) => <Input id="newHeroImageUrl" type="text" placeholder="https://example.com/hero-image.jpg" {...field} />}
                      />
                      {form.watch('newHeroImageUrl') && form.watch('newHeroImageUrl')?.trim() !== '' && (
                        <div className="mt-2 relative w-full h-64 rounded-md overflow-hidden border group">
                          <Image src={form.watch('newHeroImageUrl')!} alt="Преглед на главна снимка" layout="fill" objectFit="cover" data-ai-hint="salon hero image" />
                          <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              onClick={() => form.setValue('newHeroImageUrl', '')}
                              title="Изчисти URL на главната снимка"
                            >
                              <Trash2 size={16} />
                            </Button>
                        </div>
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xl font-semibold mb-4 border-b pb-2">Фото Галерия (URL адреси)</h3>
                    <div className="space-y-4">
                      <div className="flex items-end gap-2">
                          <div className="flex-grow space-y-1">
                              <Label htmlFor="newGalleryPhotoUrl">URL на нова снимка за галерията</Label>
                               <Controller
                                  name="newGalleryPhotoUrl"
                                  control={form.control}
                                  render={({ field }) => <Input id="newGalleryPhotoUrl" type="text" placeholder="https://example.com/gallery-image.jpg" {...field} />}
                                />
                          </div>
                          <Button type="button" variant="outline" onClick={handleAddGalleryPhotoUrl} className="whitespace-nowrap">
                              <ImagePlus size={18} className="mr-2"/> Добави URL
                          </Button>
                      </div>

                      {(form.watch('photos') && form.watch('photos')!.length > 0) ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {form.watch('photos')!.map((photoUrl, index) => (
                            <div key={`gallery-${index}-${photoUrl}`} className="relative group aspect-square">
                              <Image src={photoUrl} alt={`Снимка от галерия ${index + 1}`} layout="fill" objectFit="cover" className="rounded-md border" data-ai-hint="salon interior detail"/>
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
                </TabsContent>

                <TabsContent value="workingHours" className="mt-0 space-y-6 bg-card p-4 sm:p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-4 border-b pb-2">Работно Време по Дни</h3>
                  {daysOfWeek.map(day => (
                    <div key={day.key} className="grid grid-cols-1 md:grid-cols-4 items-center gap-4 p-4 border rounded-md">
                      <Label className="font-medium md:col-span-1">{day.label}</Label>
                      <div className="flex items-center space-x-2 md:col-span-3">
                        <Controller
                          name={`workingHours.${day.key}.isOff`}
                          control={form.control}
                          render={({ field }) => (
                            <Checkbox
                              id={`isOff-${day.key}`}
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked) {
                                  form.setValue(`workingHours.${day.key}.open`, '');
                                  form.setValue(`workingHours.${day.key}.close`, '');
                                } else {
                                  form.setValue(`workingHours.${day.key}.open`, defaultWorkingHours[day.key].open || '09:00');
                                  form.setValue(`workingHours.${day.key}.close`, defaultWorkingHours[day.key].close || '18:00');
                                }
                              }}
                            />
                          )}
                        />
                        <Label htmlFor={`isOff-${day.key}`} className="text-sm">Почивен ден</Label>
                      </div>

                      {!form.watch(`workingHours.${day.key}.isOff`) && (
                        <>
                          <div className="md:col-start-2 md:col-span-1">
                            <Label htmlFor={`open-${day.key}`} className="text-xs">Отваря в</Label>
                            <Controller
                              name={`workingHours.${day.key}.open`}
                              control={form.control}
                              render={({ field }) => (
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger id={`open-${day.key}`}>
                                    <SelectValue placeholder="--:--" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fullDayTimeOptions.map(time => (
                                      <SelectItem key={`open-${day.key}-${time}`} value={time}>{time}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                          <div className="md:col-span-1">
                            <Label htmlFor={`close-${day.key}`} className="text-xs">Затваря в</Label>
                            <Controller
                              name={`workingHours.${day.key}.close`}
                              control={form.control}
                              render={({ field }) => (
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger id={`close-${day.key}`}>
                                    <SelectValue placeholder="--:--" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fullDayTimeOptions.map(time => (
                                      <SelectItem key={`close-${day.key}-${time}`} value={time}>{time}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                        </>
                      )}
                      {form.watch(`workingHours.${day.key}.isOff`) && <div className="md:col-start-2 md:col-span-2"></div>}
                    </div>
                  ))}
                </TabsContent>
              </div>
            </CardContent>
          </Tabs>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full md:w-auto text-lg py-3" disabled={saving || loading || form.formState.isSubmitting}>
              {saving || form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              {saving || form.formState.isSubmitting ? 'Запазване...' : 'Запази Промените'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
    </>
  );
}

