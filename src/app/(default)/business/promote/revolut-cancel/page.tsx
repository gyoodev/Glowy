'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RevolutCancelPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-10 px-6 text-center">
      <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
      <h2 className="text-2xl font-semibold text-foreground mb-2">Плащането е анулирано</h2>
      <p className="text-muted-foreground mb-6">Вашето Revolut плащане беше анулирано или неуспешно.</p>
      <Button onClick={() => router.back()} variant="outline">
        Назад
      </Button>
    </div>
  );
}