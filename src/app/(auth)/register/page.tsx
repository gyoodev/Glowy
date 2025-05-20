
'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast'; 
import { UserPlus, User, Mail, KeyRound, Phone, Chrome } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const registerSchema = z.object({
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
  name: z.string().min(2, 'Името трябва да е поне 2 символа.'),
  email: z.string().email('Невалиден имейл адрес.'),
  phoneNumber: z.string().min(9, 'Телефонният номер трябва да е поне 9 символа.').regex(/^[0-9+]*$/, 'Телефонният номер може да съдържа само цифри и знак "+".'),
  password: z.string().min(6, 'Паролата трябва да е поне 6 символа.'),
  confirmPassword: z.string().min(6, 'Потвърждението на паролата трябва да е поне 6 символа.'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Паролите не съвпадат.',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    console.log('Register data:', data);
    // Here you would typically use Firebase createUserWithEmailAndPassword
    // For now, we keep the localStorage simulation for email/password
    localStorage.setItem('isUserLoggedIn', 'true');
    toast({
      title: 'Регистрацията е успешна',
      description: 'Вашият акаунт е създаден.',
    });
    router.push('/');
  };

  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('Google Sign-Up successful:', user);
      localStorage.setItem('isUserLoggedIn', 'true'); // Maintain consistency for header logic
      toast({
        title: 'Регистрация с Google успешна',
        description: `Добре дошли, ${user.displayName || user.email}! Вашият акаунт е създаден.`,
      });
      router.push('/');
    } catch (error: any) {
      console.error('Error during Google Sign-Up:', error);
      toast({
        title: 'Грешка при регистрация с Google',
        description: error.message || 'Възникна неочаквана грешка.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold flex items-center justify-center">
          <UserPlus className="mr-3 h-8 w-8 text-primary" />
          Създаване на Акаунт
        </CardTitle>
        <CardDescription>Попълнете формата, за да се регистрирате.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground" />Пълно име</FormLabel>
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
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" />Телефонен номер</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="0881234567" {...field} />
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
                  <FormLabel className="flex items-center">
                    <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />Парола
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                    </FormControl>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                      {showPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />Потвърди парола</FormLabel> 
                  <div className="relative">
                    <FormControl>
                      <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                    </FormControl>
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                      {showConfirmPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full text-lg py-6" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Регистриране...' : 'Регистрация'}
            </Button>
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-muted-foreground"></div>
              <span className="flex-shrink mx-4 text-muted-foreground text-xs">ИЛИ</span>
              <div className="flex-grow border-t border-muted-foreground"></div>
            </div>
            <Button variant="outline" className="w-full text-lg py-6" onClick={handleGoogleSignUp} type="button">
              <Chrome className="mr-2 h-5 w-5" /> Регистрация с Google
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Вече имате акаунт?{' '}
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
