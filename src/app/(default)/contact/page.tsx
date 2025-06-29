
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { firestore as db } from '@/lib/firebase'; // Import initialized Firestore instance
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, User, MessageSquare, Send } from 'lucide-react';

const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Името трябва да е поне 2 символа." }),
  email: z.string().email({ message: "Моля, въведете валиден имейл адрес." }),
  subject: z.string().min(5, { message: "Темата трябва да е поне 5 символа." }).optional(),
  message: z.string().min(10, { message: "Съобщението трябва да е поне 10 символа." }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  // Hooks and state
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  // Form submission handler
  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'contacts'), { // Use the imported db instance
        ...data,
        createdAt: Timestamp.fromDate(new Date()),
        isAnswered: false,
      });
      toast({
        title: 'Запитването е изпратено!',
        description: 'Благодарим Ви, че се свързахте с нас. Ще отговорим възможно най-скоро.',
      });
      form.reset();

      // Send email notification to admin
      try {
        const response = await fetch('/api/send-email/contact-form-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          console.error('Failed to send contact form email notification', response.statusText);
        }
      } catch (emailError) {
        console.error('Error sending contact form email notification:', emailError);
      }

    } catch (error) {
      console.error("Error sending contact message:", error);
      toast({
        title: 'Грешка при изпращане',
        description: 'Възникна грешка при изпращането на Вашето запитване. Моля, опитайте отново.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the contact form
  return (
    <div className="container mx-auto py-10 px-6 space-y-10">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center">
            <Mail className="mr-3 h-8 w-8 text-primary" />
            Свържете се с нас
          </h1>
          <CardDescription>
            Имате въпроси или предложения? Попълнете формата по-долу и ние ще се свържем с Вас.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground" />Вашето име</FormLabel>
                    <FormControl>
                      <Input placeholder="Въведете Вашето име" {...field} />
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
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />Тема (по избор)</FormLabel>
                    <FormControl>
                      <Input placeholder="Относно..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />Вашето съобщение</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Напишете Вашето запитване тук..." rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full text-lg py-3" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Send className="mr-2 h-4 w-4 animate-pulse" />
                    Изпращане...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Изпрати запитването
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Static Business Information Section */}
      <section className="max-w-2xl mx-auto text-center space-y-4">
        <h2 className="text-2xl font-semibold">Намерете ни</h2>
        <address className="not-italic text-muted-foreground">
          <p>Вашият Адрес Тук</p>
          <p>Вашият Град, Вашият Пощенски Код</p>
          <p>Вашата Държава</p>
        </address>
        <p className="text-muted-foreground">Телефон: <a href="tel:+YOUR_PHONE_NUMBER">+ВАШИЯТ ТЕЛЕФОНЕН НОМЕР</a></p>
        <p className="text-muted-foreground">Имейл: <a href="mailto:YOUR_EMAIL_ADDRESS">ВАШИЯТ ИМЕЙЛ АДРЕС</a></p>
        {/* You can add a map embed here if you have one */}
      </section>
    </div>
  );
}
