
'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Users,
  Briefcase,
  CalendarCheck,
  DollarSign,
  Activity,
  BarChart3,
  ListChecks,
  UserPlus,
  Building,
  CreditCard,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/badge';

// Placeholder data for stats
const placeholderStats = [
  { title: 'Общо Потребители', value: '1,234', icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { title: 'Общо Салони', value: '56', icon: Briefcase, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { title: 'Активни Резервации', value: '102', icon: CalendarCheck, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  { title: 'Приходи (демо)', value: '12,345 лв.', icon: DollarSign, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
];

// Placeholder data for monthly registrations chart
const monthlyUserRegistrationsData = [
  { month: 'Яну', users: 65 },
  { month: 'Фев', users: 59 },
  { month: 'Мар', users: 80 },
  { month: 'Апр', users: 81 },
  { month: 'Май', users: 56 },
  { month: 'Юни', users: 55 },
  { month: 'Юли', users: 40 },
];

// Placeholder data for recent activity
const recentActivityData = [
  { id: 1, icon: UserPlus, text: 'Нов потребител регистриран: Иван Иванов', time: 'преди 5 минути', type: 'user' },
  { id: 2, icon: Building, text: 'Нов салон добавен: "Елеганс Студио"', time: 'преди 1 час', type: 'salon' },
  { id: 3, icon: CalendarCheck, text: 'Резервация #1234 потвърдена', time: 'преди 2 часа', type: 'booking' },
  { id: 4, icon: CreditCard, text: 'Плащане получено за промоция "Златен План"', time: 'преди 3 часа', type: 'payment' },
  { id: 5, icon: UserPlus, text: 'Нов потребител регистриран: Мария Петрова', time: 'преди 5 часа', type: 'user' },
];

export default function AdminIndexPage() {
  // In a real application, you would fetch this data from your backend/Firebase
  const [stats, setStats] = useState(placeholderStats);
  const [userRegData, setUserRegData] = useState(monthlyUserRegistrationsData);
  const [activityFeed, setActivityFeed] = useState(recentActivityData);

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Административно Табло
          </h1>
          <p className="text-muted-foreground">
            Общ преглед и управление на Glowy платформата.
          </p>
        </div>
        {/* Placeholder for any top-right actions like a date range picker or refresh button */}
      </div>

      {/* Stats Cards Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className={`shadow-lg hover:shadow-xl transition-shadow duration-300 ${stat.bgColor}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${stat.color}`}>{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              {/* Optional: Add a small trend indicator or description here */}
              {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area: Chart and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Section */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-primary" />
              Регистрации на потребители (Месечно)
            </CardTitle>
            <CardDescription>Демонстрационни данни за последните 7 месеца.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] p-2 md:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userRegData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}`} 
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                />
                <Legend iconSize={10} wrapperStyle={{fontSize: "12px", paddingTop: "10px"}} />
                <Bar dataKey="users" fill="hsl(var(--primary))" name="Нови потребители" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity Section */}
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-primary" />
              Скорошна Активност
            </CardTitle>
            <CardDescription>Последни събития в платформата.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityFeed.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-muted/50 rounded-md transition-colors">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'user' ? 'bg-blue-500/10' :
                    activity.type === 'salon' ? 'bg-green-500/10' :
                    activity.type === 'booking' ? 'bg-purple-500/10' :
                    'bg-orange-500/10' // payment or other
                  }`}>
                    <activity.icon className={`h-5 w-5 ${
                      activity.type === 'user' ? 'text-blue-500' :
                      activity.type === 'salon' ? 'text-green-500' :
                      activity.type === 'booking' ? 'text-purple-500' :
                      'text-orange-500'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground leading-tight">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
               <div className="text-center mt-4">
                <a href="#" className="text-sm text-primary hover:underline">
                  Виж всички активности
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
