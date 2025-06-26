
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Gift } from 'lucide-react';

const PromotionsManagementPage = () => {
  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <Gift className="mr-3 h-8 w-8 text-primary" />
          Управление на Промоции
        </h1>
        <p className="text-lg text-muted-foreground">
          Създаване, редактиране и управление на промоционални пакети и кампании.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Текущи Промоции</CardTitle>
          <CardDescription>
            Тази секция ще показва списък с активни промоционални пакети и кампании.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-10">
            <p>Функционалността за управление на промоции е в процес на разработка.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromotionsManagementPage;
