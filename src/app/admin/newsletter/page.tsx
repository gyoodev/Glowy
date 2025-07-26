
'use client';

import React, { useState, useEffect } from 'react';
import { getNewsletterSubscribers } from '@/lib/firebase';
import type { NewsletterSubscriber } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import { Newspaper, Send, Loader2, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface EmailFormData {
  subject: string;
  message: string;
}

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailForm, setEmailForm] = useState<EmailFormData>({ subject: '', message: '' });
  const { toast } = useToast();

  useEffect(() => {
    const fetchSubscribers = async () => {
      setIsLoadingSubscribers(true);
      try {
        const fetchedSubscribers = await getNewsletterSubscribers();
        setSubscribers(fetchedSubscribers);
      } catch (error) {
        console.error("Error fetching subscribers:", error);
        toast({
          title: "Грешка",
          description: "Неуспешно зареждане на абонатите.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingSubscribers(false);
      }
    };
    fetchSubscribers();
  }, [toast]);

  const handleEmailFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEmailForm({ ...emailForm, [e.target.name]: e.target.value });
  };

  const handleSendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!emailForm.subject || !emailForm.message) {
      toast({ title: 'Грешка', description: 'Моля, попълнете тема и съобщение.', variant: 'destructive' });
      return;
    }
    if (subscribers.length === 0) {
      toast({ title: 'Няма абонати', description: 'Няма абонати, до които да изпратите имейл.', variant: 'default' });
      return;
    }

    setIsSendingEmail(true);

    try {
      const response = await fetch('/api/send-email/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Възникна грешка при изпращането.');
      }

      toast({
        title: 'Имейлът е изпратен успешно!',
        description: `Съобщението е изпратено до ${result.sentCount} абонат${result.sentCount === 1 ? '' : 'и'}.`,
      });
      setEmailForm({ subject: '', message: '' }); // Clear form
    } catch (error: any) {
      toast({
        title: 'Грешка при изпращане',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <Newspaper className="mr-3 h-8 w-8 text-primary" />
          Управление на Бюлетин
        </h1>
        <p className="text-lg text-muted-foreground">Прегледайте абонатите и изпратете съобщения.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" />
                Списък с Абонати ({subscribers.length})
              </CardTitle>
              <CardDescription>Преглед на всички имейли, абонирани за бюлетина.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSubscribers ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center p-2 border-b">
                      <Skeleton className="h-5 w-3/5" />
                      <Skeleton className="h-5 w-1/5" />
                    </div>
                  ))}
                </div>
              ) : subscribers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Няма намерени абонати.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Имейл</TableHead>
                      <TableHead>Дата на абонамент</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.map((subscriber) => (
                      <TableRow key={subscriber.id}>
                        <TableCell className="font-medium">{subscriber.email}</TableCell>
                        <TableCell>
                          {subscriber.subscribedAt
                            ? format(new Date(subscriber.subscribedAt), 'PPP p', { locale: bg })
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="mr-2 h-5 w-5 text-primary" />
                Изпрати Имейл
              </CardTitle>
              <CardDescription>Създайте и изпратете имейл до всички абонати.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-foreground">Тема</label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    value={emailForm.subject}
                    onChange={handleEmailFormChange}
                    placeholder="Тема на Вашия имейл"
                    disabled={isSendingEmail}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground">Съобщение</label>
                  <Textarea
                    id="message"
                    name="message"
                    value={emailForm.message}
                    onChange={handleEmailFormChange}
                    placeholder="Напишете Вашето съобщение тук..."
                    rows={6}
                    disabled={isSendingEmail}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSendingEmail || subscribers.length === 0}>
                  {isSendingEmail ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {isSendingEmail ? 'Изпращане...' : `Изпрати до ${subscribers.length} абонат${subscribers.length === 1 ? '' : 'и'}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
