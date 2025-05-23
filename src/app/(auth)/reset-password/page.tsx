
'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { KeySquare, Mail } from 'lucide-react';
import Link from 'next/link';

const resetPasswordSchema = z.object({
  email: z.string().email('Невалиден имейл адрес.'),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit: SubmitHandler<ResetPasswordFormValues> = async (data) => {
    console.log('Reset password data:', data);
    toast({
      title: 'Заявка за нулиране е изпратена',
      description: 'Ако съществува акаунт с този имейл, ще получите инструкции за нулиране.',
    });
     // Here you would typically handle the reset logic
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold flex items-center justify-center">
          <KeySquare className="mr-3 h-8 w-8 text-primary" />
          Нулиране на Парола
        </CardTitle>
        <CardDescription>Въведете Вашия имейл, за да получите инструкции за нулиране на паролата.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Имейл адрес</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="vashiat.email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full text-lg py-6" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Изпращане...' : 'Изпрати инструкции'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Спомнихте си паролата?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Влезте
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
