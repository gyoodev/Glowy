'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from "@/hooks/use-toast";
import { UserCircle2 } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Името трябва да е поне 2 символа.'),
  email: z.string().email('Невалиден имейл адрес.'),
  profilePhotoUrl: z.string().url('Невалиден URL за профилна снимка.').optional().or(z.literal('')),
  favoriteServices: z.string().optional(),
  priceRange: z.enum(['cheap', 'moderate', 'expensive', '']).optional(),
  preferredLocations: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface UserProfileFormProps {
  userProfile: UserProfile;
}

export function UserProfileForm({ userProfile }: UserProfileFormProps) {
  const { toast } = useToast();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userProfile.name || '',
      email: userProfile.email || '',
      profilePhotoUrl: userProfile.profilePhotoUrl || '',
      favoriteServices: userProfile.preferences?.favoriteServices?.join(', ') || '',
      priceRange: userProfile.preferences?.priceRange || '',
      preferredLocations: userProfile.preferences?.preferredLocations?.join(', ') || '',
    },
  });

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    // Simulate API call
    console.log('Актуализирани данни на профила:', data);
    toast({
      title: 'Профилът е актуализиран',
      description: 'Информацията за Вашия профил е успешно актуализирана.',
    });
  };

  return (
    <Card className="shadow-lg">
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
                    <Input type="email" placeholder="vashiat.email@example.com" {...field} />
                  </FormControl>
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
                <FormItem>
                  <FormLabel>Любими услуги</FormLabel>
                  <FormControl>
                    <Input placeholder="напр. Подстригване, Маникюр, Процедура за лице" {...field} />
                  </FormControl>
                  <FormDescription>Разделете услугите със запетая.</FormDescription>
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
                <FormItem>
                  <FormLabel>Предпочитани местоположения (Градове/Квартали)</FormLabel>
                  <FormControl>
                    <Input placeholder="напр. Център, Северен квартал" {...field} />
                  </FormControl>
                   <FormDescription>Разделете местоположенията със запетая.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full sm:w-auto">Запази промените</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
