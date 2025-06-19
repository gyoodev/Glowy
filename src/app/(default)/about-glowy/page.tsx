
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Info, Link as LinkIconLucide, MessageSquare, Users, Search, CalendarCheck, Bot } from 'lucide-react'; // Renamed Link to LinkIconLucide, added more icons
import Link from 'next/link';

export default function AboutGlowyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <header className="text-center md:text-left mb-12">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">ПЛАТФОРМА</span>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
            Запознайте се с Glaura
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto md:mx-0">
            Вашият доверен партньор в света на красотата и уелнес услугите.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content Section (Left/Main) */}
          <div className="md:col-span-2 space-y-8">
            <Card className="shadow-xl rounded-lg">
              <CardHeader>
                <CardTitle className="text-3xl font-semibold text-foreground flex items-center">
                  <Sparkles className="w-8 h-8 mr-3 text-primary" />
                  Нашата Мисия: Вашият Блясък
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4 text-base leading-relaxed">
                <p>
                  В Glaura, ние сме посветени на това да направим намирането и резервирането на качествени козметични
                  и уелнес услуги по-лесно от всякога. Нашата платформа свързва клиенти с талантливи професионалисти
                  и топ салони, предлагайки безпроблемно изживяване от откриването до резервацията.
                </p>
                <p>
                  Ние вярваме, че всеки заслужава да се чувства и изглежда по най-добрия начин. Затова създадохме Glaura -
                  за да ви помогнем да откриете своя перфектен стил и да се насладите на моменти на релаксация и преобразяване.
                </p>
                <div className="pt-4">
                  <Button asChild size="lg">
                    <Link href="/salons">Разгледайте Салони</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl rounded-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-foreground">
                  Ключови Функционалности
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <ul className="space-y-4 text-base">
                  <li className="flex items-start">
                    <Search className="w-5 h-5 mr-3 mt-1 text-primary flex-shrink-0" />
                    <span>Интуитивно търсене и детайлно филтриране на салони и услуги</span>
                  </li>
                  <li className="flex items-start">
                    <CalendarCheck className="w-5 h-5 mr-3 mt-1 text-primary flex-shrink-0" />
                    <span>Лесна онлайн резервация на часове 24/7</span>
                  </li>
                  <li className="flex items-start">
                    <Bot className="w-5 h-5 mr-3 mt-1 text-primary flex-shrink-0" />
                    <span>Персонализирани AI препоръки за салони и процедури</span>
                  </li>
                  <li className="flex items-start">
                    <Users className="w-5 h-5 mr-3 mt-1 text-primary flex-shrink-0" />
                    <span>Удобно управление на потребителски профил и история на резервациите</span>
                  </li>
                  <li className="flex items-start">
                    <MessageSquare className="w-5 h-5 mr-3 mt-1 text-primary flex-shrink-0" />
                    <span>Достоверни отзиви и оценки от реални клиенти</span>
                  </li>
                   <li className="flex items-start">
                    <Sparkles className="w-5 h-5 mr-3 mt-1 text-primary flex-shrink-0" />
                    <span>Възможност за бизнеси да управляват своите профили и наличност</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar-like Info Cards (Right) */}
          <div className="space-y-8">
            <Card className="shadow-md rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  ЗА GLAURA
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm leading-normal">
                Glaura е модерна платформа, създадена да улесни връзката между салоните за красота и техните клиенти,
                предлагайки иновативни решения и интуитивен потребителски интерфейс за едно по-добро преживяване.
              </CardContent>
            </Card>

            <Card className="shadow-md rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center">
                  <LinkIconLucide className="w-4 h-4 mr-2" />
                  ПОЛЕЗНИ ВРЪЗКИ
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm space-y-2">
                <p><Link href="/contact" className="hover:text-primary transition-colors">Свържете се с нас</Link></p>
                <p><Link href="/faq" className="hover:text-primary transition-colors">Често задавани въпроси</Link></p>
                <p><Link href="/terms" className="hover:text-primary transition-colors">Условия за ползване</Link></p>
                <p><Link href="/privacy" className="hover:text-primary transition-colors">Политика за поверителност</Link></p>
              </CardContent>
            </Card>

            <Card className="shadow-md rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  ОБРАТНА ВРЪЗКА
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm leading-normal">
                Вашето мнение е изключително важно за нас! Ако имате предложения или забележки, моля, <Link href="/contact" className="text-primary hover:underline">свържете се с екипа ни</Link>.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

