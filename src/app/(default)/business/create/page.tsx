
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { auth } from '@/lib/firebase';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, Timestamp } from 'firebase/firestore'; // Added Timestamp
import { generateSalonDescription } from '@/ai/flows/generate-salon-description';
import { Building, Sparkles, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { allBulgarianCities, mockServices } from '@/lib/mock-data';
import { Service } from '@/types/service';
import { useToast } from '@/hooks/use-toast';

// Define the schema for the form
interface SalonServiceData {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
}
const createBusinessSchema = z.object({
  name: z.string().min(3, 'Името на бизнеса трябва да е поне 3 символа.'),
  description: z.string().min(20, 'Описанието трябва да е поне 20 символа.').max(500, 'Описанието не може да надвишава 500 символа.'),
  address: z.string().min(5, 'Адресът трябва да е поне 5 символа.'),
  city: z.string().min(2, 'Моля, изберете град.'),
  priceRange: z.enum(['cheap', 'moderate', 'expensive'], {
    errorMap: () => ({ message: 'Моля, изберете ценови диапазон.' }),
  }),
  services: z.array(
    z.object({
      name: z.string().min(1, "Името на услугата е задължително."),
      description: z.string().optional(),
      price: z.coerce.number({ invalid_type_error: "Цената трябва да е число."}).min(0, "Цената трябва да е положително число."),
      duration: z.coerce.number({ invalid_type_error: "Продължителността трябва да е число."}).min(5, "Продължителността трябва да е поне 5 минути (в минути).")
    })
  ).min(1, "Моля, добавете поне една услуга."),
  atmosphereForAi: z.string().min(5, 'Моля, опишете атмосферата по-подробно за AI генерацията.'),
  targetCustomerForAi: z.string().min(1, 'Моля, изберете целевите клиенти.'),
  uniqueSellingPointsForAi: z.string().min(5, 'Моля, опишете уникалните предимства за AI генерацията.'),
});
type CreateBusinessFormValues = z.infer<typeof createBusinessSchema>;

const targetCustomerOptions = [
  { value: 'жени', label: 'Жени' },
  { value: 'мъже', label: 'Мъже' },
  { value: 'унисекс', label: 'Унисекс (Жени и Мъже)' },
  { value: 'младежи', label: 'Младежи' },
  { value: 'семейства', label: 'Семейства' },
];

export default function CreateBusinessPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isBusinessUser, setIsBusinessUser] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const firestore = getFirestore();

  const form = useForm<CreateBusinessFormValues>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      city: '',
      priceRange: 'moderate',
      services: [{ name: '', description: '', price: 0, duration: 30 }],
      atmosphereForAi: '',
      targetCustomerForAi: '',
      uniqueSellingPointsForAi: '',
    },
  });

  const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
    control: form.control,
    name: "services"
  });

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

  const notifyAdminsOfNewSalon = async (salonName: string) => {
    // TODO: Implement fetching admin UIDs more securely.
    // For now, this part is conceptual.
    console.log(`Conceptual: Notify admins about new salon: ${salonName}`);
    // Example:
    // const adminUsersQuery = query(collection(firestore, 'users'), where('role', '==', 'admin'));
    // const adminSnapshot = await getDocs(adminUsersQuery);
    // adminSnapshot.forEach(async (adminDoc) => {
    //   await addDoc(collection(firestore, 'notifications'), {
    //     userId: adminDoc.id,
    //     message: `Нов салон е регистриран: ${salonName}.`,
    //     link: `/admin/business`, // Link to business/salon management
    //     read: false,
    //     createdAt: Timestamp.fromDate(new Date()),
    //     type: 'new_salon_admin',
    //   });
    // });
  };

  const handleGenerateDescription = async () => {
    const formValues = form.getValues();
    const serviceDescriptionString = formValues.services
      .map(s => `${s.name} (Цена: ${s.price} лв., Продължителност: ${s.duration} мин.)`)
      .join(', ');

    if (formValues.services.length === 0 || formValues.services.some(s => !s.name)) {
        toast({
            title: 'Липсват услуги',
            description: 'Моля, добавете и изберете име за поне една услуга, преди да генерирате описание.',
            variant: 'destructive'
        });
        return;
    }

    const aiInputData = {
      salonName: formValues.name || 'Моят Салон',
      serviceDescription: serviceDescriptionString,
      atmosphereDescription: formValues.atmosphereForAi,
      targetCustomerDescription: targetCustomerOptions.find(opt => opt.value === formValues.targetCustomerForAi)?.label || formValues.targetCustomerForAi,
      uniqueSellingPoints: formValues.uniqueSellingPointsForAi,
    };

    if (!aiInputData.salonName || !aiInputData.serviceDescription || !aiInputData.atmosphereDescription || !aiInputData.targetCustomerDescription || !aiInputData.uniqueSellingPoints) {
      toast({
        title: 'Непълна информация за AI',
        description: 'Моля, попълнете името на салона, поне една услуга с име, и полетата за атмосфера, целеви клиенти и уникални предимства за AI генериране на описание.',
        variant: 'destructive',
      });
      form.trigger(['name', 'services', 'atmosphereForAi', 'targetCustomerForAi', 'uniqueSellingPointsForAi']);
      return;
    }
    
    setIsAiGenerating(true);
    try {
      const result = await generateSalonDescription(aiInputData);
      if (result.salonDescription) {
        form.setValue('description', result.salonDescription, { shouldValidate: true });
        toast({ title: 'Описанието е генерирано успешно!', description: 'Прегледайте и редактирайте генерираното описание.' });
      } else {
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

    const salonDataToSave = {
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        priceRange: data.priceRange,
        services: data.services.map(s => ({
            id: mockServices.find(ms => ms.name === s.name)?.id || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: s.name,
            description: (s as Service).description || mockServices.find(ms => ms.name === s.name)?.description || '',
            price: Number(s.price), 
            duration: Number(s.duration), 
        })),
        atmosphereForAi: data.atmosphereForAi,
        targetCustomerForAi: data.targetCustomerForAi,
        uniqueSellingPointsForAi: data.uniqueSellingPointsForAi,
        ownerId: auth.currentUser.uid,
        rating: 0, 
        reviews: [], 
        photos: ['https://placehold.co/600x400.png?text=Photo+1'], 
        heroImage: 'https://placehold.co/1200x400.png?text=Hero+Image', 
        availability: {}, // TODO: Implement availability management
        createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(firestore, 'salons'), salonDataToSave);
      toast({
        title: 'Бизнесът е създаден успешно!',
        description: `${data.name} беше добавен към Вашия списък.`,
      });
      // Placeholder for notifying admins (better done server-side)
      await notifyAdminsOfNewSalon(data.name);

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

  if (isAuthLoading) {
    return <div className="container mx-auto py-10 px-6 text-center">Зареждане на данни...</div>;
  }
  if (!isBusinessUser) {
    // This message might not be seen if redirect happens too fast, but good for debugging
    return <div className="container mx-auto py-10 px-6 text-center">Неоторизиран достъп. Пренасочване...</div>;
  }

  return (
    <div className="container mx-auto py-10 px-6">
      <Card className="w-full max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center">
            <Building className="mr-3 h-8 w-8 text-primary" />
            Създаване на Нов Бизнес (Салон)
          </CardTitle>
          <CardDescription>Попълнете информацията по-долу, за да регистрирате Вашия салон в платформата.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
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

              <div className="space-y-4 border p-4 rounded-md">
                <FormLabel className="text-lg font-medium">Услуги</FormLabel>
                {serviceFields.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-10 gap-3 items-end border-b pb-4 last:border-b-0">
                    <FormField
                      control={form.control}
                      name={`services.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-3">
                          <FormLabel className="text-xs">Име на услугата</FormLabel>
                           <Select 
                             onValueChange={(value) => {
                               field.onChange(value);
                               const selectedMockService = mockServices.find(s => s.name === value);
                               if (selectedMockService) {
                                 form.setValue(`services.${index}.description`, selectedMockService.description || '', {shouldValidate: true});
                                 form.setValue(`services.${index}.price`, selectedMockService.price, {shouldValidate: true});
                                 form.setValue(`services.${index}.duration`, selectedMockService.duration, {shouldValidate: true});
                               }
                             }} 
                             defaultValue={field.value}
                           >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Изберете услуга" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockServices.map(service => (
                                <SelectItem key={service.id} value={service.name}>
                                  {service.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name={`services.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-3">
                          <FormLabel className="text-xs">Описание (по избор)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Кратко описание..." {...field} rows={1} className="text-xs min-h-[2.25rem] py-1.5"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`services.${index}.price`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-1">
                          <FormLabel className="text-xs">Цена (лв.)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="50" {...field} className="text-xs min-h-[2.25rem] py-1.5"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`services.${index}.duration`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-xs">Продълж. (мин.)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="60" {...field} className="text-xs min-h-[2.25rem] py-1.5"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeService(index)}
                      className="md:col-span-1 h-9"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendService({ name: "", description: "", price: 0, duration: 30 })}
                  className="mt-2"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Добави Услуга
                </Button>
                <FormMessage>{form.formState.errors.services?.message || form.formState.errors.services?.root?.message}</FormMessage>
              </div>


              <div className="space-y-2 pt-4">
                <h3 className="text-lg font-medium text-primary">AI Генериране на Основно Описание</h3>
                <p className="text-sm text-muted-foreground">
                  Попълнете следните полета (и поне една услуга по-горе), за да може нашият AI да генерира привлекателно описание за Вашия салон.
                </p>
              </div>
              
              <FormField
                control={form.control}
                name="atmosphereForAi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Атмосфера (за AI)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="напр. Модерна и уютна, с релаксираща музика и комфортни зони за изчакване." {...field} rows={2} />
                    </FormControl>
                    <FormDescription>Опишете усещането и стила на Вашия салон.</FormDescription>
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
                    <FormDescription>Към кого са насочени Вашите услуги?</FormDescription>
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
                      <Textarea placeholder="напр. Използваме само висококачествени професионални продукти, предлагаме безплатна консултация, имаме програми за лоялни клиенти." {...field} rows={3} />
                    </FormControl>
                    <FormDescription>Какво прави Вашия салон специален?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="button" variant="outline" onClick={handleGenerateDescription} disabled={isAiGenerating} className="w-full sm:w-auto">
                {isAiGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
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
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Адрес</FormLabel>
                    <FormControl>
                      <Input placeholder="напр. ул. Цар Освободител 15" {...field} />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Изберете град" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allBulgarianCities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full text-lg py-6" disabled={form.formState.isSubmitting || isAiGenerating}>
                {form.formState.isSubmitting ? 'Създаване...' : 'Създай Бизнес'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
