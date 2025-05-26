
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
  BarChart3,
  LineChart,
  AreaChart,
} from 'lucide-react';
import { getFirestore, collection, getDocs, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { UserProfile, Salon } from '@/types'; // Assuming Payment type might be needed if you have one.

import { Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'; // Assuming ChartConfig is handled or not needed for basic charts
import { format, getMonth, getYear, startOfMonth } from 'date-fns';
import { bg } from 'date-fns/locale';


interface MonthlyData {
  month: string; // e.g., "Яну 2024"
  users?: number;
  salons?: number;
  payments?: number;
}

export default function AdminIndexPage() {
  const adminSections = [
    { title: 'Управление на Потребители', description: 'Преглед и управление на потребителски акаунти.', href: '/admin/users', icon: Users },
    { title: 'Управление на Бизнеси', description: 'Преглед и управление на регистрирани салони.', href: '/admin/business', icon: Briefcase },
    { title: 'Управление на Резервации', description: 'Преглед на всички резервации в системата.', href: '/admin/bookings', icon: CalendarCheck },
    { title: 'Запитвания от Клиенти', description: 'Преглед и отговор на запитвания от контактната форма.', href: '/admin/contacts', icon: Mail },
    { title: 'Бюлетин', description: 'Управление на абонати и изпращане на бюлетини.', href: '/admin/newsletter', icon: Newspaper },
    { title: 'Управление на Плащания', description: 'Преглед на плащания от промоции.', href: '/admin/payments', icon: DollarSign },
  ];

  const [monthlyUserData, setMonthlyUserData] = useState<MonthlyData[]>([]);
  const [monthlySalonData, setMonthlySalonData] = useState<MonthlyData[]>([]);
  const [monthlyPaymentData, setMonthlyPaymentData] = useState<MonthlyData[]>([]);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDataForCharts = async () => {
      setLoadingCharts(true);
      setChartError(null);
      try {
        // Fetch Users
        const usersQuery = query(collection(firestore, 'users'), orderBy('createdAt', 'asc'));
        const usersSnapshot = await getDocs(usersQuery);
        const usersByMonth: Record<string, number> = {};
        usersSnapshot.forEach(doc => {
          const data = doc.data() as UserProfile;
          if (data.createdAt && data.createdAt.seconds) {
            const date = new Date(data.createdAt.seconds * 1000);
            const monthYear = format(date, 'LLL yyyy', { locale: bg });
            usersByMonth[monthYear] = (usersByMonth[monthYear] || 0) + 1;
          }
        });
        const userChartData = Object.entries(usersByMonth)
          .map(([month, count]) => ({ month, users: count }))
          .sort((a,b) => new Date(a.month.split(' ')[1], Object.keys(bg.localize!.month).findIndex(m => m.startsWith(a.month.split(' ')[0].toLowerCase().substring(0,3))) ).getTime() - new Date(b.month.split(' ')[1], Object.keys(bg.localize!.month).findIndex(m => m.startsWith(b.month.split(' ')[0].toLowerCase().substring(0,3))) ).getTime() );
        setMonthlyUserData(userChartData);

        // Fetch Salons
        const salonsQuery = query(collection(firestore, 'salons'), orderBy('createdAt', 'asc'));
        const salonsSnapshot = await getDocs(salonsQuery);
        const salonsByMonth: Record<string, number> = {};
        salonsSnapshot.forEach(doc => {
          const data = doc.data() as Salon;
           if (data.createdAt && data.createdAt.seconds) {
            const date = new Date(data.createdAt.seconds * 1000);
            const monthYear = format(date, 'LLL yyyy', { locale: bg });
            salonsByMonth[monthYear] = (salonsByMonth[monthYear] || 0) + 1;
          }
        });
        const salonChartData = Object.entries(salonsByMonth)
          .map(([month, count]) => ({ month, salons: count }))
          .sort((a,b) => new Date(a.month.split(' ')[1], Object.keys(bg.localize!.month).findIndex(m => m.startsWith(a.month.split(' ')[0].toLowerCase().substring(0,3))) ).getTime() - new Date(b.month.split(' ')[1], Object.keys(bg.localize!.month).findIndex(m => m.startsWith(b.month.split(' ')[0].toLowerCase().substring(0,3))) ).getTime() );
        setMonthlySalonData(salonChartData);
        
        // Fetch Payments
        const paymentsQuery = query(collection(firestore, 'promotionsPayments'), orderBy('createdAt', 'asc'));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const paymentsByMonth: Record<string, number> = {};
        paymentsSnapshot.forEach(doc => {
          const data = doc.data(); // Assuming Payment type with amount and createdAt
          if (data.createdAt && data.createdAt.seconds && typeof data.amount === 'number') {
            const date = new Date(data.createdAt.seconds * 1000);
            const monthYear = format(date, 'LLL yyyy', { locale: bg });
            paymentsByMonth[monthYear] = (paymentsByMonth[monthYear] || 0) + data.amount;
          }
        });
         const paymentChartData = Object.entries(paymentsByMonth)
          .map(([month, sum]) => ({ month, payments: sum }))
          .sort((a,b) => new Date(a.month.split(' ')[1], Object.keys(bg.localize!.month).findIndex(m => m.startsWith(a.month.split(' ')[0].toLowerCase().substring(0,3))) ).getTime() - new Date(b.month.split(' ')[1], Object.keys(bg.localize!.month).findIndex(m => m.startsWith(b.month.split(' ')[0].toLowerCase().substring(0,3))) ).getTime() );
        setMonthlyPaymentData(paymentChartData);

      } catch (error) {
        console.error("Error fetching data for admin charts:", error);
        setChartError("Неуспешно зареждане на данните за графиките.");
      } finally {
        setLoadingCharts(false);
      }
    };

    fetchDataForCharts();
  }, []);

  const userChartConfig = {
    users: { label: "Нови потребители", color: "hsl(var(--chart-1))" },
  } satisfies Record<string, { label: string; color: string }>;

  const salonChartConfig = {
    salons: { label: "Нови салони", color: "hsl(var(--chart-2))" },
  } satisfies Record<string, { label: string; color: string }>;

  const paymentChartConfig = {
    payments: { label: "Плащания (лв.)", color: "hsl(var(--chart-3))" },
  } satisfies Record<string, { label: string; color: string }>;


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
      
      {chartError && <p className="text-destructive text-center mb-4">{chartError}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly New Users Chart */}
        <Card className="lg:col-span-1">
          
          <CardContent className="pt-6">
            {loadingCharts ? (
              <p>Зареждане на данни за потребители...</p>
            ) : monthlyUserData.length > 0 ? (
              <ChartContainer config={userChartConfig} className="h-[250px] w-full">
                <BarChart accessibilityLayer data={monthlyUserData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    allowDecimals={false}
                  />
                  <RechartsTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Legend />
                  <Bar dataKey="users" fill="var(--color-users)" radius={4} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">Няма данни за нови потребители.</p>
            )}
          </CardContent>
        </Card>

        {/* Monthly New Salons Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/> Месечни нови салони</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCharts ? (
              <p>Зареждане на данни за салони...</p>
            ) : monthlySalonData.length > 0 ? (
               <ChartContainer config={salonChartConfig} className="h-[250px] w-full">
                <BarChart accessibilityLayer data={monthlySalonData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    allowDecimals={false}
                  />
                  <RechartsTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Legend />
                  <Bar dataKey="salons" fill="var(--color-salons)" radius={4} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">Няма данни за нови салони.</p>
            )}
          </CardContent>
        </Card>

        {/* Monthly Payments Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center"><DollarSign className="mr-2 h-5 w-5 text-primary"/> Месечни плащания от промоции</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCharts ? (
              <p>Зареждане на данни за плащания...</p>
            ) : monthlyPaymentData.length > 0 ? (
              <ChartContainer config={paymentChartConfig} className="h-[250px] w-full">
                <BarChart accessibilityLayer data={monthlyPaymentData} margin={{ top: 5, right: 20, left: -5, bottom: 5 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `${value} лв.`}
                  />
                  <RechartsTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Legend />
                  <Bar dataKey="payments" fill="var(--color-payments)" radius={4} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">Няма данни за плащания.</p>
            )}
          </CardContent>
        </Card>
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
