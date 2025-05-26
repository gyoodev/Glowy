
'use client';
import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, Briefcase, CalendarCheck, Mail, Newspaper } from 'lucide-react';

// This page now assumes AdminLayout has already verified the user is an admin.
export default function AdminIndexPage() {
  console.log('AdminIndexPage (/admin/page.tsx) CLIENT COMPONENT: Attempting to render...');

  const adminSections = [
    { title: 'Управление на Потребители', description: 'Преглед и управление на потребителски акаунти.', href: '/admin/users', icon: Users },
    { title: 'Управление на Бизнеси', description: 'Преглед и управление на регистрирани салони.', href: '/admin/business', icon: Briefcase },
    { title: 'Управление на Резервации', description: 'Преглед на всички резервации в системата.', href: '/admin/bookings', icon: CalendarCheck },
    { title: 'Запитвания от Клиенти', description: 'Преглед и отговор на запитвания от контактната форма.', href: '/admin/contacts', icon: Mail },
    { title: 'Бюлетин', description: 'Управление на абонати и изпращане на бюлетини.', href: '/admin/newsletter', icon: Newspaper },
  ];

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Административно Табло
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Добре дошли в основния контролен център на Glowy.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => (
          <Link href={section.href} key={section.title} legacyBehavior passHref>
            <a className="block hover:no-underline">
              <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col bg-card text-card-foreground">
                <CardHeader className="flex-row items-center gap-4 pb-3">
                  <section.icon className="w-8 h-8 text-primary" />
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription className="text-muted-foreground">{section.description}</CardDescription>
                </CardContent>
              </Card>
            </a>
          </Link>
        ))}
      </div>
       <div className="mt-12 p-6 border border-dashed border-primary/50 rounded-lg bg-primary/5 text-primary">
          <h3 className="text-lg font-semibold mb-2">Напомняне за Отстраняване на Грешки (404)</h3>
          <p className="text-sm">
            Ако тази страница (или други администраторски страници) все още връщат 404 грешка, моля, проверете обстойно Вашите Netlify билд логове за евентуални грешки.
            Уверете се, че `next.config.js` не игнорира билд грешките. Също така, изчистете кеша на Netlify билда.
            Локалната проверка включва изтриване на `.next` папката и рестарт на сървъра.
          </p>
        </div>
    </div>
  );
}
