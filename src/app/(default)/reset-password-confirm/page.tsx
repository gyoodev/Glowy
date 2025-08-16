
import React, { Suspense } from 'react';
import ResetPasswordConfirmForm from './ResetPasswordConfirmForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KeyRound } from 'lucide-react';

function LoadingFallback() {
    return (
        <Card className="shadow-xl">
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold flex items-center justify-center">
                    <KeyRound className="mr-3 h-8 w-8 text-primary" />
                    Въведете Нова Парола
                </CardTitle>
                <CardDescription>Зареждане на формата...</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground">Проверка на кода...</p>
            </CardContent>
        </Card>
    );
}

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordConfirmForm />
    </Suspense>
  );
}
