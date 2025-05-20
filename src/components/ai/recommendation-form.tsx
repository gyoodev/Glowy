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
  userPreferences: z.string().min(10, 'Моля, опишете предпочитанията си малко по-подробно.'),
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
          AI Препоръки за Салони
        </CardTitle>
        <CardDescription>
          Кажете ни какво търсите и нашият AI ще предложи най-добрите салони и услуги за Вас!
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
                  <FormLabel className="text-base">Вашите предпочитания</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="напр. 'Търся модерна прическа за дълга коса, на достъпна цена, в центъра. Харесвам ярки цветове и релаксираща атмосфера.'"
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
                  <FormLabel className="text-base">Предишни резервации (по избор)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="напр. 'Хареса ми балеажът в Шик Салон миналия май. Насладих се на маникюр в Нейл Бар.'"
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
                  <FormLabel className="text-base">Известни актуални тенденции (по избор)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="напр. 'Чух, че бретонът тип завеса е на мода. Много хора ходят в GlowUp Studio за процедури за лице.'"
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
              {isLoading ? 'Получаване на препоръки...' : 'Намери Моя Блясък'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
