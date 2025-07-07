
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { mockServices as predefinedServices } from '@/lib/mock-data';
import type { Service, Salon } from '@/types';
import { mapSalon } from '@/utils/mappers';
import { AlertTriangle, ArrowLeft, Loader2, PlusCircle, Scissors, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

const manualServiceSchema = z.object({
  name: z.string().min(3, "Името на услугата трябва да е поне 3 символа."),
  description: z.string().optional(),
  price: z.coerce.number({ invalid_type_error: "Цената трябва да е число." }).min(0, "Цената не може да бъде отрицателна."),
  duration: z.coerce.number({ invalid_type_error: "Продължителността трябва да е число." }).min(5, "Продължителността трябва да е поне 5 минути."),
});

type ManualServiceFormValues = z.infer<typeof manualServiceSchema>;

export default function ServicesManagementPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = getFirestore();

  const businessId = params?.businessId as string;

  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPredefinedServiceId, setSelectedPredefinedServiceId] = useState<string>('');

  const form = useForm<ManualServiceFormValues>({
    resolver: zodResolver(manualServiceSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      duration: 30,
    },
  });

  const fetchSalonData = useCallback(async () => {
    if (!businessId) {
      setError('Невалиден ID на бизнес.');
      setIsLoading(false);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError('Необходимо е удостоверяване.');
      setIsLoading(false);
      router.push('/login');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const salonRef = doc(firestore, 'salons', businessId);
      const salonSnap = await getDoc(salonRef);

      if (!salonSnap.exists()) {
        setError(`Салон с ID ${businessId} не е намерен.`);
        setSalon(null);
        return;
      }

      const salonData = mapSalon(salonSnap.data(), salonSnap.id);
      if (salonData.ownerId !== user.uid) {
        setError('Нямате права за достъп до услугите на този салон.');
        setSalon(null);
        return;
      }
      setSalon(salonData);
    } catch (err) {
      console.error("Error fetching salon data:", err);
      setError('Възникна грешка при зареждане на данните за салона.');
    } finally {
      setIsLoading(false);
    }
  }, [businessId, firestore, router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchSalonData();
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [fetchSalonData, router]);

  const handleUpdateServices = async (updatedServices: Service[]) => {
    if (!salon) return;
    setIsSubmitting(true);
    try {
      // This is the fix: Remove the non-serializable `categoryIcon` before saving.
      const servicesToSave = updatedServices.map(({ categoryIcon, ...rest }) => rest);

      const salonRef = doc(firestore, 'salons', salon.id);
      await updateDoc(salonRef, { services: servicesToSave });
      
      // Update local state with the full service objects (including icons) for rendering
      setSalon(prev => prev ? { ...prev, services: updatedServices } : null);
      
      toast({ title: 'Успех', description: 'Списъкът с услуги е актуализиран.' });
    } catch (err: any) {
      console.error("Error updating services:", err);
      toast({ title: 'Грешка', description: `Неуспешна актуализация на услугите: ${err.message}`, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAddService = async () => {
    if (!selectedPredefinedServiceId || !salon) return;
    
    const serviceToAdd = predefinedServices.find(s => s.id === selectedPredefinedServiceId);
    if (!serviceToAdd) {
      toast({ title: 'Грешка', description: 'Избраната услуга не е намерена.', variant: 'destructive' });
      return;
    }

    const currentServices = salon.services || [];
    if (currentServices.some(s => s.id === serviceToAdd.id || s.name.toLowerCase() === serviceToAdd.name.toLowerCase())) {
      toast({ title: 'Услугата вече съществува', description: `"${serviceToAdd.name}" вече е в списъка.`, variant: 'default' });
      return;
    }
    
    await handleUpdateServices([...currentServices, serviceToAdd]);
    setSelectedPredefinedServiceId(''); // Reset select
  };

  const onManualSubmit: SubmitHandler<ManualServiceFormValues> = async (data) => {
    if (!salon) return;
    const newService: Service = { ...data, id: uuidv4() };
    
    const currentServices = salon.services || [];
     if (currentServices.some(s => s.name.toLowerCase() === newService.name.toLowerCase())) {
      toast({ title: 'Услугата вече съществува', description: `Услуга с име "${newService.name}" вече е в списъка.`, variant: 'destructive' });
      return;
    }

    await handleUpdateServices([...currentServices, newService]);
    form.reset();
  };
  
  const handleDeleteService = async (serviceId: string) => {
    if (!salon || !salon.services) return;
    if (!window.confirm("Сигурни ли сте, че искате да изтриете тази услуга?")) return;

    const updatedServices = salon.services.filter(s => s.id !== serviceId);
    await handleUpdateServices(updatedServices);
  };

  const categorizedPredefinedServices = useMemo(() => {
    return predefinedServices.reduce((acc, service) => {
      const category = service.category || 'Други';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(service);
      return acc;
    }, {} as Record<string, Service[]>);
  }, []);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><Loader2 className="h-8 w-8 animate-spin" /> Зареждане...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-6 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Грешка</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.push('/business/manage')}>
          Обратно към управление на бизнеси
        </Button>
      </div>
    );
  }

  if (!salon) {
    return null; // or a more specific "not found" component
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" size="sm" asChild className="mb-4">
        <Link href="/business/manage">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад към управление
        </Link>
      </Button>
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Управление на услуги</h1>
        <p className="text-muted-foreground">Добавяне, премахване и редактиране на услугите за салон "{salon.name}".</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left side for adding services */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Бързо добавяне</CardTitle>
              <CardDescription>Добавете услуга от предварително подготвен списък.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="flex-grow">
                  <Label htmlFor="predefined-service">Изберете услуга</Label>
                  <Select value={selectedPredefinedServiceId} onValueChange={setSelectedPredefinedServiceId}>
                    <SelectTrigger id="predefined-service">
                      <SelectValue placeholder="Изберете услуга..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categorizedPredefinedServices).map(([category, services]) => (
                        <SelectGroup key={category}>
                          <SelectLabel>{category}</SelectLabel>
                          {services.map(service => (
                            <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleQuickAddService} disabled={!selectedPredefinedServiceId || isSubmitting} size="icon">
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onManualSubmit)}>
                <CardHeader>
                  <CardTitle>Ръчно добавяне</CardTitle>
                  <CardDescription>Създайте нова, персонализирана услуга.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Име на услугата</FormLabel>
                        <FormControl>
                          <Input placeholder="напр. Терапия за коса" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Описание (по избор)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Кратко описание..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                     <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Цена (лв.)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Продълж. (мин.)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="60" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Добави услуга
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>

        {/* Right side for listing services */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scissors className="mr-2 h-5 w-5 text-primary" />
                Списък с услуги ({salon.services?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salon.services && salon.services.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Име</TableHead>
                        <TableHead>Цена</TableHead>
                        <TableHead>Продълж.</TableHead>
                        <TableHead>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salon.services.map(service => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">
                            {service.name}
                            {service.description && <p className="text-xs text-muted-foreground">{service.description}</p>}
                          </TableCell>
                          <TableCell>{service.price.toFixed(2)} лв.</TableCell>
                          <TableCell>{service.duration} мин.</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteService(service.id)}
                              disabled={isSubmitting}
                              title="Изтрий услугата"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Все още няма добавени услуги за този салон.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
