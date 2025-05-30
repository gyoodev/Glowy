'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-6">
      <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
      <h1 className="text-6xl font-bold text-destructive">404</h1>
      <h2 className="mt-4 text-3xl font-semibold text-foreground">Страницата не е намерена</h2>
      <p className="mt-3 text-lg text-muted-foreground max-w-md">
        Изглежда, че страницата, която търсите, не съществува или е била преместена.
      </p>
      {/* Developer Tip section removed for simplification */}
      <Button asChild className="mt-8 text-lg py-3 px-6">
        <Link href="/">Обратно към Началната страница</Link>
      </Button>
    </div>
  );
}
