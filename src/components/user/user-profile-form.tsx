
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
import { UserCircle2, X, Sparkles, MapPin, Tag, Heart, MailCheck, Loader2, Phone, KeyRound } from 'lucide-react'; // Added KeyRound icon
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { mockServices, allBulgarianCities } from '@/lib/mock-data';
import { useState, useEffect } from 'react';
import { auth, subscribeToNewsletter } from '@/lib/firebase'; // Added subscribeToNewsletter
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { updatePassword, type User as FirebaseUser } from 'firebase/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ANY_PRICE_FORM_VALUE = "any";

const profileSchema = z.object({
  name: z.string().min(2, 'Името трябва да е поне 2 символа.'),
  email: z.string().email('Невалиден имейл адрес.'),
  phoneNumber: z.string().regex(/^\+359[0-9]{9}$/, 'Невалиден български телефонен номер. Трябва да е във формат +359xxxxxxxxx (9 цифри след +359).').optional().or(z.literal('')),
  favoriteServices: z.array(z.string()).optional(),
  priceRange: z.enum(['cheap', 'moderate', 'expensive', ANY_PRICE_FORM_VALUE]).optional(),
  preferredLocations: z.array(z.string()).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface UserProfileFormProps {
  userProfile: UserProfile;
  newsletterSubscriptionStatus?: boolean | null;
  onNewsletterSubscriptionChange?: () => void; // New prop to refresh status
}

export function UserProfileForm({ userProfile, newsletterSubscriptionStatus, onNewsletterSubscriptionChange }: UserProfileFormProps) {
  const { toast } = useToast();
  const [servicePopoverOpen, setServicePopoverOpen] = useState(false);
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const [isSubscribingToNewsletter, setIsSubscribingToNewsletter] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordPopoverOpen, setIsPasswordPopoverOpen] = useState(false);

  const firestore = getFirestore();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userProfile.displayName || userProfile.name || '',
      email: userProfile.email || '',
      phoneNumber: userProfile.phoneNumber || '',
      favoriteServices: userProfile.preferences?.favoriteServices || [],
      priceRange: (userProfile.preferences?.priceRange === '' || userProfile.preferences?.priceRange === undefined) ? ANY_PRICE_FORM_VALUE : userProfile.preferences?.priceRange,
      preferredLocations: userProfile.preferences?.preferredLocations || [],
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        name: userProfile.displayName || userProfile.name || '',
        email: userProfile.email || '',
        phoneNumber: userProfile.phoneNumber || '',
        favoriteServices: userProfile.preferences?.favoriteServices || [],
        priceRange: (userProfile.preferences?.priceRange === '' || userProfile.preferences?.priceRange === undefined) ? ANY_PRICE_FORM_VALUE : userProfile.preferences?.priceRange,
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
      const profileDataToSave: Partial<UserProfile> & { userId: string } = {
        userId: auth.currentUser.uid, // Ensure userId is always set
        name: data.name,
        displayName: data.name, // Keep displayName in sync with name
        email: data.email, // Email is read-only but include it
        phoneNumber: data.phoneNumber || '',
        preferences: {
          favoriteServices: data.favoriteServices || [],
          priceRange: data.priceRange === ANY_PRICE_FORM_VALUE ? '' : data.priceRange,
          preferredLocations: data.preferredLocations || [],
        },
        lastUpdatedAt: new Date().toISOString(), // Corrected: Convert Date to ISO string
      };

      // Preserve existing fields not in the form
      if (userProfile.role) {
        profileDataToSave.role = userProfile.role;
      }
      if (userProfile.profilePhotoUrl) {
        profileDataToSave.profilePhotoUrl = userProfile.profilePhotoUrl;
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

  const handleSubscribeToNewsletter = async () => {
    if (!userProfile.email) {
      toast({ title: 'Липсва имейл', description: 'Не може да се абонирате без имейл адрес.', variant: 'destructive' });
      return;
    }
    setIsSubscribingToNewsletter(true);
    const result = await subscribeToNewsletter(userProfile.email);
    if (result.success) {
      toast({
        title: 'Абонаментът е успешен!',
        description: result.message,
      });
      if (onNewsletterSubscriptionChange) {
        onNewsletterSubscriptionChange(); // Notify parent to refresh status
      }
    } else {
      toast({
        title: 'Грешка при абониране',
        description: result.message,
        variant: result.message.includes("вече е абониран") ? "default" : "destructive",
      });
    }
    setIsSubscribingToNewsletter(false);
  };
  
  const handlePasswordChange = async () => {
      setPasswordError('');
      if (newPassword.length < 6) {
          setPasswordError('Паролата трябва да е поне 6 символа.');
          return;
      }
      if (newPassword !== confirmPassword) {
          setPasswordError('Паролите не съвпадат.');
          return;
      }
      const user = auth.currentUser;
      if (!user) {
          toast({ title: 'Грешка', description: 'Потребителят не е удостоверен.', variant: 'destructive' });
          return;
      }

      setIsChangingPassword(true);
      try {
          await updatePassword(user, newPassword);
          toast({ title: 'Успех!', description: 'Паролата Ви е променена успешно.' });
          setNewPassword('');
          setConfirmPassword('');
          setIsPasswordPopoverOpen(false);
      } catch (error: any) {
          console.error("Error updating password:", error);
          let errorMessage = 'Възникна грешка при смяна на паролата.';
          if (error.code === 'auth/requires-recent-login') {
              errorMessage = 'Тази операция изисква скорошно влизане. Моля, излезте и влезте отново, преди да смените паролата.';
          }
          toast({ title: 'Грешка при смяна на парола', description: errorMessage, variant: 'destructive' });
      } finally {
          setIsChangingPassword(false);
      }
  };

  return (
    <Card className="shadow-lg max-w-2xl mx-auto border-border/50">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader className="border-b border-border/30 pb-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20 border-2 border-primary/50">
                <AvatarImage src={userProfile.profilePhotoUrl} alt={userProfile.name || 'User Avatar'} data-ai-hint="person avatar" />
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
                     <FormField
                      control={form.control}
                      name="phoneNumber"
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
                           <FormDescription>Формат: +359xxxxxxxxx</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormItem>
                        <FormLabel>Парола</FormLabel>
                         <Popover open={isPasswordPopoverOpen} onOpenChange={setIsPasswordPopoverOpen}>
                            <PopoverTrigger asChild>
                               <Button variant="outline" type="button">
                                  <KeyRound className="mr-2 h-4 w-4" />
                                  Смяна на парола
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Смяна на парола</h4>
                                    <p className="text-sm text-muted-foreground">
                                    Въведете нова парола за Вашия акаунт.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="new-password">Нова парола</Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="col-span-2 h-8"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="confirm-password">Потвърди</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="col-span-2 h-8"
                                        />
                                    </div>
                                     {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                                </div>
                                <Button onClick={handlePasswordChange} disabled={isChangingPassword}>
                                     {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                     Запази новата парола
                                </Button>
                                </div>
                            </PopoverContent>
                         </Popover>
                    </FormItem>
                     {/* Display Newsletter Subscription Status */}
                     <FormItem className="pt-2">
                        <FormLabel className="flex items-center">
                            <MailCheck className="mr-2 h-4 w-4 text-muted-foreground" />
                            Абонамент за бюлетин
                        </FormLabel>
                        {newsletterSubscriptionStatus === null ? (
                            <p className="text-sm text-muted-foreground pt-1">Зареждане на статус...</p>
                        ) : newsletterSubscriptionStatus ? (
                            <p className="text-sm text-foreground pt-1">Да, абонирани сте.</p>
                        ) : (
                            <div className="pt-1">
                                <p className="text-sm text-foreground mb-2">Не, не сте абонирани.</p>
                                <Button
                                    type="button"
                                    onClick={handleSubscribeToNewsletter}
                                    variant="outline"
                                    size="sm"
                                    disabled={isSubscribingToNewsletter || !userProfile.email}
                                >
                                    {isSubscribingToNewsletter && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Абонирай ме за бюлетина
                                </Button>
                            </div>
                        )}
                        <FormDescription>
                          {newsletterSubscriptionStatus ? 'Получавате нашите последни новини и оферти.' : 'Можете да се абонирате и от футъра на сайта или при регистрация.'}
                        </FormDescription>
                      </FormItem>
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
                                <Sparkles className="ml-2 h-4 w-4 shrink-0 opacity-50" /> {/* Changed icon for consistency */}
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
                        <Select onValueChange={field.onChange} value={field.value || ANY_PRICE_FORM_VALUE}>
                            <FormControl>
                                <SelectTrigger className="text-base">
                                <SelectValue placeholder="Изберете ценови диапазон" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value={ANY_PRICE_FORM_VALUE}>Всякакъв</SelectItem>
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
                                <MapPin className="ml-2 h-4 w-4 shrink-0 opacity-50" /> {/* Changed icon for consistency */}
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

