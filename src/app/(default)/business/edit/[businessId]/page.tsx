
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import type { Salon, WorkingHoursStructure, Service } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { ImagePlus, Trash2, Edit, CalendarDays, Clock, PlusCircle, ChevronsUpDown, Check, Briefcase } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, parse } from 'date-fns';
import { bg } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; 
import { allBulgarianCities, mockServices } from '@/lib/mock-data';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SubmitHandler } from 'react-hook-form';


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

const serviceSchema = z.object({
  id: z.string().optional(), // ID can be optional if it's generated or comes from mockServices
  name: z.string().min(1, "Името на услугата е задължително."),
  description: z.string().optional(),
  price: z.coerce.number({ invalid_type_error: "Цената трябва да е число." }).min(0, "Цената трябва да е положително число."),
  duration: z.coerce.number({ invalid_type_error: "Продължителността трябва да е число." }).min(5, "Продължителността трябва да е поне 5 минути (в минути).")
});

const editBusinessSchema = z.object({
  name: z.string().min(1, 'Името на салона е задължително.'),
  description: z.string().min(1, 'Описанието е задължително.'),
  address: z.string().optional(),
  city: z.string().optional(),
  priceRange: z.enum(['cheap', 'moderate', 'expensive', '']).optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: "Невалиден имейл адрес." }).optional().or(z.literal('')),
  website: z.string().url({ message: "Невалиден URL адрес на уебсайт." }).optional().or(z.literal('')),
  workingHours: z.record(z.string(), z.object({
    open: z.string(),
    close: z.string(),
    isOff: z.boolean(),
  })).optional(),
  heroImage: z.string().optional(),
  photos: z.array(z.string()).optional(),
  newHeroImageUrl: z.string().optional(),
  newGalleryPhotoUrl: z.string().optional(),
  availability: z.record(z.string(), z.array(z.string())).optional(),
  services: z.array(serviceSchema).min(0, "Моля, добавете поне една услуга.").optional(), // Made optional at top level, min(0)
});

type EditBusinessFormValues = z.infer<typeof editBusinessSchema>;


