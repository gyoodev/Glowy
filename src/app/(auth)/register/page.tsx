
'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, KeyRound, Phone, Chrome, Eye, EyeOff } from 'lucide-react'; // Consolidated import
import { useState } from 'react';
import { collection, doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth';

// Define the schema for the registration form
const registerSchema = z.object({
 name: z.string().min(2, 'Името трябва да е поне 2 символа.'),
 email: z.string().email('Невалиден имейл адрес.'),
 phoneNumber: z.string().min(9, 'Телефонният номер трябва да е поне 9 символа.').regex(/^[0-9+]*$/, 'Телефонният номер може да съдържа само цифри и знак "+".'),
 password: z.string().min(6, 'Паролата трябва да е поне 6 символа.'),
 profileType: z.enum(['customer', 'business']),
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
      profileType: 'customer', // Default to customer
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const firestore = getFirestore();

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      if (user) {
        // Add user details to Firestore
        const userRef = doc(collection(firestore, 'users'), user.uid);
        await setDoc(userRef, {
          email: user.email,
          displayName: data.name,
          phoneNumber: data.phoneNumber,
          createdAt: new Date(),
          profileType: data.profileType,
        });
        
        localStorage.setItem('isUserLoggedIn', 'true'); 
        toast({
          title: 'Регистрацията е успешна',
          description: 'Вашият акаунт е създаден.',
        });
        router.push('/');
      }
    } catch (error: any) {
      console.error("Error during registration:", error);
      toast({
        title: 'Регистрацията неуспешна',
        description: error.message || 'Възникна грешка при регистрацията.',
        variant: 'destructive',
      });
    }
  };

  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('Google Sign-Up successful:', user);

      if (user) {
        // Check if user already exists in Firestore, add if not
        const userRef = doc(collection(firestore, 'users'), user.uid);
        const docSnap = await getDoc(userRef);

        if (!docSnap.exists()) {
          await setDoc(userRef, {
            email: user.email,
            displayName: user.displayName,
            phoneNumber: user.phoneNumber || '', // Google might not provide phone number directly
            createdAt: new Date(),
            profileType: 'customer', // Default to customer for Google sign-ups for now
          });
        }
        localStorage.setItem('isUserLoggedIn', 'true');
        toast({
          title: 'Регистрация с Google успешна',
          description: `Добре дошли, ${user.displayName || user.email}!`,
        });
        router.push('/');
      }
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
    <Card className="w-full max-w-md shadow-lg rounded-lg">
      <CardHeader className="text-center pb-4">
        <CardDescription className="text-muted-foreground mb-4">
          Присъединете се към Glowy и се насладете на тези предимства:
          <ul className="list-disc list-inside text-left mt-2 text-sm">
            <li>Лесно запазване на часове в любимите Ви салони.</li>
            <li>Достъп до ексклузивни оферти и промоции.</li>
            <li>Персонализирани препоръки за салони и услуги.</li>
            <li>Удобно управление на Вашите резервации.</li>
          </ul>
        </CardDescription>
        <CardTitle className="text-3xl font-bold flex items-center justify-center">
          <UserPlus className="mr-3 h-8 w-8 text-primary" />
          Създаване на Акаунт
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-6">
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
                  <FormLabel>Имейл</FormLabel>
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
                  <FormLabel>Телефонен номер</FormLabel>
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
                  <FormLabel>Парола</FormLabel>
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
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Потвърдете паролата</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} />
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
            <FormField
              control={form.control}
              name="profileType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип профил</FormLabel>
                  <FormControl>
                    <select {...field} className="block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-foreground">
                      <option value="customer">Клиент</option>
                      <option value="business">Бизнес</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
           </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Регистриране...' : 'Регистрация'}
            </Button>
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-muted-foreground"></div>
              <span className="flex-shrink mx-4 text-muted-foreground text-xs">ИЛИ</span>
              <div className="flex-grow border-t border-muted-foreground"></div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignUp} type="button">
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

    