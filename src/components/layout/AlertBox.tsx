'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Megaphone, Info } from "lucide-react";
import { SiteAlert } from "@/types";
import { cn } from "@/lib/utils";

interface AlertBoxProps {
  alert: SiteAlert;
}

export function AlertBox({ alert }: AlertBoxProps) {
  const getAlertProps = (type: SiteAlert['type']) => {
    switch (type) {
      case 'important':
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          className: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive bg-destructive/10",
          title: "Важно съобщение"
        };
      case 'message':
        return {
          icon: <Megaphone className="h-5 w-5" />,
          className: "border-primary/50 text-primary dark:border-primary [&>svg]:text-primary bg-primary/10",
          title: "Съобщение"
        };
      case 'info':
      default:
        return {
          icon: <Info className="h-5 w-5" />,
          className: "border-blue-400/50 text-blue-600 dark:border-blue-400 [&>svg]:text-blue-600 bg-blue-500/10",
          title: "Информация"
        };
    }
  };

  const alertProps = getAlertProps(alert.type);

  return (
    <Alert className={cn("mb-6", alertProps.className)}>
      {alertProps.icon}
      <AlertTitle>{alertProps.title}</AlertTitle>
      <AlertDescription>
        {alert.message}
      </AlertDescription>
    </Alert>
  );
}
