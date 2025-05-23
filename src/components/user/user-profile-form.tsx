
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
import { UserCircle2, X, Sparkles, MapPin, Tag, Heart } from 'lucide-react'; // Added icons
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { mockServices, allBulgarianCities } from '@/lib/mock-data'; 
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase'; 
import { getFirestore, doc, setDoc } from 'firebase/firestore'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const profileSchema = z.object({
  name: z.string().min(2, 'Името трябва да е поне 2 символа.'),
  email: z.string().email('Невалиден имейл адрес.'),
  favoriteServices: z.array(z.string()).optional(),
  priceRange: z.enum(['cheap', 'moderate', 'expensive', '']).optional(),
  preferredLocations: z.array(z.string()).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface UserProfileFormProps {
  userProfile: UserProfile;
}

export function UserProfileForm({ userProfile }: UserProfileFormProps) {
  const { toast } = useToast();
  const [servicePopoverOpen, setServicePopoverOpen] = useState(false);
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const firestore = getFirestore();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userProfile.displayName || userProfile.name || '',
      email: userProfile.email || '',
      favoriteServices: userProfile.preferences?.favoriteServices || [],
      priceRange: userProfile.preferences?.priceRange || '',
      preferredLocations: userProfile.preferences?.preferredLocations || [],
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        name: userProfile.displayName || userProfile.name || '',
        email: userProfile.email || '',
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
      const profileDataToSave: Partial<UserProfile> = { // Use Partial<UserProfile> for flexibility
        userId: auth.currentUser.uid,
        displayName: data.name,
        name: data.name, // Also save to 'name' if that's what you primarily use
        preferences: {
          favoriteServices: data.favoriteServices || [],
          priceRange: data.priceRange || '', 
          preferredLocations: data.preferredLocations || [],
        },
        lastUpdatedAt: new Date(), 
      };

      if (userProfile.email) {
        (profileDataToSave as any).email = userProfile.email;
      }
      if (userProfile.role) {
        (profileDataToSave as any).role = userProfile.role;
      }
       if (userProfile.profilePhotoUrl) {
        (profileDataToSave as any).profilePhotoUrl = userProfile.profilePhotoUrl;
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
    <Card className="shadow-lg max-w-2xl mx-auto border-border/50">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader className="border-b border-border/30 pb-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20 border-2 border-primary/50">
                <AvatarImage src={userProfile.profilePhotoUrl} alt={userProfile.name} data-ai-hint="person avatar" />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : <UserCircle2 className="h-10 w-10"/>}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl md:text-2xl text-foreground">Редактиране на Вашия Профил</CardTitle>
                <CardDescription className="text-muted-foreground">Поддържайте личната си информация и предпочитания актуални.</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-8">
            <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <UserCircle2 className="mr-2 h-5 w-5 text-primary" />
                    Лична информация
                </h3>
                <div className="space-y-4">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Вашите имена</FormLabel>
                        <FormControl>
                            <Input placeholder="Вашето пълно име" {...field} className="text-base"/>
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
                            <Input type="email" placeholder="vashiat.email@example.com" {...field} readOnly disabled className="text-base bg-muted/50 cursor-not-allowed"/>
                        </FormControl>
                        <FormDescription>Имейлът не може да бъде променян оттук.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
            </div>

            <div className="border-t border-border/30 pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <Sparkles className="mr-2 h-5 w-5 text-primary" />
                    Предпочитания
                </h3>
                <div className="space-y-6">
                <FormField
                    control={form.control}
                    name="favoriteServices"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel className="flex items-center"><Heart className="mr-2 h-4 w-4 text-muted-foreground" />Любими услуги</FormLabel>
                        <Popover open={servicePopoverOpen} onOpenChange={setServicePopoverOpen}>
                            <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={servicePopoverOpen} className="w-full justify-between text-base">
                                {field.value?.length ? `${field.value.length} избран${field.value.length === 1 ? 'а': 'и'} услуг${field.value.length === 1 ? 'а': 'и'}` : "Изберете услуги..."}
                                <UserCircle2 className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                        <FormDescription>Изберете Вашите предпочитани типове услуги.</FormDescription>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {field.value?.map(serviceName => (
                            <Badge key={serviceName} variant="secondary" className="flex items-center text-sm py-1 px-2.5 rounded-md">
                                {serviceName}
                                <button
                                type="button"
                                aria-label={`Премахни ${serviceName}`}
                                className="ml-1.5 rounded-full outline-none ring-offset-background focus:ring-1 focus:ring-ring focus:ring-offset-1"
                                onClick={() => {
                                    form.setValue('favoriteServices', (field.value || []).filter(s => s !== serviceName), { shouldDirty: true, shouldValidate: true });
                                }}
                                >
                                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
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
                        <FormLabel className="flex items-center"><Tag className="mr-2 h-4 w-4 text-muted-foreground" />Предпочитан ценови диапазон</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                                <SelectTrigger className="text-base">
                                <SelectValue placeholder="Изберете ценови диапазон" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="">Всякакъв</SelectItem>
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
                    name="preferredLocations"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" />Предпочитани местоположения (Градове)</FormLabel>
                        <Popover open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
                            <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={locationPopoverOpen} className="w-full justify-between text-base">
                                {field.value?.length ? `${field.value.length} избран${field.value.length === 1 ? '' : 'и'} град${field.value.length === 1 ? '' : 'а'}` : "Изберете градове..."}
                                <UserCircle2 className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                        <FormDescription>Изберете градовете, които предпочитате за услуги.</FormDescription>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {field.value?.map(cityName => (
                            <Badge key={cityName} variant="secondary" className="flex items-center text-sm py-1 px-2.5 rounded-md">
                                {cityName}
                                <button
                                type="button"
                                aria-label={`Премахни ${cityName}`}
                                className="ml-1.5 rounded-full outline-none ring-offset-background focus:ring-1 focus:ring-ring focus:ring-offset-1"
                                onClick={() => {
                                    form.setValue('preferredLocations', (field.value || []).filter(c => c !== cityName), { shouldDirty: true, shouldValidate: true });
                                }}
                                >
                                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                                </button>
                            </Badge>
                            ))}
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/30 p-6">
            <Button type="submit" className="w-full sm:w-auto text-lg py-3" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Запазване...' : 'Запази промените'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
