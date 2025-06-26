
'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Settings,
  CreditCard,
  Menu,
  PanelLeft, 
  Sparkles as AppIcon,
  MessageSquareText, // Added for Reviews
  Gift, // Added for Promotions
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'; 

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
  { href: '/admin/reviews', label: 'Отзиви', icon: MessageSquareText },
  { href: '/admin/promotions', label: 'Промоции', icon: Gift },
  { href: '/admin/contacts', label: 'Запитвания', icon: Mail },
  { href: '/admin/newsletter', label: 'Бюлетин', icon: Newspaper },
  { href: '/admin/payments', label: 'Плащания', icon: CreditCard },
  { href: '/admin/settings', label: 'Настройки', icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile?.role === 'admin') {
            setIsAuthorized(true);
          } else {
            toast({
              title: 'Достъп отказан',
              description: `Нямате права за достъп до административния панел.`,
              variant: 'destructive',
            });
            router.push('/');
          }
        } catch (error) {
          toast({
            title: 'Грешка при проверка на права',
            description: 'Неуспешно извличане на потребителски данни.',
            variant: 'destructive',
          });
          router.push('/');
        } finally {
          setIsLoading(false);
        }
      } else {
        toast({
          title: 'Необходимо е удостоверяване',
          description: 'Моля, влезте, за да достъпите административния панел.',
        });
        router.push('/login');
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router, toast]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({ title: 'Успешен изход', description: 'Излязохте от системата.' });
      router.push('/login');
    } catch (error) {
      toast({ title: 'Грешка при изход', variant: 'destructive' });
    }
  };

  const isActive = (href: string) => {
    if (!pathname) {
      return false; // Pathname is not yet available
    }
    // Exact match
    if (pathname === href) {
      return true;
    }
    // For non-base admin routes, check if pathname starts with href
    // e.g., if href="/admin/users" and pathname="/admin/users/edit/123"
    // This also handles the case where href="/admin" and pathname="/admin/users" (won't match as active)
    if (href !== '/admin' && pathname.startsWith(href)) {
      return true;
    }
    return false;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <p className="text-lg">Glaura - Зареждане на административен панел...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-destructive">
        <p className="text-lg">Нямате достъп до тази страница или се пренасочвате...</p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen bg-background text-foreground">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden md:flex bg-admin-sidebar-background border-r border-border shadow-md flex-col justify-between transition-all duration-300 ease-in-out",
            isDesktopSidebarOpen ? "w-64 p-5" : "w-20 p-3 items-center"
          )}
        >
          <div>
            <h1
              className={cn(
                "text-2xl font-bold mb-10 text-primary text-center",
                !isDesktopSidebarOpen && "sr-only"
              )}
            >
              Glaura Админ
            </h1>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg hover:bg-admin-sidebar-active-background/70 hover:text-admin-sidebar-active-foreground transition-colors font-medium text-admin-sidebar-foreground",
                    !isDesktopSidebarOpen && "justify-center",
                    isActive(item.href) && "bg-admin-sidebar-active-background text-admin-sidebar-active-foreground font-semibold shadow-sm"
                  )}
                  aria-label={isDesktopSidebarOpen ? undefined : item.label} // Add aria-label when collapsed for accessibility
                >
                  <item.icon size={isDesktopSidebarOpen ? 20 : 24} />
                  {isDesktopSidebarOpen && <span>{item.label}</span>}
                </Link>
              ))}
            </nav>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg w-full text-left text-admin-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors font-medium mt-auto",
                  !isDesktopSidebarOpen && "justify-center"
                )}
              >
                <LogOut size={isDesktopSidebarOpen ? 20 : 24} />
                {isDesktopSidebarOpen && <span>Изход</span>}
              </button>
            </TooltipTrigger>
            {!isDesktopSidebarOpen && (
              <TooltipContent side="right" sideOffset={5}>
                <p>Изход</p>
              </TooltipContent>
            )}
          </Tooltip>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden bg-admin-content-background">
          {/* Header with Mobile Menu Trigger */}
          <header className="h-16 flex items-center px-4 border-b border-border shrink-0 bg-admin-topbar-background">
            {/* Mobile Menu Trigger (Sheet) */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <SheetHeader className="mb-4 border-b pb-4">
                  <SheetTitle>
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 text-lg font-semibold"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <AppIcon className="h-6 w-6 text-primary" />
                      <span>Glaura Админ</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <nav className="grid gap-2 text-lg font-medium">
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        isActive(item.href) && "text-primary bg-muted"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-destructive hover:text-destructive-foreground hover:bg-destructive justify-start w-full"
                  >
                    <LogOut className="h-5 w-5" />
                    Изход
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Sidebar Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
              aria-label={isDesktopSidebarOpen ? "Затвори страничната лента" : "Отвори страничната лента"}
              className="text-muted-foreground hover:text-foreground hidden md:flex ml-2"
            >
              <PanelLeft size={24} />
            </Button>
            
            <h2 className="ml-4 text-xl font-semibold text-foreground">
              {navItems.find(item => isActive(item.href))?.label || 'Табло'}
            </h2>
            <div className="ml-auto flex items-center space-x-4">
              {/* Future placeholder */}
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
