
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, Briefcase, CalendarCheck, MessageSquare, Newspaper, LayoutDashboard } from 'lucide-react';

interface DashboardItem {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

const dashboardItems: DashboardItem[] = [
  {
    href: '/admin/users',
    icon: Users,
    title: 'Управление на Потребители',
    description: 'Преглед, създаване и управление на потребителски акаунти и роли.',
  },
  {
    href: '/admin/business', // This page lists salons
    icon: Briefcase,
    title: 'Управление на Бизнеси (Салони)',
    description: 'Преглед и управление на регистрираните салони в платформата.',
  },
  {
    href: '/admin/bookings',
    icon: CalendarCheck,
    title: 'Управление на Резервации',
    description: 'Преглед на всички резервации, направени от потребителите.',
  },
  {
    href: '/admin/contacts',
    icon: MessageSquare,
    title: 'Запитвания от Клиенти',
    description: 'Преглед и управление на съобщенията от контактната форма.',
  },
  {
    href: '/admin/newsletter',
    icon: Newspaper,
    title: 'Управление на Бюлетин',
    description: 'Преглед на абонати и изпращане на бюлетини.',
  },
];

export default function AdminIndexPage() {
  console.log('AdminIndexPage (/admin) rendering with dashboard structure');

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <header className="mb-10 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <LayoutDashboard className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Административно Табло
            </h1>
            <p className="text-lg text-muted-foreground mt-1">
              Общ преглед и бърз достъп до основните модули за управление на платформата Glowy.
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardItems.map((item) => (
          <Link href={item.href} key={item.title} className="block hover:shadow-lg transition-shadow duration-200 rounded-lg">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-row items-center gap-4 pb-4">
                <item.icon className="h-8 w-8 text-primary" />
                <CardTitle className="text-xl font-semibold text-foreground">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription className="text-sm text-muted-foreground">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
