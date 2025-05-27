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
  Activity,
  BarChart3,
  TrendingUp,
  Package,
  CreditCard,
  ShoppingBag, // Example for Reservations
  MessageSquare, // Example for Contacts
  ScrollText // Example for Newsletter
} from 'lucide-react';

export default function AdminIndexPage() {
  const statsCards = [
    { title: 'Общо Потребители', value: '1,234', icon: Users, color: 'bg-stat-blue-light text-stat-blue', progress: 75, description: '+15% от миналия месец' },
    { title: 'Общо Салони', value: '56', icon: Briefcase, color: 'bg-stat-green-light text-stat-green', progress: 60, description: '+5 от миналия месец' },
    { title: 'Общо Резервации', value: '3,450', icon: CalendarCheck, color: 'bg-stat-orange-light text-stat-orange', progress: 40, description: '+200 от миналата седмица' },
  ];

  const adminSections = [
    { title: 'Управление на Потребители', description: 'Преглед и управление на потребителски акаунти.', href: '/admin/users', icon: Users },
    { title: 'Управление на Бизнеси', description: 'Преглед и управление на регистрирани салони.', href: '/admin/business', icon: Briefcase },
    { title: 'Управление на Резервации', description: 'Преглед на всички резервации в системата.', href: '/admin/bookings', icon: ShoppingBag },
    { title: 'Запитвания от Клиенти', description: 'Преглед и отговор на запитвания от контактната форма.', href: '/admin/contacts', icon: MessageSquare },
    { title: 'Бюлетин', description: 'Управление на абонати и изпращане на бюлетини.', href: '/admin/newsletter', icon: ScrollText },
    { title: 'Управление на Плащания', description: 'Преглед на плащания от промоции.', href: '/admin/payments', icon: CreditCard },
  ];


  return (
    <div className="space-y-8">
      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((card) => (
          <Card key={card.title} className="shadow-md hover:shadow-lg transition-shadow bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <div className={cn("p-2 rounded-md", card.color)}>
                  <card.icon className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-1">{card.value}</h3>
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mb-2">
                <div 
                  className={cn("h-full", card.color.replace('-light','').replace('text-','bg-'))} 
                  style={{ width: `${card.progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Navigation Links Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => (
          <Link
            href={section.href}
            key={section.title}
            className="block hover:no-underline group"
          >
            <Card className="h-full shadow-md hover:shadow-xl transition-shadow duration-200 cursor-pointer flex flex-col bg-card text-card-foreground">
              <CardHeader className="flex-row items-center gap-4 pb-3">
                <div className="p-3 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <section.icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-semibold">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow pt-0">
                <CardDescription className="text-muted-foreground text-sm">
                  {section.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      
      {/* Placeholder for charts - can be uncommented and implemented later */}
      {/* 
      <div className="mt-12 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-primary"/> Месечни нови потребители</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 bg-muted rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">Графиката ще бъде тук</p>
            </div>
          </CardContent>
        </Card>
         // ... other chart cards ...
      </div>
      */}

    </div>
  );
}

// Helper cn function if not globally available (though it should be via @/lib/utils)
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
