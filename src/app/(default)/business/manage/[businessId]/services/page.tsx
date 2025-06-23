
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ServicesManagementPage() {
  const params = useParams();
  const businessId = params?.businessId as string;

  return (
    <div className="container mx-auto px-4 py-8">
       <Button variant="outline" size="sm" asChild className="mb-4">
        <Link href="/business/manage">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад към управление
        </Link>
      </Button>
      <h1 className="text-3xl font-bold mb-4">Управление на услуги</h1>
       <Card>
        <CardHeader>
          <CardTitle>Списък с услуги</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Тук ще бъде страницата за управление на услуги за салон с ID: {businessId}.</p>
          <p className="mt-4 text-muted-foreground">Тази функционалност е в процес на разработка.</p>
        </CardContent>
      </Card>
    </div>
  );
};
