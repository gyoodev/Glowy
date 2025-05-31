
'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Added usePathname
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
  Settings,
  DollarSign,
  CreditCard,
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
  { href: '/admin/payments', label: 'Плащания', icon: CreditCard },
  { href: '/admin/settings', label: 'Настройки', icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname(); // Get current path
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        setIsLoading(false);
      }
    });

    return () => {
      console.log('AdminLayout: useEffect cleanup. Unsubscribing from onAuthStateChanged.');
      unsubscribe();
    };
  }, [router, toast]); 

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
        <p className="text-lg">Glowy - Зареждане на административен панел...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    console.log('AdminLayout: Rendering unauthorized state (should be redirecting or access denied)...');
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
            "bg-admin-sidebar-background border-r border-border shadow-md flex flex-col justify-between transition-all duration-300 ease-in-out",
            isSidebarOpen ? "w-64 p-5" : "w-20 p-3 items-center"
          )}
        >
          <div>
            <h1
              className={cn(
                "text-2xl font-bold mb-10 text-primary text-center",
                !isSidebarOpen && "sr-only" 
              )}
            >
              Glowy Админ
            </h1>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Tooltip key={item.label}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-lg hover:bg-admin-sidebar-active-background/70 hover:text-admin-sidebar-active-foreground transition-colors font-medium text-admin-sidebar-foreground",
                          !isSidebarOpen && "justify-center",
                          isActive && "bg-admin-sidebar-active-background text-admin-sidebar-active-foreground font-semibold shadow-sm"
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
                );
              })}
            </nav>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg w-full text-left text-admin-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors font-medium mt-auto",
                  !isSidebarOpen && "justify-center" 
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

        <div className="flex-1 flex flex-col overflow-hidden bg-admin-content-background">
          <header className="h-16 flex items-center px-4 border-b border-border shrink-0 bg-admin-topbar-background">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label={isSidebarOpen ? "Затвори страничната лента" : "Отвори страничната лента"}
              className="text-muted-foreground hover:text-foreground"
            >
              {isSidebarOpen ? <PanelLeftClose size={24} /> : <PanelLeftOpen size={24} />}
            </Button>
            <h2 className="ml-4 text-xl font-semibold text-foreground">
              {navItems.find(item => pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)))?.label || 'Табло'}
            </h2>
            <div className="ml-auto flex items-center space-x-4">
              {/* Future placeholder for global search or user avatar */}
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
