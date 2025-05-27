'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Briefcase, CalendarCheck, Mail, Newspaper, DollarSign, BarChart3 } from 'lucide-react';

interface AdminCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const AdminCard: React.FC<AdminCardProps> = ({ title, description, href, icon: Icon }) => {
  return (
    <Link href={href} passHref>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Icon className="h-6 w-6 text-primary" />
        </CardHeader>
        <CardContent className="flex-grow">
          <CardDescription>{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
};

export default function AdminIndexPage() {
  console.log('AdminIndexPage (/admin/page.tsx): Attempting to render.');

  const adminSections = [
    {
      title: 'Управление на Потребители',
      description: 'Преглед и управление на потребителски акаунти, роли и достъп.',
      href: '/admin/users',
      icon: Users,
    },
    {
      title: 'Управление на Бизнеси',
      description: 'Преглед, одобрение и управление на регистрирани салони.',
      href: '/admin/business',
      icon: Briefcase,
    },
    {
      title: 'Управление на Резервации',
      description: 'Преглед и управление на всички резервации в системата.',
      href: '/admin/bookings',
      icon: CalendarCheck,
    },
    {
      title: 'Запитвания от Клиенти',
      description: 'Преглед и отговор на запитвания от контактната форма.',
      href: '/admin/contacts',
      icon: Mail,
    },
    {
      title: 'Бюлетин',
      description: 'Управление на абонати и изпращане на бюлетини.',
      href: '/admin/newsletter',
      icon: Newspaper,
    },
    {
      title: 'Плащания от Промоции',
      description: 'Преглед на всички плащания за промоционални пакети.',
      href: '/admin/payments',
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Административно Табло</h1>
        <p className="text-muted-foreground">
          Добре дошли в основния контролен център на Glowy.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminSections.map((section) => (
          <AdminCard
            key={section.title}
            title={section.title}
            description={section.description}
            href={section.href}
            icon={section.icon}
          />
        ))}
      </div>

      {/* Placeholder for future charts or other dashboard elements */}
      <div className="mt-12 space-y-8">
         {/* Example of how a chart card might be structured */}
        {/*
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-primary" />
              Статистика (Пример)
            </CardTitle>
            <CardDescription>Преглед на активността.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] bg-muted rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">Данни за графика ще бъдат добавени тук.</p>
            </div>
          </CardContent>
        </Card>
        */}
      </div>

      <div className="mt-8 p-4 border border-dashed border-destructive/50 bg-destructive/10 rounded-md text-destructive-foreground">
        <h3 className="font-semibold text-destructive">Напомняне за Отстраняване на Грешки (404)</h3>
        <p className="text-sm">
          Ако тази страница (или други администраторски страници) все още връщат 404 грешка, моля, проверете обстойно Вашите Netlify билд логове за евентуални грешки. Уверете се, че `next.config.ts` не игнорира билд грешките. Също така, изчистете кеша на Netlify билда. Локалната проверка включва изтриване на `.next` папката и рестарт на сървъра.
        </p>
      </div>
    </div>
  );
}
