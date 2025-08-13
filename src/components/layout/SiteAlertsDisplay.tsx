
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { SiteAlert } from "@/types";
import { cn } from "@/lib/utils";

const alertTypeConfig = {
    important: {
        icon: <AlertTriangle />,
        iconColor: "text-red-500",
    },
    info: {
        icon: <Info />,
        iconColor: "text-primary",
    },
    success: {
        icon: <CheckCircle />,
        iconColor: "text-green-500",
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
                // Split message by newline to create list items
                const messageItems = alert.message.split('\\n').map((item, index) => (
                    <li key={index} className="text-sm text-primary/80 dark:text-primary-foreground/80">{item}</li>
                ));

                return (
                    <div key={alert.id} className="flex items-start gap-4 rounded-lg border border-primary/50 bg-primary/10 p-4">
                         <div className={cn("h-6 w-6 mt-1 flex-shrink-0", config.iconColor)}>
                            {React.cloneElement(config.icon, { className: "h-full w-full" })}
                         </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-base text-primary dark:text-primary-foreground">{alert.title}</h3>
                            <ul className="mt-2 list-disc pl-5 space-y-1">
                                {messageItems}
                            </ul>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
