
'use client';

import { Sparkles, Send } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { subscribeToNewsletter } from '@/lib/firebase';
import { useState } from 'react';
import { IconBrandFacebook, IconBrandInstagram, IconBrandTiktok } from '@tabler/icons-react';

const newsletterFormSchema = z.object({
  email: z.string().email({ message: "Моля, въведете валиден имейл адрес." }),
});

type NewsletterFormValues = z.infer<typeof newsletterFormSchema>;

const socialLinks = [
  { 
    name: 'Facebook', 
    href: 'https://www.facebook.com/Glaura-100000000000000',
    icon: <IconBrandFacebook className="w-6 h-6" />
  },
  { 
    name: 'Instagram', 
    href: 'https://www.instagram.com/glaura.official/',
    icon: <IconBrandInstagram className="w-6 h-6" />
  },
  {
    name: 'TikTok',
    href: 'https://www.tiktok.com/@glaura.official',
    icon: <IconBrandTiktok className="w-6 h-6" />
  },
];

export function Footer() {
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);

  const form = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterFormSchema),
    defaultValues: {
      email: '',
    },
  });

  const onNewsletterSubmit: SubmitHandler<NewsletterFormValues> = async (data) => {
    setIsSubscribing(true);
    const result = await subscribeToNewsletter(data.email);
    if (result.success) {
      toast({
        title: 'Абонаментът е успешен!',
        description: result.message,
      });
      form.reset();
    } else {
      toast({
        title: 'Грешка при абониране',
        description: result.message,
        variant: result.message.includes("вече е абониран") ? "default" : "destructive",
      });
    }
    setIsSubscribing(false);
  };

  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-12 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1 lg:col-span-1">
            <h3 className="text-lg font-semibold text-foreground mb-3">За Glaura</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Glaura е Вашата дестинация за откриване на най-добрите салони за красота и уелнес услуги. Ние Ви помагаме лесно да намерите и резервирате перфектното изживяване.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Важни Връзки</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about-glowy" className="text-muted-foreground hover:text-primary transition-colors">За Glaura</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Условия за Ползване</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Политика за поверителност</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Контакти</Link></li>
              <li><Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">Често задавани въпроси</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2 lg:col-span-2">
            <h3 className="text-lg font-semibold text-foreground mb-3">Абонирайте се за нашия бюлетин</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Получавайте последните новини, оферти и съвети за красота директно във Вашата поща.
            </p>
            <form onSubmit={form.handleSubmit(onNewsletterSubmit)} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="Вашият имейл адрес"
                className="flex-grow"
                aria-label="Имейл за бюлетин"
                {...form.register("email")}
                disabled={isSubscribing}
              />
              <Button type="submit" variant="default" disabled={isSubscribing}>
                <Send className="mr-2 h-4 w-4" />
                {isSubscribing ? 'Абониране...' : 'Абонирай се'}
              </Button>
            </form>
            {form.formState.errors.email && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>
        </div>

        <div className="border-t pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                Създадено от <a href="https://gkdev.org" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">GKDEV</a> с 💜 &copy; {new Date().getFullYear()} Всички права запазени.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {socialLinks.map((link) => (
                <a key={link.name} href={link.href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <span className="sr-only">{link.name}</span>
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
