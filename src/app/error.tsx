
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ServerCrash, RefreshCw, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <Card className="max-w-xl w-full text-center shadow-2xl border-destructive/50">
        <CardHeader className="bg-destructive/10">
          <div className="mx-auto bg-destructive/20 p-3 rounded-full w-fit">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <CardTitle className="text-xl font-semibold text-destructive mt-3">
            Възникна Неочаквана Грешка
          </CardTitle>
          <CardDescription className="text-destructive/90">
            Извиняваме се за неудобството.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6 space-y-4">
          <p className="text-muted-foreground">
            Екипът ни е уведомен за проблема и работи по отстраняването му.
            Можете да опитате да презаредите страницата или да се върнете към началната страница.
          </p>
          {error?.message && (
             <details className="p-3 bg-muted rounded-md text-left text-xs">
                <summary className="cursor-pointer font-medium text-muted-foreground">Технически детайли</summary>
                <code className="block whitespace-pre-wrap break-all mt-2 font-mono text-muted-foreground">
                    {error.message}
                    {error.digest && ` (Digest: ${error.digest})`}
                </code>
             </details>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-4 border-t pt-6">
          <Button
            onClick={() => reset()}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Опитай отново
          </Button>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Начална страница
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
