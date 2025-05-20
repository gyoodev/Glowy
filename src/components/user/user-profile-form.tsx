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
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  profilePhotoUrl: z.string().url('Invalid URL for profile photo.').optional().or(z.literal('')),
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
    console.log('Updated profile data:', data);
    toast({
      title: 'Profile Updated',
      description: 'Your profile information has been successfully updated.',
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
            <CardTitle className="text-2xl">Edit Your Profile</CardTitle>
            <CardDescription>Keep your personal information and preferences up to date.</CardDescription>
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
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
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
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your.email@example.com" {...field} />
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
                  <FormLabel>Profile Photo URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/your-photo.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <h3 className="text-lg font-semibold pt-4 border-t mt-6">Preferences</h3>
            <FormField
              control={form.control}
              name="favoriteServices"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Favorite Services</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Haircut, Manicure, Facial" {...field} />
                  </FormControl>
                  <FormDescription>Separate services with a comma.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priceRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Price Range</FormLabel>
                   <select {...field} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <option value="">Any</option>
                      <option value="cheap">Cheap ($)</option>
                      <option value="moderate">Moderate ($$)</option>
                      <option value="expensive">Expensive ($$$)</option>
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
                  <FormLabel>Preferred Locations (Cities/Neighborhoods)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Downtown, North End" {...field} />
                  </FormControl>
                   <FormDescription>Separate locations with a comma.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full sm:w-auto">Save Changes</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
