'use client'; // Keep as client component if it uses client-side interactivity like Link

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, Briefcase, CalendarCheck, MessageSquare as IconMessageSquare, Newspaper, Settings } from 'lucide-react';

export default function AdminIndexPage() {
  console.log('AdminIndexPage (/admin) attempting to render...');

  const adminSections = [
    { title: 'Управление на потребители', href: '/admin/users', icon: Users, description: 'Преглед, създаване и управление на потребителски акаунти.' },
    { title: 'Управление на бизнеси', href: '/admin/business', icon: Briefcase, description: 'Управление на салонни профили, услуги и информация.' },
    { title: 'Управление на резервации', href: '/admin/bookings', icon: CalendarCheck, description: 'Преглед и управление на всички резервации в системата.' },
    { title: 'Запитвания от клиенти', href: '/admin/contacts', icon: IconMessageSquare, description: 'Преглед и отговор на запитвания от контактната форма.' },
    { title: 'Бюлетин', href: '/admin/newsletter', icon: Newspaper, description: 'Управление на абонати и изпращане на бюлетини.' },
    // { title: 'Общи настройки', href: '/admin/settings', icon: Settings, description: 'Конфигуриране на системни параметри и опции.' },
  ];

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Административно Табло
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Добре дошли! Изберете секция за управление от опциите по-долу.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => (
          <Link href={section.href} key={section.title} passHref>
            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full flex flex-col">
              <CardHeader className="flex flex-row items-center space-x-4 pb-3">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <section.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-semibold">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription>{section.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
       <p className="mt-8 text-sm text-muted-foreground text-center">
        Ако виждате това, значи страницата `/admin/page.tsx` се рендира.
      </p>
    </div>
  );
}
