
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

const newsletterFormSchema = z.object({
  email: z.string().email({ message: "Моля, въведете валиден имейл адрес." }),
});

type NewsletterFormValues = z.infer<typeof newsletterFormSchema>;

const socialLinks = [
  { 
    name: 'Facebook', 
    href: 'https://www.facebook.com/Glaura-100000000000000',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
      </svg>
    )
  },
  { 
    name: 'Instagram', 
    href: 'https://www.instagram.com/glaura.official/',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.024.06 1.378.06 3.808s-.012 2.784-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.024.048-1.378.06-3.808.06s-2.784-.012-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.048-1.024-.06-1.378-.06-3.808s.012-2.784.06-3.808c.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 017.48 2.465c.636-.247 1.363-.416 2.427-.465C10.93 2.013 11.284 2 12.315 2zm-1.158 10.608a3.757 3.757 0 102.316 0 3.757 3.757 0 00-2.316 0zM14.022 8.25a1.238 1.238 0 100 2.475 1.238 1.238 0 000-2.475z" clipRule="evenodd" />
      </svg>
    )
  },
  {
    name: 'TikTok',
    href: 'https://www.tiktok.com/@glaura.official',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.43.05-4.85-.98-6.49-2.91-1.43-1.7-2.11-3.88-1.95-6.19.16-2.26 1.1-4.49 2.51-6.26 1.47-1.84 3.4-3.13 5.48-3.56 1.83-.37 3.66-.29 5.49.26V0z" />
      </svg>
    )
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
