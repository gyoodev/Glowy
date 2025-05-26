
'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserProfile } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  Home,
  Users,
  Briefcase,
  Mail,
  LogOut,
  Newspaper,
  CalendarCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Settings, // Example icon for generic admin link
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/admin', label: 'Табло', icon: Home },
  { href: '/admin/users', label: 'Потребители', icon: Users },
  { href: '/admin/business', label: 'Бизнеси', icon: Briefcase },
  { href: '/admin/bookings', label: 'Резервации', icon: CalendarCheck },
  { href: '/admin/contacts', label: 'Запитвания', icon: Mail },
  { href: '/admin/newsletter', label: 'Бюлетин', icon: Newspaper },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default to closed

  useEffect(() => {
    console.log('AdminLayout: useEffect triggered for auth check.');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('AdminLayout: Auth state changed. User UID:', user ? user.uid : 'null');
      if (user) {
        try {
          console.log('AdminLayout: User authenticated. Fetching profile for UID:', user.uid);
          const profile = await getUserProfile(user.uid);
          if (profile) {
            console.log('AdminLayout: User profile fetched:', profile);
            if (profile.role === 'admin') {
              console.log('AdminLayout: User is admin. Authorizing access.');
              setIsAuthorized(true);
            } else {
              const roleDetected = profile.role || 'неопределена';
              console.log('AdminLayout: User is NOT admin. Role:', roleDetected, '. Redirecting to home.');
              toast({
                title: 'Достъп отказан',
                description: `Нямате права за достъп до административния панел. Вашата роля е: ${roleDetected}.`,
                variant: 'destructive',
              });
              router.push('/');
            }
          } else {
            console.error('AdminLayout: User profile not found in Firestore for UID:', user.uid, '. Redirecting to home.');
            toast({
              title: 'Грешка при проверка на права',
              description: 'Потребителският Ви профил не беше намерен или нямате зададена роля.',
              variant: 'destructive',
            });
            router.push('/');
          }
        } catch (error: any) {
          console.error('AdminLayout: Error fetching user profile:', error);
          let errorMessage = 'Неуспешно извличане на потребителски данни.';
          if (error.message) {
            errorMessage += `: ${error.message}`;
          }
          if (error.code === 'permission-denied') {
            errorMessage = "Грешка с правата за достъп до базата данни. Проверете Firestore правилата.";
            console.error("AdminLayout: Firestore permission denied while fetching user profile for admin check. Ensure admins can read their own profiles.");
          }
          toast({
            title: 'Грешка при проверка на права',
            description: errorMessage,
            variant: 'destructive',
          });
          router.push('/');
        } finally {
          console.log('AdminLayout: Setting isLoading to false in auth success/role check path.');
          setIsLoading(false);
        }
      } else {
        console.log('AdminLayout: User is not authenticated. Redirecting to login.');
        toast({
          title: 'Необходимо е удостоверяване',
          description: 'Моля, влезте, за да достъпите административния панел.',
        });
        router.push('/login');
        // Ensure isLoading is set false even on redirect for unauthenticated user
        setIsLoading(false);
      }
    });

    return () => {
      console.log('AdminLayout: useEffect cleanup. Unsubscribing from onAuthStateChanged.');
      unsubscribe();
    };
  }, [router, toast]); // Added toast to dependency array as it's used in the effect

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({ title: 'Успешен изход', description: 'Излязохте от системата.' });
      console.log('AdminLayout: User signed out.');
      router.push('/login');
    } catch (error) {
      console.error('AdminLayout: Error signing out:', error);
      toast({ title: 'Грешка при изход', variant: 'destructive' });
    }
  };

  if (isLoading) {
    console.log('AdminLayout: Rendering loading state...');
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <p className="text-lg">Зареждане на административен панел...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    console.log('AdminLayout: Rendering unauthorized state (should be redirecting or access denied)...');
    // This return might be momentarily visible before redirect, or if redirect fails.
    return (
      <div className="flex h-screen items-center justify-center bg-background text-destructive">
        <p className="text-lg">Нямате достъп до тази страница или се пренасочвате...</p>
      </div>
    );
  }

  console.log('AdminLayout: Rendering authorized admin content. Sidebar open state:', isSidebarOpen);
  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen bg-background text-foreground">
        <aside
          className={cn(
            "bg-muted/40 shadow-md flex flex-col justify-between transition-all duration-300 ease-in-out",
            isSidebarOpen ? "w-64 p-5" : "w-20 p-3 items-center" // Adjusted width for closed state
          )}
        >
          <div>
            <h1
              className={cn(
                "text-2xl font-bold mb-10 text-primary text-center",
                !isSidebarOpen && "sr-only" // Hide text when closed, keep for screen readers
              )}
            >
              Glowy Админ
            </h1>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors font-medium",
                        !isSidebarOpen && "justify-center" // Center icon when closed
                      )}
                    >
                      <item.icon size={isSidebarOpen ? 20 : 24} />
                      {isSidebarOpen && <span>{item.label}</span>}
                    </Link>
                  </TooltipTrigger>
                  {!isSidebarOpen && (
                    <TooltipContent side="right" sideOffset={5}>
                      <p>{item.label}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </nav>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg w-full text-left hover:bg-destructive/80 hover:text-destructive-foreground transition-colors font-medium mt-auto",
                  !isSidebarOpen && "justify-center" // Center icon when closed
                )}
              >
                <LogOut size={isSidebarOpen ? 20 : 24} />
                {isSidebarOpen && <span>Изход</span>}
              </button>
            </TooltipTrigger>
            {!isSidebarOpen && (
              <TooltipContent side="right" sideOffset={5}>
                <p>Изход</p>
              </TooltipContent>
            )}
          </Tooltip>
        </aside>

        {/* Main content area wrapper */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar for the toggle button */}
          <header className="h-16 flex items-center px-4 border-b shrink-0 bg-card"> {/* Added bg-card for visibility */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label={isSidebarOpen ? "Затвори страничната лента" : "Отвори страничната лента"}
              className="text-muted-foreground hover:text-foreground"
            >
              {isSidebarOpen ? <PanelLeftClose size={24} /> : <PanelLeftOpen size={24} />}
            </Button>
          </header>
          {/* Actual page content */}
          <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
