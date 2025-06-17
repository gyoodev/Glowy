
'use client';

import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button'; // Use alias
import { Input } from '@/components/ui/input'; // Use alias
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'; // Use alias
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'; // Use alias
import { Checkbox } from '@/components/ui/checkbox'; // Use alias
import { useToast } from '@/hooks/use-toast'; // Use alias
import { LogIn, Mail, KeyRound, Chrome, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase'; // Use alias
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'; // Import Firestore functions

const loginSchema = z.object({
  email: z.string().email('Невалиден имейл адрес.'),
  password: z.string().min(6, 'Паролата трябва да е поне 6 символа.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = React.useState(false);
  const router = useRouter();
  const form = useForm<LoginFormValues>({

    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const firestore = getFirestore(); // Get Firestore instance
  const [rememberMe, setRememberMe] = React.useState(false);

  React.useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      form.setValue('email', savedEmail);
      setRememberMe(true);
    }
  }, [form]);

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    console.log('Login data:', data);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user; 
      console.log('Email/Password Sign-In successful:', user);
      localStorage.setItem('isUserLoggedIn', 'true');
      toast({
        title: 'Влизане успешно',
        description: 'Добре дошли отново!',
      });
      router.push('/');

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', data.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
    } catch (error: any) {
      console.error('Error during Email/Password Sign-In:', error);
      toast({
        title: 'Грешка при влизане',
        description: error.message || 'Възникна неочаквана грешка.',
        variant: 'destructive',
      });
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('Google Sign-In successful:', user); 

      if (user) {
        const userRef = doc(firestore, 'users', user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          // User document exists, update relevant information
          await setDoc(userRef, {
            displayName: user.displayName,
            name: user.displayName, // Keep name in sync
            photoURL: user.photoURL,
            lastLoginAt: Timestamp.fromDate(new Date()),
            // Avoid overwriting email, phoneNumber, role if they exist
          }, { merge: true });
        } else {
          // User document does not exist, create a new one (should ideally happen during registration, but good to have a fallback)
          // Note: This assumes a basic user structure. Adjust fields as needed.
          await setDoc(userRef, {
            userId: user.uid,
            email: user.email,
            displayName: user.displayName,
            name: user.displayName,
            photoURL: user.photoURL,
            createdAt: Timestamp.fromDate(new Date()),
            role: 'customer', // Default role for Google sign-in
          });
        }
      }
      localStorage.setItem('isUserLoggedIn', 'true'); 
      toast({
        title: 'Влизане с Google успешно',
        description: `Добре дошли, ${user.displayName || user.email}!`,
      });
      router.push('/');
    } catch (error: any) {
      console.error('Error during Google Sign-In:', error);
      toast({
        title: 'Грешка при влизане с Google',
        description: error.message || 'Възникна неочаквана грешка.',
        variant: 'destructive',
      });
    }
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
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
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
          </CardContent>
          <div className="flex items-center justify-between px-6 pb-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(!!checked)} />
              <label htmlFor="remember-me" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Запомни ме
              </label>
            </div>
          </div>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full text-lg py-6" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Влизане...' : 'Вход'}
            </Button>
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-muted-foreground"></div>
              <span className="flex-shrink mx-4 text-muted-foreground text-xs">ИЛИ</span>
              <div className="flex-grow border-t border-muted-foreground"></div>
            </div>
            <Button variant="outline" className="w-full text-lg py-6" onClick={handleGoogleSignIn} type="button">
              <Chrome className="mr-2 h-5 w-5" /> Вход с Google
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
