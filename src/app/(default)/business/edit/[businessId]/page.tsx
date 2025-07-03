
'use client';

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { ImagePlus, Trash2, Edit, Clock, ChevronsUpDown, Check, FileText, Loader2, MapPin, UploadCloud } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { bulgarianRegionsAndCities } from '@/lib/mock-data';
import { useForm, Controller } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { zodResolver } from "@hookform/resolvers/zod"
import type { Salon, WorkingHoursStructure, Service } from '@/types';
import { z } from 'zod';
import { type SubmitHandler } from 'react-hook-form';
import { mapSalon } from '@/utils/mappers'; 
import { auth, getUserProfile, firestore } from '@/lib/firebase';
import { Checkbox } from '@/components/ui/checkbox';

const generateFullDayTimeOptions = () => {
  const options = [];
  for (let i = 0; i < 48; i++) {
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
  region: z.string().min(1, 'Моля, изберете област.'),
  city: z.string().min(1, 'Моля, изберете град.'),
  address: z.string().optional(),
  priceRange: z.enum(['cheap', 'moderate', 'expensive', '']).optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: "Невалиден имейл адрес." }).optional().or(z.literal('')),
  website: z.string().url({ message: "Невалиден URL адрес на уебсайт." }).optional().or(z.literal('')),
  workingMethod: z.enum(['appointment', 'walk_in', 'both']).optional(),
  workingHours: z.record(z.string(), z.object({
    open: z.string(),
    close: z.string(),
    isOff: z.boolean(),
  })).optional(),
  heroImage: z.string().optional(),
  photos: z.array(z.string()).optional(),
  availability: z.record(z.string(), z.array(z.string())).optional(),
  services: z.array(z.any()).optional(),
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
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);


  const businessId = params?.businessId as string;
  
  const form = useForm<EditBusinessFormValues>({
    resolver: zodResolver(editBusinessSchema),
    defaultValues: {
      name: '',
      description: '',
      region: '',
      city: '',
      address: '',
      priceRange: 'moderate',
      phone: '',
      email: '',
      website: '',
      workingMethod: 'appointment',
      workingHours: defaultWorkingHours,
      heroImage: '',
      photos: [],
      availability: {},
      services: [],
    },
  });

  const selectedRegion = form.watch('region');

  useEffect(() => {
    if (selectedRegion) {
        const regionData = bulgarianRegionsAndCities.find(r => r.region === selectedRegion);
        setAvailableCities(regionData ? regionData.cities : []);
    } else {
        setAvailableCities([]);
    }
  }, [selectedRegion]);


  const fetchBusinessData = useCallback(async (userId: string) => { 
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
        const profile = await getUserProfile(userId);
        
        if (businessData.ownerId !== userId && profile?.role !== 'admin') {
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
        
        if (businessData.region) {
            const regionData = bulgarianRegionsAndCities.find(r => r.region === businessData.region);
            setAvailableCities(regionData ? regionData.cities : []);
        }

        form.reset({
            name: businessData.name,
            description: businessData.description,
            region: businessData.region || '',
            city: businessData.city || '',
            address: businessData.address || '',
            priceRange: businessData.priceRange || 'moderate',
            phone: businessData.phoneNumber || '',
            email: businessData.email || '',
            website: businessData.website || '',
            workingMethod: businessData.workingMethod || 'appointment' as 'appointment' | 'walk_in' | 'both',
            workingHours: initialWorkingHours,
            heroImage: businessData.heroImage || '',
            photos: businessData.photos || [],
            availability: businessData.availability || {},
            services: businessData.services || [],
        });
      } else {
        toast({ title: 'Не е намерен', description: 'Бизнесът не е намерен.', variant: 'destructive' });
        const profile = await getUserProfile(userId);
        if (profile?.role === 'admin') {
            router.push('/admin/business');
        } else {
            router.push('/business/manage');
        }
      }
    } catch (error) {
      console.error('Error fetching business:', error);
      toast({ title: 'Грешка', description: 'Неуспешно извличане на данни за бизнеса.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [businessId, firestore, form, router, toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
      } else {
        fetchBusinessData(user.uid);
      }
    });
    return () => unsubscribe();
 }, [businessId, router, fetchBusinessData]);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>, imageType: 'hero' | 'gallery') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (imageType === 'hero') setIsUploadingHero(true);
    if (imageType === 'gallery') setIsUploadingGallery(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            const imageUrl = result.filePath;
            if (imageType === 'hero') {
                form.setValue('heroImage', imageUrl, { shouldValidate: true });
            } else {
                form.setValue('photos', [...(form.getValues('photos') || []), imageUrl], { shouldValidate: true });
            }
            toast({ title: "Успех", description: "Снимката е качена и конвертирана в WebP." });
        } else {
            throw new Error(result.error || "Неуспешно качване на снимка.");
        }
    } catch (error: any) {
        console.error('Error uploading file:', error);
        toast({ title: 'Грешка при качване', description: error.message, variant: 'destructive' });
    } finally {
        if (imageType === 'hero') setIsUploadingHero(false);
        if (imageType === 'gallery') setIsUploadingGallery(false);
    }
  };


  const removeGalleryPhoto = (photoUrlToRemove: string) => {
    const currentPhotos = form.getValues('photos') || [];
    form.setValue('photos', currentPhotos.filter(url => url !== photoUrlToRemove));
  };

  const onSubmit: SubmitHandler<EditBusinessFormValues> = async (data) => {
    if (!businessId || !business) return;
    setSaving(true);
  
    // Create the base object with all fields that are always updated
    const dataToUpdate: Partial<Salon> & { lastUpdatedAt: string; location?: { lat: number, lng: number } | null } = {
        name: data.name,
        description: data.description,
        region: data.region,
        city: data.city,
        address: data.address,
        priceRange: data.priceRange,
        phoneNumber: data.phone,
        email: data.email,
        website: data.website,
        workingMethod: data.workingMethod,
        workingHours: data.workingHours,
        heroImage: data.heroImage || '',
        photos: data.photos || [],
        services: data.services?.map(s => ({
          id: s.id || `custom_service_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: s.name,
          description: s.description || '',
          price: Number(s.price),
          duration: Number(s.duration)
        })) || [],
        lastUpdatedAt: new Date().toISOString(),
    };
  
    // Explicitly handle location update logic
    const fullAddress = `${data.address}, ${data.city}`;
    if (data.address && data.address !== business.address) {
      // Address has changed and is not empty, attempt to geocode.
      try {
        const geocodeResponse = await fetch(`/api/geocode?q=${encodeURIComponent(fullAddress)}`);
        if (geocodeResponse.ok) {
          const coords = await geocodeResponse.json();
          if (coords.error) {
            toast({ title: "Грешка при геокодиране", description: coords.error, variant: "destructive" });
            dataToUpdate.location = null; // Set to null on error
          } else {
            dataToUpdate.location = { lat: coords.lat, lng: coords.lng };
            toast({ title: "Адресът е геокодиран", description: `Намерени са координати за ${data.address}.` });
          }
        } else {
          toast({ title: "Грешка при геокодиране", description: "Не можаха да бъдат намерени координати за новия адрес.", variant: "destructive" });
          dataToUpdate.location = null; // Set to null on error
        }
      } catch (error) {
        console.error("Geocoding failed:", error);
        toast({ title: "Грешка при геокодиране", description: "Възникна мрежова грешка при опит за геокодиране.", variant: "destructive" });
        dataToUpdate.location = null; // Set to null on error
      }
    } else if (!data.address) {
      // Address was cleared, so set location to null.
      dataToUpdate.location = null;
    }
    // If address is unchanged, `dataToUpdate.location` remains unset, preserving the existing value.
  
    try {
      const businessRef = doc(firestore, 'salons', businessId);
      await updateDoc(businessRef, dataToUpdate);
      toast({ title: 'Успех', description: 'Бизнесът е актуализиран успешно.' });
  
      const profile = await getUserProfile(auth.currentUser!.uid);
      if (profile?.role === 'admin') {
        router.push('/admin/business');
      } else {
        router.push('/business/manage');
      }
  
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
                        <Label htmlFor="region">Област</Label>
                        <Controller
                            name="region"
                            control={form.control}
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        form.setValue('city', ''); // Reset city on region change
                                    }}
                                >
                                    <SelectTrigger id="region">
                                        <SelectValue placeholder="Изберете област" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bulgarianRegionsAndCities.map(regionData => (
                                            <SelectItem key={regionData.region} value={regionData.region}>{regionData.region}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                         {form.formState.errors.region && <p className="text-sm text-destructive">{form.formState.errors.region.message}</p>}
                      </div>
                       <div className="space-y-2">
                        <Label htmlFor="city">Град</Label>
                        <Controller
                            name="city"
                            control={form.control}
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange} disabled={!selectedRegion}>
                                    <SelectTrigger id="city">
                                        <SelectValue placeholder={selectedRegion ? "Изберете град" : "Първо изберете област"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableCities.map(city => (
                                            <SelectItem key={city} value={city}>{city}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {form.formState.errors.city && <p className="text-sm text-destructive">{form.formState.errors.city.message}</p>}
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
                    <h3 className="text-xl font-semibold mb-4 border-b pb-2">Главна Снимка</h3>
                     <div className="space-y-2">
                      <Label htmlFor="hero-image-upload">Качване на нова главна снимка</Label>
                        <div className="flex items-center gap-4">
                            <Input id="hero-image-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'hero')} className="hidden" disabled={isUploadingHero} />
                            <Label htmlFor="hero-image-upload" className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer')}>
                                <UploadCloud className="mr-2 h-4 w-4" />
                                Избери файл
                            </Label>
                            {isUploadingHero && <Loader2 className="h-5 w-5 animate-spin" />}
                        </div>
                      {form.watch('heroImage') && (
                        <div className="mt-4 relative w-full h-64 rounded-md overflow-hidden border group">
                          <Image src={form.watch('heroImage')!} alt="Преглед на главна снимка" layout="fill" objectFit="cover" data-ai-hint="salon hero image" />
                        </div>
                      )}
                    </div>
                  </section>
                  <section>
                    <h3 className="text-xl font-semibold mb-4 border-b pb-2">Фото Галерия</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                           <Label htmlFor="gallery-image-upload">Качване на снимка в галерията</Label>
                            <div className="flex items-center gap-4">
                                <Input id="gallery-image-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'gallery')} className="hidden" disabled={isUploadingGallery} />
                                <Label htmlFor="gallery-image-upload" className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer')}>
                                    <UploadCloud className="mr-2 h-4 w-4" />
                                    Добави снимка
                                </Label>
                                {isUploadingGallery && <Loader2 className="h-5 w-5 animate-spin" />}
                            </div>
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
                        <p className="text-muted-foreground text-center py-4">Галерията е празна. Качете снимки, за да я попълните.</p>
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
            <Button type="submit" className="w-full md:w-auto text-lg py-3" disabled={saving || loading || form.formState.isSubmitting || isUploadingHero || isUploadingGallery}>
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
