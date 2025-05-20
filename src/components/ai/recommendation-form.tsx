'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

const recommendationSchema = z.object({
  userPreferences: z.string().min(10, 'Please describe your preferences in a bit more detail.'),
  pastBookings: z.string().optional(),
  trendingChoices: z.string().optional(),
});

type RecommendationFormValues = z.infer<typeof recommendationSchema>;

interface RecommendationFormProps {
  onSubmit: (data: RecommendationFormValues) => Promise<void>;
  isLoading: boolean;
}

export function RecommendationForm({ onSubmit, isLoading }: RecommendationFormProps) {
  const form = useForm<RecommendationFormValues>({
    resolver: zodResolver(recommendationSchema),
    defaultValues: {
      userPreferences: '',
      pastBookings: '',
      trendingChoices: '',
    },
  });

  const handleSubmit: SubmitHandler<RecommendationFormValues> = async (data) => {
    await onSubmit(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <Lightbulb className="mr-2 h-6 w-6 text-primary" />
          AI Salon Recommender
        </CardTitle>
        <CardDescription>
          Tell us what you're looking for, and our AI will suggest the best salons and services for you!
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="userPreferences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Your Preferences</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'I'm looking for a trendy haircut for long hair, budget-friendly, in downtown. I love vibrant colors and a relaxing atmosphere.'"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pastBookings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Past Bookings (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'Loved the balayage at Chic Salon last May. Enjoyed a manicure at The Nail Bar.'"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="trendingChoices"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Known Trending Choices (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'Heard that curtain bangs are in. Many people are going to GlowUp Studio for facials.'"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
              {isLoading ? 'Getting Recommendations...' : 'Find My Glow'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
