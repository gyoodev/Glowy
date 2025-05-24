
'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox'; // Added Checkbox import
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { UserPlus, Mail, KeyRound, Phone, Chrome, Eye, EyeOff } from 'lucide-react';

import { auth, subscribeToNewsletter } from '@/lib/firebase'; // Added subscribeToNewsletter
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

const registerSchema = z.object({
  name: z.string().min(2, 'Името трябва да е поне 2 символа.'),
  email: z.string().email('Невалиден имейл адрес.'),
  phoneNumber: z.string().min(9, 'Телефонният номер трябва да е поне 9 символа.').regex(/^[0-9+]*$/, 'Телефонният номер може да съдържа само цифри и знак "+".'),
  password: z.string().min(6, 'Паролата трябва да е поне 6 символа.'),
  profileType: z.enum(['customer', 'business']),
  confirmPassword: z.string().min(6, 'Потвърждението на паролата трябва да е поне 6 символа.'),
  subscribeNewsletter: z.boolean().optional(), // Added newsletter field
}).refine(data => data.password === data.confirmPassword, {
  message: 'Паролите не съвпадат.',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = getFirestore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      profileType: 'customer',
      subscribeNewsletter: true, // Default to checked
    },
  });

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      let numericIdForUser: number | undefined = undefined;
      try {
        const counterDocRef = doc(firestore, 'counters', 'users');
        const counterDocSnap = await getDoc(counterDocRef);
        if (counterDocSnap.exists()) {
          numericIdForUser = (counterDocSnap.data()?.count || 0) + 1;
        } else {
          numericIdForUser = 1;
        }
        await setDoc(counterDocRef, { count: numericIdForUser }, { merge: true });
      } catch (counterError) {
         console.error("Error updating user counter:", counterError);
      }

      if (user) {
        const userRef = doc(collection(firestore, 'users'), user.uid);
        await setDoc(userRef, {
          userId: user.uid,
          email: user.email,
          displayName: data.name,
          numericId: numericIdForUser,
          phoneNumber: data.phoneNumber,
          createdAt: Timestamp.fromDate(new Date()),
          role: data.profileType === 'business' ? 'business' : 'customer', // Ensure correct role string
        });

        if (data.subscribeNewsletter && user.email) {
          const newsletterResult = await subscribeToNewsletter(user.email);
          if (newsletterResult.success) {
            toast({ title: 'Абонамент за бюлетин', description: newsletterResult.message });
          } else {
            // Optionally inform user if already subscribed or error during newsletter subscription
             toast({ title: 'Абонамент за бюлетин', description: newsletterResult.message, variant: newsletterResult.message.includes("вече е абониран") ? "default" : "destructive" });
          }
        }

        localStorage.setItem('isUserLoggedIn', 'true');
        toast({
          title: 'Регистрацията е успешна',
          description: 'Вашият акаунт е създаден.',
        });
        router.push('/');
      }
    } catch (error: any) {
      console.error("Error during registration:", error);
      if (error.code === 'auth/email-already-in-use') {
        toast({
          title: 'Регистрацията неуспешна',
          description: 'Този имейл адрес вече се използва. Моля, използвайте друг имейл или влезте в съществуващия си профил.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Регистрацията неуспешна',
          description: error.message || 'Възникна грешка при регистрацията.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsSubmitting(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('Google Sign-Up successful:', user);

      if (user) {
        const userRef = doc(collection(firestore, 'users'), user.uid);
        const docSnap = await getDoc(userRef);

        if (!docSnap.exists()) {
          let numericIdForUser: number | undefined = undefined;
          try {
            const counterDocRef = doc(firestore, 'counters', 'users');
            const counterDocSnap = await getDoc(counterDocRef);
            if (counterDocSnap.exists()) {
              numericIdForUser = (counterDocSnap.data()?.count || 0) + 1;
            } else {
              numericIdForUser = 1;
            }
            await setDoc(counterDocRef, { count: numericIdForUser }, { merge: true });
          } catch (counterError) {
            console.error("Error updating user counter for Google sign-up:", counterError);
          }

          await setDoc(userRef, {
            userId: user.uid,
            email: user.email,
            numericId: numericIdForUser,
            displayName: user.displayName,
            phoneNumber: user.phoneNumber || '',
            createdAt: Timestamp.fromDate(new Date()),
            role: 'customer', 
          });
        }
        
        // For Google Sign-Up, we assume they consent to newsletter if it's a new user
        // You might want to ask explicitly later or have a separate preference.
        // For simplicity here, if user.email exists and subscribeNewsletter is checked in form (or default)
        if (user.email && form.getValues('subscribeNewsletter')) {
            const newsletterResult = await subscribeToNewsletter(user.email);
             if (newsletterResult.success) {
                toast({ title: 'Абонамент за бюлетин', description: newsletterResult.message });
            } else if (!newsletterResult.message.includes("вече е абониран")) { // Don't show error if already subscribed
                toast({ title: 'Абонамент за бюлетин', description: newsletterResult.message, variant: "destructive" });
            }
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl rounded-lg p-6 md:p-8">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
          <UserPlus className="h-8 w-8 text-primary" />
          Създаване на Акаунт
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm md:text-base">
          <span className="block mb-2">
            Присъединете се към Glowy и се насладете на предимствата:
          </span>
          <ul className="list-disc list-inside text-left text-sm">
            <li>Лесно запазване на часове в любимите Ви салони.</li>
            <li>Достъп до ексклузивни оферти и промоции.</li>
            <li>Персонализирани препоръки за салони и услуги.</li>
            <li>Удобно управление на Вашите резервации.</li>
          </ul>
        </CardDescription>
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
                    <Input placeholder="Въведете Вашето пълно име" {...field} disabled={isSubmitting} />
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
                    <Input type="email" placeholder="vashiat.email@primer.com" {...field} disabled={isSubmitting} />
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
                    <Input type="tel" placeholder="+359 881 234 567" {...field} disabled={isSubmitting} />
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
                      <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} disabled={isSubmitting} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent"
                        onClick={() => setShowPassword((prev) => !prev)}
                        disabled={isSubmitting}
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
                      <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} disabled={isSubmitting} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        disabled={isSubmitting}
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
                <FormItem className="space-y-3">
                  <FormLabel>Тип профил</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                      disabled={isSubmitting}
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="customer" id="profileTypeCustomer" disabled={isSubmitting} />
                        </FormControl>
                        <FormLabel htmlFor="profileTypeCustomer" className={cn("font-normal", isSubmitting && "opacity-50")}>
                          Клиент
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="business" id="profileTypeBusiness" disabled={isSubmitting} />
                        </FormControl>
                        <FormLabel htmlFor="profileTypeBusiness" className={cn("font-normal", isSubmitting && "opacity-50")}>
                          Бизнес
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subscribeNewsletter"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className={cn("font-normal", isSubmitting && "opacity-50")}>
                      Абонирай се за нашия бюлетин
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
           </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting || form.formState.isSubmitting}>
              {isSubmitting || form.formState.isSubmitting ? 'Регистриране...' : 'Регистрация'}
            </Button>
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-muted-foreground"></div>
              <span className="flex-shrink mx-4 text-muted-foreground text-xs">ИЛИ</span>
              <div className="flex-grow border-t border-muted-foreground"></div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignUp} type="button" disabled={isSubmitting}>
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
