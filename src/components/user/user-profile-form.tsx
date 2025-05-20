
'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from "@/hooks/use-toast";
import { UserCircle2, X } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { mockServices, allBulgarianCities } from '@/lib/mock-data'; 
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase'; // Firebase auth
import { getFirestore, doc, setDoc } from 'firebase/firestore'; // Firestore functions

const profileSchema = z.object({
  name: z.string().min(2, 'Името трябва да е поне 2 символа.'),
  email: z.string().email('Невалиден имейл адрес.'), // Email is typically not changed without re-auth/verification
  profilePhotoUrl: z.string().url('Невалиден URL за профилна снимка.').optional().or(z.literal('')),
  favoriteServices: z.array(z.string()).optional(),
  priceRange: z.enum(['cheap', 'moderate', 'expensive', '']).optional(),
  preferredLocations: z.array(z.string()).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface UserProfileFormProps {
  userProfile: UserProfile; // Expect this to be non-null when rendered
}

export function UserProfileForm({ userProfile }: UserProfileFormProps) {
  const { toast } = useToast();
  const [servicePopoverOpen, setServicePopoverOpen] = useState(false);
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const firestore = getFirestore();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '', // Initialize with empty and populate via useEffect
      email: '',
      profilePhotoUrl: '',
      favoriteServices: [],
      priceRange: '',
      preferredLocations: [],
    },
  });

  // Populate form when userProfile prop changes (e.g., after fetching)
  useEffect(() => {
    if (userProfile) {
      form.reset({
        name: userProfile.name || '',
        email: userProfile.email || '',
        profilePhotoUrl: userProfile.profilePhotoUrl || '',
        favoriteServices: userProfile.preferences?.favoriteServices || [],
        priceRange: userProfile.preferences?.priceRange || '',
        preferredLocations: userProfile.preferences?.preferredLocations || [],
      });
    }
  }, [userProfile, form]);


  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!auth.currentUser) {
      toast({ title: "Грешка", description: "Трябва да сте влезли, за да актуализирате профила.", variant: "destructive" });
      return;
    }
    
    try {
      const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
      const profileDataToSave = {
        userId: auth.currentUser.uid, // Ensure userId is saved
        displayName: data.name, // Save as displayName in Firestore
        // email: data.email, // Avoid changing email directly without proper Firebase re-authentication flow
        profilePhotoUrl: data.profilePhotoUrl || null, // Store null if empty string for easier checks
        preferences: {
          favoriteServices: data.favoriteServices || [],
          priceRange: data.priceRange || null, // Store null if empty string
          preferredLocations: data.preferredLocations || [],
        },
        lastUpdatedAt: new Date(), // Good practice to track updates
      };

      // Explicitly keep email if it exists, as it's not part of the form for editing but should persist
      if (userProfile.email) {
        (profileDataToSave as any).email = userProfile.email;
      }


      await setDoc(userDocRef, profileDataToSave, { merge: true });
      
      toast({
        title: 'Профилът е актуализиран',
        description: 'Информацията за Вашия профил е успешно актуализирана.',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Грешка при актуализиране',
        description: error.message || 'Възникна грешка при запазването на промените.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="shadow-lg max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={form.watch('profilePhotoUrl') || userProfile.profilePhotoUrl} alt={userProfile.name} data-ai-hint="person avatar" />
            <AvatarFallback>
              {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : <UserCircle2 className="h-10 w-10"/>}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">Редактиране на Вашия Профил</CardTitle>
            <CardDescription>Поддържайте личната си информация и предпочитания актуални.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Пълно име</FormLabel>
                  <FormControl>
                    <Input placeholder="Вашето пълно име" {...field} />
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
                  <FormLabel>Имейл адрес</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="vashiat.email@example.com" {...field} readOnly disabled />
                  </FormControl>
                  <FormDescription>Имейлът не може да бъде променян оттук.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="profilePhotoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL на профилна снимка</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/vashata-snimka.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <h3 className="text-lg font-semibold pt-4 border-t mt-6">Предпочитания</h3>
            
            <FormField
              control={form.control}
              name="favoriteServices"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Любими услуги</FormLabel>
                  <Popover open={servicePopoverOpen} onOpenChange={setServicePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={servicePopoverOpen} className="w-full justify-between">
                        {field.value?.length ? `${field.value.length} избран${field.value.length === 1 ? 'а': 'и'} услуг${field.value.length === 1 ? 'а': 'и'}` : "Изберете услуги..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Търсене на услуги..." />
                        <CommandList>
                          <CommandEmpty>Няма намерени услуги.</CommandEmpty>
                          <CommandGroup>
                            {mockServices.map((service) => {
                              const isSelected = field.value?.includes(service.name);
                              return (
                                <CommandItem
                                  key={service.id}
                                  value={service.name}
                                  onSelect={() => {
                                    const currentServices = field.value || [];
                                    if (isSelected) {
                                      form.setValue('favoriteServices', currentServices.filter(s => s !== service.name), { shouldDirty: true, shouldValidate: true });
                                    } else {
                                      form.setValue('favoriteServices', [...currentServices, service.name], { shouldDirty: true, shouldValidate: true });
                                    }
                                  }}
                                >
                                  <Checkbox checked={isSelected} className="mr-2" />
                                  {service.name}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>Изберете Вашите предпочитани услуги.</FormDescription>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {field.value?.map(serviceName => (
                      <Badge key={serviceName} variant="secondary" className="flex items-center">
                        {serviceName}
                        <button
                          type="button"
                          aria-label={`Премахни ${serviceName}`}
                          className="ml-1.5 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          onClick={() => {
                             form.setValue('favoriteServices', (field.value || []).filter(s => s !== serviceName), { shouldDirty: true, shouldValidate: true });
                          }}
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priceRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Предпочитан ценови диапазон</FormLabel>
                   <select {...field} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <option value="">Всякакъв</option>
                      <option value="cheap">Евтино ($)</option>
                      <option value="moderate">Умерено ($$)</option>
                      <option value="expensive">Скъпо ($$$)</option>
                    </select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredLocations"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Предпочитани местоположения (Градове)</FormLabel>
                   <Popover open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={locationPopoverOpen} className="w-full justify-between">
                        {field.value?.length ? `${field.value.length} избран${field.value.length === 1 ? '' : 'и'} град${field.value.length === 1 ? '' : 'а'}` : "Изберете градове..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Търсене на градове..." />
                        <CommandList>
                          <CommandEmpty>Няма намерени градове.</CommandEmpty>
                          <CommandGroup>
                            {allBulgarianCities.map((city) => {
                              const isSelected = field.value?.includes(city);
                              return (
                                <CommandItem
                                  key={city}
                                  value={city}
                                  onSelect={() => {
                                    const currentCities = field.value || [];
                                    if (isSelected) {
                                      form.setValue('preferredLocations', currentCities.filter(c => c !== city), { shouldDirty: true, shouldValidate: true });
                                    } else {
                                      form.setValue('preferredLocations', [...currentCities, city], { shouldDirty: true, shouldValidate: true });
                                    }
                                  }}
                                >
                                  <Checkbox checked={isSelected} className="mr-2" />
                                  {city}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>Изберете градовете, които предпочитате.</FormDescription>
                   <div className="flex flex-wrap gap-1 pt-1">
                    {field.value?.map(cityName => (
                      <Badge key={cityName} variant="secondary" className="flex items-center">
                        {cityName}
                        <button
                          type="button"
                          aria-label={`Премахни ${cityName}`}
                          className="ml-1.5 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          onClick={() => {
                             form.setValue('preferredLocations', (field.value || []).filter(c => c !== cityName), { shouldDirty: true, shouldValidate: true });
                          }}
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Запазване...' : 'Запази промените'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