export default function EditBusinessPage() {
  const router = useRouter();
  const params = useParams();
  const businessId = params?.businessId as string;
  const authInstance = getAuth();
  const firestore = getFirestore();
  const { toast } = useToast();

  const [business, setBusiness] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [selectedAvailabilityDate, setSelectedAvailabilityDate] = useState<Date | undefined>(undefined);
  const [newTimeForSelectedDate, setNewTimeForSelectedDate] = useState('');
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);

  const sortedBulgarianCities = useMemo(() => [...allBulgarianCities].sort((a, b) => a.localeCompare(b, 'bg')), []);

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
      workingHours: defaultWorkingHours,
      heroImage: '',
      photos: [],
      newHeroImageUrl: '',
      newGalleryPhotoUrl: '',
      availability: {},
      services: [],
    },
  });

  const { fields: serviceFields, append: appendService, remove: removeService, update } = useFieldArray({
    control: form.control,
    name: "services"
  });


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
            phone: businessData.phone || '',
            email: businessData.email || '',
            website: businessData.website || '',
            workingHours: initialWorkingHours,
            heroImage: businessData.heroImage || '',
            photos: businessData.photos || [],
            newHeroImageUrl: businessData.heroImage || '', 
            newGalleryPhotoUrl: '',
            availability: businessData.availability || {},
            services: businessData.services?.map(s => ({ // Ensure services are mapped with all fields
                id: s.id || `service_existing_${Math.random().toString(36).substr(2, 9)}`, // Add temporary ID if missing
                name: s.name,
                description: s.description || '',
                price: s.price,
                duration: s.duration,
            })) || [],
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
        form.setValue('newGalleryPhotoUrl', ''); // Clear input
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

  const handleAvailabilityDateSelect = (date: Date | undefined) => {
    setSelectedAvailabilityDate(date);
    setNewTimeForSelectedDate('');
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
    const currentAvailability = form.getValues('availability') || {};
    const currentTimes = currentAvailability[dateKey] || [];

    if (currentTimes.includes(newTimeForSelectedDate)) {
      toast({ title: 'Дублиран час', description: 'Този час вече е добавен за избраната дата.', variant: 'default'});
      return;
    }
    const updatedTimes = [...currentTimes, newTimeForSelectedDate].sort();
    form.setValue(`availability.${dateKey}`, updatedTimes);
    setNewTimeForSelectedDate(''); 
  };

  const handleRemoveTimeSlot = (dateKey: string, timeToRemove: string) => {
    const currentAvailability = form.getValues('availability') || {};
    const currentTimes = currentAvailability[dateKey] || [];
    const updatedTimes = currentTimes.filter(time => time !== timeToRemove);
    
    if (updatedTimes.length === 0) {
      const newAvailability = { ...currentAvailability };
      delete newAvailability[dateKey];
      form.setValue('availability', newAvailability);
    } else {
      form.setValue(`availability.${dateKey}`, updatedTimes);
    }
  };
  
  const handleRemoveAllTimesForDate = (dateKey: string) => {
    const currentAvailability = form.getValues('availability') || {};
    const newAvailability = { ...currentAvailability };
    delete newAvailability[dateKey];
    form.setValue('availability', newAvailability);
    toast({ title: 'Часовете са премахнати', description: `Всички часове за ${format(parse(dateKey, 'yyyy-MM-dd', new Date()), "PPP", { locale: bg })} са премахнати.`, variant: 'default'});
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
        phone: data.phone,
        email: data.email,
        website: data.website,
        workingHours: data.workingHours,
        heroImage: data.newHeroImageUrl?.trim() || data.heroImage || '',
        photos: data.photos || [],
        availability: data.availability || {},
        services: data.services?.map(s => ({
          id: s.id || mockServices.find(ms => ms.name === s.name)?.id || `service_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, // Ensure ID exists
          name: s.name,
          description: s.description || mockServices.find(ms => ms.name === s.name)?.description || '',
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
            <Skeleton className="h-64 w-full mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!business) return null;

  const today = new Date();
  today.setHours(0,0,0,0);

  const currentAvailability = form.watch('availability') || {};
  const availableDaysModifier = {
    available: Object.keys(currentAvailability).filter(dateKey => (currentAvailability[dateKey]?.length || 0) > 0).map(dateKey => parse(dateKey, 'yyyy-MM-dd', new Date()))
  };

  return (
    <div className="container mx-auto py-10 px-6">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center">
            <Edit className="mr-3 h-8 w-8 text-primary" />
            Редактирай Салон: {form.watch('name') || business.name}
          </CardTitle>
          <CardDescription>Актуализирайте информацията, снимките, услугите и наличността за Вашия салон.</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="details">Детайли</TabsTrigger>
                <TabsTrigger value="servicesTab">Услуги</TabsTrigger>
                <TabsTrigger value="workingHours">Работно Време</TabsTrigger>
                <TabsTrigger value="availability">Наличност</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-8">
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
              </TabsContent>

             <TabsContent value="servicesTab" className="space-y-6">
                <h3 className="text-xl font-semibold mb-4 border-b pb-2 flex items-center">
                  <Briefcase className="mr-2 h-5 w-5 text-primary" />
                  Управление на Услуги
                </h3>
                {serviceFields.map((item, index) => (
                  <Card key={item.id} className="p-4 space-y-3 relative">
                    <div className="space-y-1">
                      <Label htmlFor={`services.${index}.name`}>Име на услугата</Label>
                       <Controller
                        name={`services.${index}.name`}
                        control={form.control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                                field.onChange(value);
                                const selectedMockService = mockServices.find(ms => ms.name === value);
                                if (selectedMockService) {
                                    // Auto-fill other fields if a mock service is selected
                                    form.setValue(`services.${index}.description`, selectedMockService.description, { shouldValidate: true });
                                    form.setValue(`services.${index}.price`, selectedMockService.price, { shouldValidate: true });
                                    form.setValue(`services.${index}.duration`, selectedMockService.duration, { shouldValidate: true });
                                    form.setValue(`services.${index}.id`, selectedMockService.id, {shouldValidate: true}); // Set ID from mockService
                                } else {
                                    // If user types a custom name, clear ID or generate a new one
                                    form.setValue(`services.${index}.id`, `custom_${Date.now()}_${index}`, {shouldValidate: true});
                                }
                            }}
                          >
                            <SelectTrigger id={`services.${index}.name`}>
                              <SelectValue placeholder="Изберете или въведете име" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockServices.map(service => (
                                <SelectItem key={service.id} value={service.name}>
                                  {service.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {form.formState.errors.services?.[index]?.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.services?.[index]?.name?.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`services.${index}.description`}>Описание (по избор)</Label>
                      <Controller
                        name={`services.${index}.description`}
                        control={form.control}
                        render={({ field }) => <Textarea id={`services.${index}.description`} {...field} rows={2} />}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor={`services.${index}.price`}>Цена (лв.)</Label>
                        <Controller
                          name={`services.${index}.price`}
                          control={form.control}
                          render={({ field }) => <Input id={`services.${index}.price`} type="number" {...field} />}
                        />
                         {form.formState.errors.services?.[index]?.price && <p className="text-sm text-destructive">{form.formState.errors.services?.[index]?.price?.message}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`services.${index}.duration`}>Продължителност (мин.)</Label>
                        <Controller
                          name={`services.${index}.duration`}
                          control={form.control}
                          render={({ field }) => <Input id={`services.${index}.duration`} type="number" {...field} />}
                        />
                        {form.formState.errors.services?.[index]?.duration && <p className="text-sm text-destructive">{form.formState.errors.services?.[index]?.duration?.message}</p>}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeService(index)}
                      className="absolute top-2 right-2 h-7 w-7"
                      title="Премахни услугата"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </Card>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendService({ 
                    id: `new_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    name: '', 
                    description: '', 
                    price: 0, 
                    duration: 30 
                  })}
                  className="mt-4"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Добави Нова Услуга
                </Button>
                 {form.formState.errors.services && typeof form.formState.errors.services === 'object' && !Array.isArray(form.formState.errors.services) && form.formState.errors.services.root && (
                  <p className="text-sm text-destructive mt-2">{form.formState.errors.services.root.message}</p>
                )}
              </TabsContent>

              <TabsContent value="workingHours" className="space-y-6">
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


              <TabsContent value="availability" className="space-y-8">
                 <section>
                  <h3 className="text-xl font-semibold mb-4 border-b pb-2 flex items-center">
                    <CalendarDays className="mr-2 h-5 w-5 text-primary" />
                    Наличност за Резервации
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
 month: (n: number) => ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'][n],
                          },
                          formatLong: { date: () => 'dd/MM/yyyy' }
                        } as any}
                      />
                    </div>

                    {selectedAvailabilityDate && (
                      <div className="space-y-4">
                        <div>
                          <Label className="font-medium text-base">
                            Часове за: <span className="font-bold text-primary">{format(selectedAvailabilityDate, "PPP", { locale: bg })}</span>
                          </Label>
                          
                          <div className="mt-3 space-y-3">
                            <div>
                              <Label htmlFor="predefinedTimeSlot" className="font-medium text-sm text-muted-foreground">
                                Избери готов час:
                              </Label>
                              <Select
                                onValueChange={(value) => {
                                  if (value) setNewTimeForSelectedDate(value);
                                }}
                                value={newTimeForSelectedDate}
                              >
                                <SelectTrigger id="predefinedTimeSlot" className="mt-1">
                                  <SelectValue placeholder="Избери от списъка" />
                                </SelectTrigger>
                                <SelectContent>
                                  {predefinedTimeSlots.map(slot => (
                                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="newTimeSlot" className="font-medium text-sm text-muted-foreground">
                                Или въведи ръчно (HH:MM):
                              </Label>
                              <div className="flex items-center gap-2 mt-1">
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
                          </div>
                        </div>
                        {currentAvailability[format(selectedAvailabilityDate, 'yyyy-MM-dd')] && currentAvailability[format(selectedAvailabilityDate, 'yyyy-MM-dd')].length > 0 ? (
                          <div className="space-y-2 pt-3">
                            <h4 className="text-sm font-medium text-muted-foreground">Записани часове:</h4>
                            <div className="flex flex-wrap gap-2">
                              {currentAvailability[format(selectedAvailabilityDate, 'yyyy-MM-dd')]?.map(time => (
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
                          <p className="text-sm text-muted-foreground text-center py-2 pt-3">Няма добавени часове за тази дата.</p>
                        )}
                      </div>
                    )}
                    {!selectedAvailabilityDate && (
                        <div className="md:col-span-1 flex items-center justify-center text-muted-foreground h-full p-4 border border-dashed rounded-md">
                            <p className="text-center">Изберете дата от календара, за да управлявате свободните часове.</p>
                        </div>
                    )}
                  </div>
                </section>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full md:w-auto text-lg py-3" disabled={saving || loading || form.formState.isSubmitting}>
              {saving || form.formState.isSubmitting ? 'Запазване...' : 'Запази Промените'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

