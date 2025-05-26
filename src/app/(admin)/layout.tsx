// src/app/(admin)/page.tsx
'use client';

import React from 'react';
import { Users, Briefcase, Mail, CalendarCheck, TrendingUp, Activity } from 'lucide-react';

export default function AdminDashboard() {
  // Mock data - replace with real data fetching
  const stats = {
    totalUsers: 1247,
    totalBusinesses: 89,
    totalBookings: 342,
    pendingContacts: 12,
    monthlyGrowth: 12.5,
    activeToday: 156
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color = "text-primary" 
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: string;
    color?: string;
  }) => (
    <div className="bg-card p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-1">
              <TrendingUp className="inline w-4 h-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-foreground">
          Административно табло
        </h1>
        <p className="text-muted-foreground mt-2">
          Преглед на статистиките и управление на системата
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Общо потребители"
          value={stats.totalUsers.toLocaleString('bg-BG')}
          icon={Users}
          trend="+12% този месец"
          color="text-blue-600"
        />
        <StatCard
          title="Регистрирани бизнеси"
          value={stats.totalBusinesses}
          icon={Briefcase}
          trend="+8% този месец"
          color="text-green-600"
        />
        <StatCard
          title="Общо резервации"
          value={stats.totalBookings.toLocaleString('bg-BG')}
          icon={CalendarCheck}
          trend="+23% този месец"
          color="text-purple-600"
        />
        <StatCard
          title="Чакащи запитвания"
          value={stats.pendingContacts}
          icon={Mail}
          color="text-orange-600"
        />
        <StatCard
          title="Месечен растеж"
          value={`${stats.monthlyGrowth}%`}
          icon={TrendingUp}
          color="text-emerald-600"
        />
        <StatCard
          title="Активни днес"
          value={stats.activeToday}
          icon={Activity}
          color="text-indigo-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Бързи действия</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center space-x-2 p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Управление на потребители</span>
          </button>
          <button className="flex items-center space-x-2 p-3 bg-green-100 hover:bg-green-200 rounded-lg transition-colors">
            <Briefcase className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium">Одобри бизнес</span>
          </button>
          <button className="flex items-center space-x-2 p-3 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors">
            <CalendarCheck className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium">Преглед резервации</span>
          </button>
          <button className="flex items-center space-x-2 p-3 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors">
            <Mail className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium">Отговори на запитвания</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Последна активност</h2>
        <div className="space-y-3">
          {[
            { action: "Нов потребител се регистрира", time: "преди 5 минути", type: "user" },
            { action: "Бизнес подаде заявка за одобрение", time: "преди 15 минути", type: "business" },
            { action: "Направена е нова резервация", time: "преди 30 минути", type: "booking" },
            { action: "Получено е ново запитване", time: "преди 1 час", type: "contact" },
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                activity.type === 'user' ? 'bg-blue-500' :
                activity.type === 'business' ? 'bg-green-500' :
                activity.type === 'booking' ? 'bg-purple-500' : 'bg-orange-500'
              }`} />
              <div className="flex-1">
                <p className="font-medium text-sm">{activity.action}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}