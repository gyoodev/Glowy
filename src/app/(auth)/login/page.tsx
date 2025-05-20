
'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Mail, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('Невалиден имейл адрес.'),
  password: z.string().min(6, 'Паролата трябва да е поне 6 символа.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    console.log('Login data:', data);
    // Simulate successful login
    localStorage.setItem('isUserLoggedIn', 'true');
    toast({
      title: 'Влизане успешно',
      description: 'Добре дошли отново!',
    });
    // Redirect to home page or dashboard
    router.push('/'); 
    // Optionally, force a reload if header doesn't update automatically due to SPA behavior
    // window.location.href = '/'; 
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold flex items-center justify-center">
          <LogIn className="mr-3 h-8 w-8 text-primary" />
          Вход в Профила
        </CardTitle>
        <CardDescription>Въведете Вашите данни, за да влезете.</CardDescription>
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />Парола</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full text-lg py-6" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Влизане...' : 'Вход'}
            </Button>
            <div className="text-center text-sm">
              <p className="text-muted-foreground">
                Нямате акаунт?{' '}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Регистрирайте се
                </Link>
              </p>
              <p className="mt-2 text-muted-foreground">
                <Link href="/reset-password" className="text-xs text-primary hover:underline">
                  Забравена парола?
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
