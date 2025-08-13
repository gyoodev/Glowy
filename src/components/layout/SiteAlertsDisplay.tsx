
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Megaphone, Info } from "lucide-react";
import { SiteAlert } from "@/types";
import { cn } from "@/lib/utils";

const alertTypeConfig = {
    important: {
        icon: <AlertTriangle className="h-5 w-5" />,
        className: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        title: "Важно съобщение"
    },
    info: {
        icon: <Info className="h-5 w-5" />,
        className: "border-blue-500/50 text-blue-800 dark:border-blue-500/80 dark:text-blue-300 [&>svg]:text-blue-500",
        title: "Информация"
    },
    success: {
        icon: <Megaphone className="h-5 w-5" />,
        className: "border-primary/50 text-primary dark:border-primary [&>svg]:text-primary",
        title: "Новини"
    },
};


export function SiteAlertsDisplay() {
    const [alerts, setAlerts] = useState<SiteAlert[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAlerts = useCallback(async () => {
        setIsLoading(true);
        try {
            const alertsCollection = collection(firestore, 'siteAlerts');
            const q = query(alertsCollection, where('isActive', '==', true), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const fetchedAlerts: SiteAlert[] = querySnapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data(),
            } as SiteAlert));
            setAlerts(fetchedAlerts);
        } catch (error) {
            console.error("Error fetching active site alerts:", error);
            // Don't show an error to the user, just fail silently.
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    if (isLoading || alerts.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4 my-8">
            {alerts.map((alert) => {
                const config = alertTypeConfig[alert.type] || alertTypeConfig.info;
                return (
                    <Alert key={alert.id} className={cn("flex items-start", config.className)}>
                        <div className="flex-shrink-0">{config.icon}</div>
                        <div className="ml-4">
                            <AlertTitle className="font-bold">{config.title}</AlertTitle>
                            <AlertDescription>{alert.message}</AlertDescription>
                        </div>
                    </Alert>
                );
            })}
        </div>
    );
}
