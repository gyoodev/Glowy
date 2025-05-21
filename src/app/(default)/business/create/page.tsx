
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { auth, getUserProfile } from '@/lib/firebase';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateSalonDescription, type GenerateSalonDescriptionInput } from '@/ai/flows/generate-salon-description';
import { Building, Sparkles, Loader2 } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { allBulgarianCities } from '@/lib/mock-data'; // Assuming you might want to reuse this

const createBusinessSchema = z.object({
  name: z.string().min(3, 'Името на бизнеса трябва да е поне 3 символа.'),
  description: z.string().min(20, 'Описанието трябва да е поне 20 символа.').max(500, 'Описанието не може да надвишава 500 символа.'),
  address: z.string().min(5, 'Адресът трябва да е поне 5 символа.'),
  city: z.string().min(2, 'Моля, изберете град.'),
  priceRange: z.enum(['cheap', 'moderate', 'expensive'], {
    errorMap: () => ({ message: 'Моля, изберете ценови диапазон.' }),
  }),
  // Fields for AI generation
  serviceDetailsForAi: z.string().min(10, 'Моля, опишете услугите по-подробно за AI генерацията.'),
  atmosphereForAi: z.string().min(10, 'Моля, опишете атмосферата за AI генерацията.'),
  targetCustomerForAi: z.string().min(10, 'Моля, опишете целевите клиенти за AI генерацията.'),
  uniqueSellingPointsForAi: z.string().min(10, 'Моля, опишете уникалните предимства за AI генерацията.'),
});

type CreateBusinessFormValues = z.infer<typeof createBusinessSchema>;

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
      serviceDetailsForAi: '',
      atmosphereForAi: '',
      targetCustomerForAi: '',
      uniqueSellingPointsForAi: '',
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getUserProfile(user.uid);
        if (profile?.role === 'business') {
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
  }, [router, toast]);

  const handleGenerateDescription = async () => {
    const aiInputData: GenerateSalonDescriptionInput = {
      salonName: form.getValues('name'),
      serviceDescription: form.getValues('serviceDetailsForAi'),
      atmosphereDescription: form.getValues('atmosphereForAi'),
      targetCustomerDescription: form.getValues('targetCustomerForAi'),
      uniqueSellingPoints: form.getValues('uniqueSellingPointsForAi'),
    };

    // Basic validation for AI input fields
    if (!aiInputData.salonName || !aiInputData.serviceDescription || !aiInputData.atmosphereDescription || !aiInputData.targetCustomerDescription || !aiInputData.uniqueSellingPoints) {
      toast({
        title: 'Непълна информация за AI',
        description: 'Моля, попълнете всички полета, маркирани за AI генериране на описание.',
        variant: 'destructive',
      });
      // Trigger validation for specific AI fields
      form.trigger(['name', 'serviceDetailsForAi', 'atmosphereForAi', 'targetCustomerForAi', 'uniqueSellingPointsForAi']);
      return;
    }
    
    setIsAiGenerating(true);
    try {
      const result = await generateSalonDescription(aiInputData);
      if (result.salonDescription) {
        form.setValue('description', result.salonDescription, { shouldValidate: true });
        toast({ title: 'Описанието е генерирано успешно!', description: 'Прегледайте и редактирайте генерираното описание.' });
      } else {
        toast({ title: 'Грешка при генериране', description: 'AI не успя да генерира описание.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error generating salon description:', error);
      toast({ title: 'Грешка при AI генериране', description: 'Възникна грешка. Моля, опитайте отново.', variant: 'destructive' });
    } finally {
      setIsAiGenerating(false);
    }
  };


  const onSubmit: SubmitHandler<CreateBusinessFormValues> = async (data) => {
    if (!auth.currentUser) {
      toast({ title: 'Грешка', description: 'Потребителят не е удостоверен.', variant: 'destructive' });
      return;
    }

    try {
      await addDoc(collection(firestore, 'salons'), {
        ...data,
        ownerId: auth.currentUser.uid,
        rating: 0, // Initial rating
        reviews: [], // Initial empty reviews
        photos: ['https://placehold.co/600x400.png'], // Default placeholder
        heroImage: 'https://placehold.co/1200x400.png', // Default placeholder
        services: [], // Initialize with empty services array
        availability: {}, // Initialize empty availability
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'Бизнесът е създаден успешно!',
        description: `${data.name} беше добавен към Вашия списък.`,
      });
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
    return <div className="container mx-auto py-10 px-6 text-center">Пренасочване...</div>;
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

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-primary">AI Генериране на Описание</h3>
                <p className="text-sm text-muted-foreground">
                  Попълнете следните полета, за да може нашият AI да генерира привлекателно описание за Вашия салон.
                </p>
              </div>

              <FormField
                control={form.control}
                name="serviceDetailsForAi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Подробно описание на услугите</FormLabel>
                    <FormControl>
                      <Textarea placeholder="напр. Предлагаме фризьорство, маникюр, педикюр, козметични процедури, терапии за коса..." {...field} rows={3} />
                    </FormControl>
                    <FormDescription>Какви основни услуги предлагате?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="atmosphereForAi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание на атмосферата</FormLabel>
                    <FormControl>
                      <Textarea placeholder="напр. Модерна и уютна, с релаксираща музика и комфортни зони за изчакване." {...field} rows={2} />
                    </FormControl>
                    <FormDescription>Каква е атмосферата във Вашия салон?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetCustomerForAi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание на целевите клиенти</FormLabel>
                    <FormControl>
                      <Textarea placeholder="напр. Жени и мъже на възраст 25-55, които ценят качеството и индивидуалния подход." {...field} rows={2} />
                    </FormControl>
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
                    <FormLabel>Уникални предимства/акценти</FormLabel>
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
                Генерирай Описание с AI
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
