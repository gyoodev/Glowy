
'use client';
import React, { useEffect, useState } from 'react';
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
import { getFirestore, collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { UserProfile } from '@/types';

interface MonthlyData {
  month: string;
  users?: number;
  salons?: number;
  payments?: number;
}

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

      {/* Charts Section */}
      <div className="mt-12 space-y-8">
        {chartError && <p className="text-destructive text-center">{chartError}</p>}
        {loadingCharts && <p className="text-muted-foreground text-center">Зареждане на графики...</p>}

        {!loadingCharts && !chartError && (
          <>
            {/* New Users Chart */}
            {monthlyUserData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Месечни нови потребители</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={userChartConfig} className="h-[300px] w-full">
                    <RechartsBarChart accessibilityLayer data={monthlyUserData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <YAxis allowDecimals={false} />
                      <ChartTooltipContent />
                      <Legend />
                      <Bar dataKey="users" fill="var(--color-users)" radius={4} />
                    </RechartsBarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* New Salons Chart */}
            {monthlySalonData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary" />Месечни нови салони</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={salonChartConfig} className="h-[300px] w-full">
                    <RechartsBarChart accessibilityLayer data={monthlySalonData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <YAxis allowDecimals={false} />
                      <ChartTooltipContent />
                      <Legend />
                      <Bar dataKey="salons" fill="var(--color-salons)" radius={4} />
                    </RechartsBarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Monthly Payments Chart */}
            {monthlyPaymentData.length > 0 && (
               <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><DollarSign className="mr-2 h-5 w-5 text-primary" />Месечни плащания от промоции</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={paymentChartConfig} className="h-[300px] w-full">
                    <RechartsBarChart accessibilityLayer data={monthlyPaymentData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <YAxis />
                      <ChartTooltipContent formatter={(value) => `${Number(value).toFixed(2)} лв.`} />
                      <Legend />
                      <Bar dataKey="payments" fill="var(--color-payments)" radius={4} name="Плащания (лв.)" />
                    </RechartsBarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>


      <Card className="mt-12">
        <CardHeader>
          <CardTitle>Напомняне за Отстраняване на Грешки (404)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ако тази страница (или други администраторски страници) все още връщат 404 грешка, моля, проверете обстойно Вашите Netlify билд логове за евентуални грешки. Уверете се, че `next.config.ts` не игнорира билд грешките. Също така, изчистете кеша на Netlify билда. Локалната проверка включва изтриване на `.next` папката и рестарт на сървъра.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
