// src/components/layout/CookieConsentBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getCookie, setCookie } from '@/lib/cookies';
import { cn } from '@/lib/utils';
import { Cookie, X } from 'lucide-react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'glowy-cookie-consent';

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Ensure this effect runs only on the client
    if (typeof window !== 'undefined') {
      const consent = getCookie(COOKIE_CONSENT_KEY);
      if (consent !== 'true') {
        setIsVisible(true);
      }
    }
  }, []);

  const handleAccept = () => {
    setCookie(COOKIE_CONSENT_KEY, 'true', 365); // Consent for 1 year
    setIsVisible(false);
  };

  const handleDecline = () => {
    // Optionally, set a cookie indicating declined, or just hide
    // For simplicity, we just hide it. User can re-enable via settings if needed.
    setIsVisible(false);
     // You might set a cookie like `glowy-cookie-consent=declined`
     // and then handle logic based on that (e.g., don't load certain scripts)
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[200] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t p-4 shadow-lg",
        "transition-transform duration-500 ease-out",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start md:items-center">
          <Cookie className="h-10 w-10 text-primary mr-4 shrink-0" />
          <div>
            <h2 id="cookie-consent-title" className="text-lg font-semibold text-foreground">
              Този сайт използва "бисквитки"
            </h2>
            <p id="cookie-consent-description" className="text-sm text-muted-foreground max-w-2xl">
              Ние използваме "бисквитки", за да подобрим вашето преживяване на нашия сайт, да анализираме трафика и да персонализираме съдържанието. Като продължавате да използвате сайта, вие се съгласявате с нашата {' '}
              <Link href="/privacy" className="underline hover:text-primary">Политика за поверителност и "бисквитки"</Link>.
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-3 md:mt-0 shrink-0">
          <Button onClick={handleAccept} size="lg">
            Приемам
          </Button>
          <Button variant="outline" onClick={handleDecline} size="lg" aria-label="Затвори банера за бисквитки">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
