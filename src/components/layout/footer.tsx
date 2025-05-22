
import { Sparkles, Send } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-12 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About Us Section */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">За Glowy</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Glowy е Вашата дестинация за откриване на най-добрите салони за красота и уелнес услуги. Ние Ви помагаме лесно да намерите и резервирате перфектното изживяване.
            </p>
          </div>

          {/* Important Links Section */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Важни Връзки</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Условия за ползване</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Политика за поверителност</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Контакти</Link></li>
              <li><Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">Често задавани въпроси</Link></li>
            </ul>
          </div>

          {/* Newsletter Subscription Section */}
          <div className="md:col-span-2 lg:col-span-2">
            <h3 className="text-lg font-semibold text-foreground mb-3">Абонирайте се за нашия бюлетин</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Получавайте последните новини, оферти и съвети за красота директно във Вашата поща.
            </p>
            <form className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="Вашият имейл адрес"
                className="flex-grow"
                aria-label="Имейл за бюлетин"
              />
              <Button type="submit" variant="default">
                <Send className="mr-2 h-4 w-4" />
                Абонирай се
              </Button>
            </form>
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
            <div className="text-sm text-muted-foreground">
              Открийте Своя Блясък.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
