
'use client';

import type { SiteAlert } from '@/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Megaphone, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertBoxProps {
  alert: SiteAlert;
}

const alertConfig = {
  important: {
    icon: AlertCircle,
    className: "border-red-500/50 text-red-700 dark:text-red-300 dark:border-red-500/30 [&>svg]:text-red-600 dark:[&>svg]:text-red-400 bg-red-50 dark:bg-red-900/20",
    title: "Важно съобщение",
  },
  message: {
    icon: Megaphone,
    className: "border-primary/50 text-primary-700 dark:text-primary-300 dark:border-primary/30 [&>svg]:text-primary dark:[&>svg]:text-primary-400 bg-primary/10 dark:bg-primary/20",
    title: "Съобщение от екипа",
  },
  info: {
    icon: Info,
    className: "border-sky-500/50 text-sky-700 dark:text-sky-300 dark:border-sky-500/30 [&>svg]:text-sky-600 dark:[&>svg]:text-sky-400 bg-sky-50 dark:bg-sky-900/20",
    title: "Информация",
  },
};

export function AlertBox({ alert }: AlertBoxProps) {
  const config = alertConfig[alert.type] || alertConfig.info;
  const Icon = config.icon;

  return (
    <Alert className={cn("mb-8 animate-in fade-in-50 duration-500", config.className)}>
      <Icon className="h-5 w-5" />
      <AlertTitle className="font-bold">{config.title}</AlertTitle>
      <AlertDescription>
        {alert.message}
      </AlertDescription>
    </Alert>
  );
}
