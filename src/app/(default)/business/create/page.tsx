
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { auth } from '@/lib/firebase';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { generateSalonDescription } from '@/ai/flows/generate-salon-description';
import { Building, Sparkles, Loader2, PlusCircle, Trash2, ArrowLeft, ArrowRight, Phone, Mail } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { bulgarianRegionsAndCities, bulgarianCitiesWithNeighborhoods } from '@/lib/mock-data';
import type { Service, NotificationType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const createBusinessSchema = z.object({
  name: z.string().min(3, 'Името на бизнеса трябва да е поне 3 символа.'),
  description: z.string().min(5, 'Описанието трябва да е поне 5 символа.').max(500, 'Описанието не може да надвишава 500 символа.'),
  region: z.string().min(1, 'Моля, изберете област.'),
  city: z.string().min(1, 'Моля, изберете град.'),
  neighborhood: z.string().optional(),
  street: z.string().min(3, 'Улицата е задължително поле.'),
  streetNumber: z.string().min(1, 'Номерът е задължително поле.'),
  phone: z.string().regex(/^\+359[0-9]{9}$/, 'Невалиден български телефонен номер. Трябва да е във формат +359xxxxxxxxx.').optional().or(z.literal('')),
  email: z.string().email('Невалиден имейл адрес.').optional().or(z.literal('')),
  priceRange: z.enum(['cheap', 'moderate', 'expensive'], { errorMap: () => ({ message: 'Моля, изберете ценови диапазон.' }) }),
  workingMethod: z.enum(['appointment', 'walk_in'], { errorMap: () => ({ message: 'Моля, изберете начин на работа.' }) }),
  atmosphereForAi: z.string().min(5, 'Моля, опишете атмосферата по-подробно за AI генерацията.'),
  targetCustomerForAi: z.string().min(1, 'Моля, изберете целевите клиенти.'),
  uniqueSellingPointsForAi: z.string().min(5, 'Моля, опишете уникалните предимства за AI генерацията.'),
});

type CreateBusinessFormValues = z.infer<typeof createBusinessSchema>;


export default function CreateBusinessPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isBusinessUser, setIsBusinessUser] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const firestore = getFirestore();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<string[]>([]);
  
  const targetCustomerOptions = [
    { value: 'жени', label: 'Жени' },
    { value: 'мъже', label: 'Мъже' },
    { value: 'унисекс', label: 'Унисекс (Жени и Мъже)' },
    { value: 'младежи', label: 'Младежи' },
    { value: 'семейства', label: 'Семейства' },
  ];
  
  const form = useForm<CreateBusinessFormValues>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      name: '',
      description: '',
      region: '',
      city: '',
      neighborhood: '',
      street: '',
      streetNumber: '',
      phone: '+359',
      email: '',
      workingMethod: 'appointment',
      atmosphereForAi: '', 
      targetCustomerForAi: '',
      uniqueSellingPointsForAi: '',
    },
    mode: "onChange",
  });

  const watchedRegion = form.watch('region');
  const watchedCity = form.watch('city');

  useEffect(() => {
    if (watchedRegion) {
        const regionData = bulgarianRegionsAndCities.find(r => r.region === watchedRegion);
        setAvailableCities(regionData ? regionData.cities : []);
        form.setValue('city', '');
        setAvailableNeighborhoods([]);
        form.setValue('neighborhood', '');
    } else {
        setAvailableCities([]);
    }
  }, [watchedRegion, form]);

  useEffect(() => {
    if (watchedCity) {
        setAvailableNeighborhoods(bulgarianCitiesWithNeighborhoods[watchedCity] || []);
        form.setValue('neighborhood', '');
    } else {
        setAvailableNeighborhoods([]);
    }
  }, [watchedCity, form]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data()?.role === 'business') {
          setIsBusinessUser(true);
        } else {
          toast({ title: 'Достъп отказан', description: 'Само бизнес потребители могат да създават бизнеси.', variant: 'destructive' });
          router.push('/');
        }
      } else {
        toast({ title: 'Необходимо е удостоверяване', description: 'Моля, влезте като бизнес потребител.', variant: 'default' });
        router.push('/login');
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [router, toast, firestore]);

  const notifyAdminsOfNewSalon = async (salonName: string, salonId: string) => {
    try {
      const adminUsersQuery = query(collection(firestore, 'users'), where('role', '==', 'admin'));
      const adminSnapshot = await getDocs(adminUsersQuery);
      
      const notificationPromises = adminSnapshot.docs.map(adminDoc => {
        const notificationData = {
          userId: adminDoc.id,
          message: `Нов салон "${salonName}" (ID: ${salonId}) очаква одобрение.`,
          link: `/admin/business`,
          read: false,
          createdAt: Timestamp.fromDate(new Date()),
          type: 'new_salon_admin' as NotificationType,
          relatedEntityId: salonId,
        };
        return addDoc(collection(firestore, 'notifications'), notificationData);
      });
      
      await Promise.all(notificationPromises);
      console.log(`Successfully notified ${adminSnapshot.size} admins about new salon: ${salonName}`);
    } catch (error) {
      console.error("Error notifying admins about new salon:", error);
      toast({
        title: "Грешка при уведомление",
        description: "Имаше проблем с уведомяването на администраторите за новия салон.",
        variant: "destructive"
      });
    }
  };

  const handleGenerateDescription = async () => {
    const formValues = form.getValues();

    const aiInputData: Parameters<typeof generateSalonDescription>[0] = {
      salonName: formValues.name || 'Моят Салон',
      serviceDescription: 'различни услуги за красота',
      atmosphereDescription: formValues.atmosphereForAi,
      targetCustomerDescription: targetCustomerOptions.find(opt => opt.value === formValues.targetCustomerForAi)?.label || formValues.targetCustomerForAi,
      uniqueSellingPoints: formValues.uniqueSellingPointsForAi,
    };

    if (!aiInputData.salonName || !aiInputData.serviceDescription || !aiInputData.atmosphereDescription || !aiInputData.targetCustomerDescription || !aiInputData.uniqueSellingPoints) {
      toast({
        title: 'Непълна информация за AI',
        description: 'Моля, попълнете името на салона и полетата за атмосфера, целеви клиенти и уникални предимства за AI генериране на описание.',
        variant: 'destructive',
      });
      form.trigger(['name', 'atmosphereForAi', 'targetCustomerForAi', 'uniqueSellingPointsForAi']);
      return;
    }
    
    setIsAiGenerating(true);
    try {
      const result = await generateSalonDescription(aiInputData);
      if (result.salonDescription) {
        let generatedDescription = result.salonDescription;
        const maxLength = 300;
        if (generatedDescription.length > maxLength) {
            generatedDescription = generatedDescription.substring(0, maxLength) + '...';
        }
        form.setValue('description', generatedDescription, { shouldValidate: true });
        toast({ title: 'Описанието е генерирано успешно!', description: 'Прегледайте и редактирайте генерираното описание.' });
      } else {
        console.error('AI response did not contain salonDescription:', result);
        toast({ title: 'Грешка при генериране', description: result.error || 'AI не успя да генерира описание.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error generating salon description:', error);
      toast({ title: 'Грешка при AI генериране', description: (error as Error).message || 'Възникна грешка. Моля, опитайте отново.', variant: 'destructive' });
    } finally {
      setIsAiGenerating(false);
    }
  };

  const onSubmit: SubmitHandler<CreateBusinessFormValues> = async (data) => {
    if (!auth.currentUser) {
      toast({ title: 'Грешка', description: 'Потребителят не е удостоверен.', variant: 'destructive' });
      return;
    }

    const fullAddress = `${data.city}, ${data.neighborhood ? `кв. ${data.neighborhood}, ` : ''}ул. ${data.street} ${data.streetNumber}`.trim();
    let locationData;

    if (fullAddress) {
        try {
            const geocodeResponse = await fetch(`/api/geocode?q=${encodeURIComponent(fullAddress)}`);
            if (geocodeResponse.ok) {
                const coords = await geocodeResponse.json();
                locationData = { lat: coords.lat, lng: coords.lng };
            } else {
                toast({ title: "Внимание", description: "Не можаха да бъдат намерени координати за адреса. Салонът ще бъде създаден без карта.", variant: "default" });
            }
        } catch (error) {
            console.error("Geocoding failed during creation:", error);
            toast({ title: "Грешка при геокодиране", description: "Възникна мрежова грешка при опит за геокодиране.", variant: "destructive" });
        }
    }

    const salonDataToSave = {
        name: data.name,
        description: data.description,
        region: data.region,
        city: data.city,
        address: fullAddress,
        neighborhood: data.neighborhood,
        street: data.street,
        streetNumber: data.streetNumber,
        phoneNumber: data.phone,
        email: data.email,
        priceRange: data.priceRange,
        workingMethod: data.workingMethod,
        atmosphereForAi: data.atmosphereForAi,
        targetCustomerForAi: data.targetCustomerForAi,
        uniqueSellingPointsForAi: data.uniqueSellingPointsForAi,
        ownerId: auth.currentUser.uid,
        rating: 0, 
        reviews: [], 
        photos: ['https://placehold.co/600x400.png?text=Photo+1'], 
        heroImage: 'https://placehold.co/1200x400.png?text=Hero+Image', 
        availability: {}, 
        createdAt: serverTimestamp(),
        status: 'pending_approval' as 'pending_approval' | 'approved' | 'rejected',
        location: locationData,
    };

    try {
      const docRef = await addDoc(collection(firestore, 'salons'), salonDataToSave);
      toast({
        title: 'Салонът е изпратен за одобрение!',
        description: `${data.name} беше добавен и очаква одобрение от администратор.`,
      });
      await notifyAdminsOfNewSalon(data.name, docRef.id);
      router.push('/business/manage');
    } catch (error: any) {
      console.error('Error creating business:', error);
      toast({
        title: 'Грешка при създаване на бизнес',
        description: error.message || 'Възникна неочаквана грешка.',
        variant: 'destructive',
      });
    }
  };

  const nextStep = async () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = await form.trigger(["name", "region", "city", "street", "streetNumber", "priceRange", "workingMethod", "phone", "email"]);
    } else if (currentStep === 2) {
      isValid = await form.trigger(["description", "atmosphereForAi", "targetCustomerForAi", "uniqueSellingPointsForAi"]);
    }  else {
      isValid = true;
    }
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
        toast({
            title: "Невалидни данни",
            description: "Моля, поправете грешките в маркираните полета.",
            variant: "destructive",
        })
    }
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  if (isAuthLoading) {
    return <div className="container mx-auto py-10 px-6 text-center">Зареждане на данни...</div>;
  }
  if (!isBusinessUser) {
    return <div className="container mx-auto py-10 px-6 text-center">Неоторизиран достъп. Пренасочване...</div>;
  }

  const stepMotionVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeInOut" } },
    exit: { opacity: 0, x: 30, transition: { duration: 0.3, ease: "easeInOut" } }
  };

  return (
    <div className="container mx-auto py-10 px-6">
      <Card className="w-full max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center">
            <Building className="mr-3 h-8 w-8 text-primary" />
            Създаване на Нов Бизнес (Салон)
          </CardTitle>
          <CardDescription>Попълнете информацията по-долу, за да регистрирате Вашия салон в платформата. Салонът ще бъде видим след одобрение от администратор.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <Progress value={(currentStep / totalSteps) * 100} className="mb-1 w-full h-2" />
              <p className="text-center text-xs text-muted-foreground mb-6">Стъпка {currentStep} от {totalSteps}</p>

              {currentStep === 1 && (
                <motion.div key="step1" initial="hidden" animate="visible" exit="exit" variants={stepMotionVariants} className="space-y-6">
                  <h2 className="text-xl font-semibold text-primary border-b pb-2">Стъпка 1: Основна информация за салона</h2>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Име на бизнеса/салона</FormLabel>
                        <FormControl>
                          <Input placeholder="напр. Студио за красота 'Елеганс'" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Област</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Изберете област" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bulgarianRegionsAndCities.map(regionData => (
                              <SelectItem key={regionData.region} value={regionData.region}>{regionData.region}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Град</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value} 
                          disabled={!watchedRegion}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={!watchedRegion ? "Първо изберете област" : "Изберете град"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableCities.map(city => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {availableNeighborhoods.length > 0 && (
                    <FormField
                        control={form.control}
                        name="neighborhood"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Квартал (по избор)</FormLabel>
                            <Select 
                            onValueChange={field.onChange} 
                            value={field.value} 
                            disabled={!watchedCity}
                            >
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Изберете квартал" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {availableNeighborhoods.map(neighborhood => (
                                <SelectItem key={neighborhood} value={neighborhood}>{neighborhood}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <FormField
                        control={form.control}
                        name="street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Улица</FormLabel>
                            <FormControl>
                              <Input placeholder="напр. Цар Освободител" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormField
                        control={form.control}
                        name="streetNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Номер</FormLabel>
                            <FormControl>
                              <Input placeholder="напр. 15" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" />Телефонен номер</FormLabel>
                            <FormControl>
                               <Input
                                type="tel"
                                placeholder="+359..."
                                {...field}
                                onChange={(e) => {
                                    const prefix = '+359';
                                    let currentValue = e.target.value;
                                    if (!currentValue.startsWith(prefix)) {
                                    const numbersTyped = currentValue.replace(/[^+0-9]/g, '').replace(/^\+359/, '');
                                    currentValue = prefix + numbersTyped;
                                    }
                                    const numbersAfterPrefix = currentValue.substring(prefix.length).replace(/[^0-9]/g, '');
                                    const finalNumericPart = numbersAfterPrefix.substring(0, 9);
                                    field.onChange(prefix + finalNumericPart);
                                }}
                                />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Имейл за контакт</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="contact@salon.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
                  <FormField
                    control={form.control}
                    name="priceRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ценови диапазон</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Изберете ценови диапазон" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cheap">Евтино ($)</SelectItem>
                            <SelectItem value="moderate">Умерено ($$)</SelectItem>
                            <SelectItem value="expensive">Скъпо ($$$)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="workingMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Начин на работа</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Изберете начин на работа" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="appointment">Със записване на час</SelectItem>
                            <SelectItem value="walk_in">Без записване на час</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}

              {currentStep === 2 && (
                 <motion.div key="step2" initial="hidden" animate="visible" exit="exit" variants={stepMotionVariants} className="space-y-6">
                  <h2 className="text-xl font-semibold text-primary border-b pb-2">Стъпка 2: Описание и AI Детайли</h2>
                  <div className="space-y-2 pt-4">
                    <h3 className="text-md font-medium text-foreground">Детайли за AI Генериране на Описание</h3>
                    <p className="text-xs text-muted-foreground">
                      Попълнете следните полета, за да може нашият AI да генерира привлекателно описание.
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="atmosphereForAi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Атмосфера (за AI)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="напр. Модерна и уютна, с релаксираща музика..." {...field} rows={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetCustomerForAi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Целеви клиенти (за AI)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Изберете целева група" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {targetCustomerOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="uniqueSellingPointsForAi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Уникални предимства/акценти (за AI)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="напр. Използваме само висококачествени продукти..." {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="outline" onClick={handleGenerateDescription} disabled={isAiGenerating} className="w-full sm:w-auto">
                    {isAiGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Генерирай Основно Описание с AI
                  </Button>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Основно описание на салона</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Подробно описание на Вашия бизнес/салон..." {...field} rows={5} />
                        </FormControl>
                        <FormDescription>Това описание ще бъде видимо за клиентите. Можете да го редактирате след AI генерирането.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between pt-6 border-t">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep} disabled={form.formState.isSubmitting || isAiGenerating}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Предишна
                </Button>
              )}
              {currentStep < totalSteps && (
                <Button type="button" onClick={nextStep} disabled={form.formState.isSubmitting || isAiGenerating} className={currentStep === 1 ? 'ml-auto' : ''}>
                  Следваща <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {currentStep === totalSteps && (
                <Button type="submit" className="w-full md:w-auto text-lg py-3 ml-auto" disabled={form.formState.isSubmitting || isAiGenerating}>
                  {form.formState.isSubmitting ? 'Изпращане за одобрение...' : 'Изпрати за Одобрение'}
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
