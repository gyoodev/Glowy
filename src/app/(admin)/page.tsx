
'use client';
import React from 'react';
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
  Activity,
  BarChart3,
  TrendingUp,
  DollarSign, // Added for consistency with other admin areas
  Package, // Example icon for stats
  CreditCard, // Example icon for stats
  ShoppingBag, // Example for Reservations - placeholder
  MessageSquare, // Example for Contacts - placeholder
  ScrollText // Example for Newsletter - placeholder
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn is in lib/utils

// Placeholder data for stats cards - to be replaced with real data
const statsCards = [
  { title: 'Общо Потребители', value: '1,234', icon: Users, color: 'bg-stat-blue-light text-stat-blue', progress: 75, description: '+15% от миналия месец' },
  { title: 'Общо Салони', value: '56', icon: Briefcase, color: 'bg-stat-green-light text-stat-green', progress: 60, description: '+5 от миналия месец' },
  { title: 'Общо Резервации', value: '3,450', icon: CalendarCheck, color: 'bg-stat-orange-light text-stat-orange', progress: 40, description: '+200 от миналата седмица' },
];

export default function AdminIndexPage() {
  return (
    <div className="space-y-8">
      {/* Stats Cards Section - Based on the general idea from the image */}
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

      {/* Main Content Area - Placeholder for Chart and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area (Placeholder) */}
        <div className="lg:col-span-2">
          <Card className="shadow-md bg-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                Месечна активност (Пример)
              </CardTitle>
              <CardDescription>
                Преглед на ключови метрики за последния месец.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 bg-muted rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Графиката ще бъде имплементирана тук</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Area (Placeholder) */}
        <div className="lg:col-span-1">
          <Card className="shadow-md bg-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Activity className="mr-2 h-5 w-5 text-primary" />
                Скорошна Активност
              </CardTitle>
              <CardDescription>Последни действия в системата.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { text: 'Нов потребител регистриран: Иван Иванов', time: 'преди 5м', icon: Users },
                { text: 'Салон "Блясък" актуализира услугите си', time: 'преди 1ч', icon: Briefcase },
                { text: 'Нова резервация за "Студио Стил"', time: 'преди 3ч', icon: CalendarCheck },
                { text: 'Плащане получено от "Салон Елеганс"', time: 'преди 1д', icon: DollarSign },
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-2 hover:bg-muted/50 rounded-md">
                  <div className="p-1.5 bg-primary/10 rounded-full mt-1">
                    <activity.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
              <div className="text-center pt-2">
                <a href="#" className="text-sm text-primary hover:underline">Виж всички</a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
       {/* Reminder for troubleshooting, if needed to be shown for admins */}
      {/*
      <Card className="mt-8 bg-destructive/10 border-destructive/30">
        <CardHeader>
            <CardTitle className="text-destructive flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Напомняне за Отстраняване на Грешки (404)
            </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-destructive-foreground">
            <p>Ако тази страница (или други администраторски страници) все още връщат 404 грешка, моля, проверете обстойно Вашите Netlify билд логове за евентуални грешки. Уверете се, че `next.config.ts` не игнорира билд грешките. Също така, изчистете кеша на Netlify билда. Локалната проверка включва изтриване на `.next` папката и рестарт на сървъра.</p>
        </CardContent>
      </Card>
      */}
    </div>
  );
}
