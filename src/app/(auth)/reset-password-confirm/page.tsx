
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';

const passwordResetSchema = z.object({
  password: z.string().min(6, 'Паролата трябва да е поне 6 символа.'),
  confirmPassword: z.string().min(6, 'Потвърждението на паролата трябва да е поне 6 символа.'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Паролите не съвпадат.',
  path: ['confirmPassword'],
});

type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;

export default function ResetPasswordConfirmPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const oobCode = searchParams ? searchParams.get('oobCode') : null;

  useEffect(() => {
    if (!oobCode) {
      setError('Липсва код за нулиране на паролата. Моля, използвайте линка от имейла си отново.');
      setIsLoading(false);
      return;
    }

    const verifyCode = async () => {
      try {
        await verifyPasswordResetCode(auth, oobCode);
        setIsLoading(false);
      } catch (e: any) {
        let errorMessage = 'Невалиден или изтекъл код. Моля, заявете ново нулиране на парола.';
        if (e.code === 'auth/invalid-action-code') {
          errorMessage = 'Кодът за нулиране е невалиден или вече е използван. Моля, заявете нов.';
        }
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  const form = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit: SubmitHandler<PasswordResetFormValues> = async (data) => {
    if (!oobCode) return;
    setIsSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, data.password);
      setSuccess(true);
      toast({
        title: 'Паролата е променена успешно!',
        description: 'Вече можете да влезете с новата си парола.',
      });
    } catch (e: any) {
      let errorMessage = 'Възникна грешка при смяната на паролата.';
      if (e.code === 'auth/invalid-action-code') {
        errorMessage = 'Кодът е изтекъл или невалиден. Моля, заявете нова смяна на парола.';
      }
      toast({
        title: 'Грешка',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-center text-muted-foreground">Проверка на кода...</p>;
    }

    if (error) {
      return (
        <div className="text-center text-destructive">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
          <p>{error}</p>
        </div>
      );
    }

    if (success) {
      return (
        <div className="text-center text-green-600">
          <CheckCircle className="mx-auto h-8 w-8 mb-2" />
          <p>Паролата Ви е променена успешно!</p>
          <Button asChild className="mt-4">
            <Link href="/login">Към страницата за вход</Link>
          </Button>
        </div>
      );
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />Нова парола</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />Потвърдете новата парола</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" {...field} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Смяна...' : 'Смени паролата'}
          </Button>
        </form>
      </Form>
    );
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold flex items-center justify-center">
          <KeyRound className="mr-3 h-8 w-8 text-primary" />
          Въведете Нова Парола
        </CardTitle>
        {!isLoading && !error && !success && (
           <CardDescription>Моля, въведете Вашата нова парола по-долу.</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
       <CardFooter className="flex flex-col gap-4">
            <div className="text-center text-sm text-muted-foreground">
              Върни се към{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Вход
              </Link>
            </div>
        </CardFooter>
    </Card>
  );
}
