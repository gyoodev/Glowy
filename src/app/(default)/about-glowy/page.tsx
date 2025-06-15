
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Import Button
import { Sparkles, Info, Link as LinkIconLucide, MessageSquare } from 'lucide-react'; // Renamed Link to LinkIconLucide
import Link from 'next/link';

export default function AboutGlowyPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-left mb-12">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">ПЛАТФОРМА</span>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl text-gray-50">
            Запознайте се с Glaura
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content Section (Left/Main) */}
          <div className="md:col-span-2 space-y-8">
            <Card className="bg-gray-800 border-gray-700/50 shadow-xl rounded-lg">
              <CardHeader>
                <CardTitle className="text-3xl font-semibold text-gray-100 flex items-center">
                  <Sparkles className="w-8 h-8 mr-3 text-primary" />
                  Нашата Мисия: Вашият Блясък
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-4 text-base leading-relaxed">
                <p>
                  В Glowy, ние сме посветени на това да направим намирането и резервирането на качествени козметични
                  и уелнес услуги по-лесно от всякога. Нашата платформа свързва клиенти с талантливи професионалисти
                  и топ салони, предлагайки безпроблемно изживяване от откриването до резервацията.
                </p>
                <p>
                  Ние вярваме, че всеки заслужава да се чувства и изглежда по най-добрия начин. Затова създадохме Glowy -
                  за да ви помогнем да откриете своя перфектен стил и да се насладите на моменти на релаксация и преобразяване.
                </p>
                <div className="pt-4">
                  <Button asChild>
                    <Link href="/">Разгледайте Салони</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700/50 shadow-xl rounded-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-gray-100">
                  Ключови Функционалности
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                <ul className="list-disc list-inside space-y-3 text-base">
                  <li>Интуитивно търсене и детайлно филтриране на салони и услуги</li>
                  <li>Лесна онлайн резервация на часове 24/7</li>
                  <li>Персонализирани AI препоръки за салони и процедури</li>
                  <li>Удобно управление на потребителски профил и история на резервациите</li>
                  <li>Достоверни отзиви и оценки от реални клиенти</li>
                  <li>Възможност за бизнеси да управляват своите профили и наличност</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar-like Info Cards (Right) */}
          <div className="space-y-8">
            <Card className="bg-gray-800 border-gray-700/50 shadow-md rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center">
                  <Info className="w-4 h-4 mr-2" />Я ЗА
                  ЗА GLOWY
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400 text-sm leading-normal">
                Glowy е модерна платформа, създадена да улесни връзката между салоните за красота и техните клиенти,
                предлагайки иновативни решения и интуитивен потребителски интерфейс за едно по-добро преживяване.
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700/50 shadow-md rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center">
                  <LinkIconLucide className="w-4 h-4 mr-2" />
                  ПОЛЕЗНИ ВРЪЗКИ
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400 text-sm space-y-2">
                <p><Link href="/contact" className="hover:text-primary transition-colors">Свържете се с нас</Link></p>
                <p><Link href="/faq" className="hover:text-primary transition-colors">Често задавани въпроси</Link></p>
                <p><Link href="/terms" className="hover:text-primary transition-colors">Условия за ползване</Link></p>
                <p><Link href="/privacy" className="hover:text-primary transition-colors">Политика за поверителност</Link></p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700/50 shadow-md rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  ОБРАТНА ВРЪЗКА
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400 text-sm leading-normal">
                Вашето мнение е изключително важно за нас! Ако имате предложения или забележки, моля, <Link href="/contact" className="text-primary hover:underline">свържете се с екипа ни</Link>.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
