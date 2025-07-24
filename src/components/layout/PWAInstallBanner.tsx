
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getCookie, setCookie } from '@/lib/cookies';
import { Download, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const PWA_INSTALL_COOKIE_KEY = 'glowy-pwa-install-choice';
const PWA_LATER_DURATION_DAYS = 7;
const PWA_DISMISS_DURATION_DAYS = 365;

// Define the interface for the event object
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallBanner() {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      event.preventDefault();
      // Stash the event so it can be triggered later.
      const typedEvent = event as BeforeInstallPromptEvent;
      
      // Check cookie status before showing the banner
      const userChoice = getCookie(PWA_INSTALL_COOKIE_KEY);
      if (!userChoice) {
        setInstallPromptEvent(typedEvent);
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) {
      return;
    }
    // Show the install prompt
    await installPromptEvent.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA installation');
      // Hide banner permanently if accepted
      setCookie(PWA_INSTALL_COOKIE_KEY, 'dismissed', PWA_DISMISS_DURATION_DAYS);
    } else {
      console.log('User dismissed the PWA installation');
    }
    // Hide the banner regardless of the choice
    setIsVisible(false);
    setInstallPromptEvent(null);
  };

  const handleLaterClick = () => {
    setCookie(PWA_INSTALL_COOKIE_KEY, 'later', PWA_LATER_DURATION_DAYS);
    setIsVisible(false);
  };

  const handleDismissClick = () => {
    setCookie(PWA_INSTALL_COOKIE_KEY, 'dismissed', PWA_DISMISS_DURATION_DAYS);
    setIsVisible(false);
  };
  
  if (!isVisible || !installPromptEvent) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[200] p-4",
        "transition-transform duration-500 ease-out",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
    >
      <div className="container mx-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border border-border rounded-lg shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
        <div className="flex items-center">
            <div className="relative h-12 w-12 mr-4 shrink-0">
                <Image src="/favicon/apple-touch-icon.png" alt="Glaura App Icon" layout="fill" className="rounded-lg"/>
            </div>
          <div>
            <h2 id="pwa-install-title" className="text-base font-semibold text-foreground">
              Инсталирайте Glaura
            </h2>
            <p id="pwa-install-description" className="text-sm text-muted-foreground">
              Добавете Glaura на началния си екран за бърз и лесен достъп.
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0 shrink-0">
          <Button onClick={handleInstallClick} size="sm" className="bg-primary hover:bg-primary/90">
            <Download className="mr-2 h-4 w-4" />
            Инсталирай
          </Button>
          <Button onClick={handleLaterClick} variant="outline" size="sm">
            <Clock className="mr-2 h-4 w-4" />
            По-късно
          </Button>
          <Button variant="ghost" onClick={handleDismissClick} size="icon" aria-label="Затвори банера за инсталация">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
