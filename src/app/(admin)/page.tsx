
'use client';
import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Users,
  Briefcase,
  CalendarCheck,
  Mail,
  Newspaper,
  DollarSign,
} from 'lucide-react';

// This page assumes AdminLayout has already verified the user is an admin.
export default function AdminIndexPage() {
  const adminSections = [
    { title: 'Управление на Потребители', description: 'Преглед и управление на потребителски акаунти.', href: '/admin/users', icon: Users },
    { title: 'Управление на Бизнеси', description: 'Преглед и управление на регистрирани салони.', href: '/admin/business', icon: Briefcase },
    { title: 'Управление на Резервации', description: 'Преглед на всички резервации в системата.', href: '/admin/bookings', icon: CalendarCheck },
    { title: 'Запитвания от Клиенти', description: 'Преглед и отговор на запитвания от контактната форма.', href: '/admin/contacts', icon: Mail },
    { title: 'Бюлетин', description: 'Управление на абонати и изпращане на бюлетини.', href: '/admin/newsletter', icon: Newspaper },
    { title: 'Управление на Плащания', description: 'Преглед на плащания от промоции.', href: '/admin/payments', icon: DollarSign },
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {adminSections.map((section) => (
          <Link
            href={section.href}
            key={section.title}
            className="block hover:no-underline"
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col bg-card text-card-foreground">
              <CardHeader className="flex-row items-center gap-4 pb-3">
                <section.icon className="w-8 h-8 text-primary" />
                <CardTitle className="text-xl">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription className="text-muted-foreground">
                  {section.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
