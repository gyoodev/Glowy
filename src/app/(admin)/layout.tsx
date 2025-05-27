'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
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
  Sparkles, // Glowy App Icon
  Search as SearchIcon,
  Bell,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
  { href: '/admin/payments', label: 'Плащания', icon: DollarSign },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Closed by default
  const [adminName, setAdminName] = useState('Администратор');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile && profile.role === 'admin') {
            setIsAuthorized(true);
            setAdminName(profile.displayName || profile.name || 'Администратор');
          } else {
            toast({ title: 'Достъп отказан', description: 'Нямате права за достъп до административния панел.', variant: 'destructive' });
            router.push('/');
          }
        } catch (error) {
          console.error('AdminLayout: Error fetching user profile:', error);
          toast({ title: 'Грешка', description: 'Неуспешно извличане на потребителски данни.', variant: 'destructive' });
          router.push('/');
        } finally {
          setIsLoading(false);
        }
      } else {
        toast({ title: 'Необходимо е удостоверяване', description: 'Моля, влезте, за да достъпите административния панел.' });
        router.push('/login');
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router, toast]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Успешен изход', description: 'Излязохте от системата.' });
      router.push('/login');
    } catch (error) {
      console.error('AdminLayout: Error signing out:', error);
      toast({ title: 'Грешка при изход', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-admin-content-background text-foreground">
        <p className="text-lg">Зареждане на административен панел...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-admin-content-background text-destructive">
        <p className="text-lg">Нямате достъп или се пренасочвате...</p>
      </div>
    );
  }
  
  // Determine current page title (very basic for now)
  const currentPageTitle = navItems.find(item => pathname === item.href)?.label || 'Табло';


  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen bg-admin-content-background text-admin-sidebar-foreground">
        {/* Sidebar */}
        <aside
          className={cn(
            "bg-admin-sidebar-background flex flex-col justify-between shadow-lg transition-all duration-300 ease-in-out border-r border-admin-sidebar-border",
            isSidebarOpen ? "w-64 p-4" : "w-20 p-3 items-center"
          )}
        >
          <div>
            <Link href="/admin" className={cn("flex items-center gap-2 mb-8 px-2", isSidebarOpen ? "justify-start" : "justify-center")}>
              <Sparkles className="h-8 w-8 text-primary" />
              {isSidebarOpen && <span className="text-xl font-bold text-primary">Glowy Админ</span>}
            </Link>
            
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href === '/admin' && pathname.startsWith('/admin/'));
                return (
                  <Tooltip key={item.label}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-lg text-sm font-medium text-admin-sidebar-foreground hover:bg-admin-sidebar-active-background hover:text-admin-sidebar-active-foreground transition-colors",
                          isActive && "bg-admin-sidebar-active-background text-admin-sidebar-active-foreground font-semibold",
                          !isSidebarOpen && "justify-center"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-admin-sidebar-active-foreground" : "text-muted-foreground group-hover:text-admin-sidebar-active-foreground")} />
                        {isSidebarOpen && <span>{item.label}</span>}
                      </Link>
                    </TooltipTrigger>
                    {!isSidebarOpen && (
                      <TooltipContent side="right" sideOffset={5} className="bg-card text-card-foreground">
                        <p>{item.label}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </nav>
          </div>

          <div className={cn("mt-auto space-y-2", !isSidebarOpen && "flex flex-col items-center")}>
            <div className={cn("text-xs text-muted-foreground text-center px-2", !isSidebarOpen && "hidden")}>
              <p>&copy; {new Date().getFullYear()} Glowy</p>
              <p>Made with <span className="text-red-500">♥</span> by GKDEV</p>
            </div>
             <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className={cn(
                    "flex items-center gap-3 p-2.5 w-full text-left text-sm font-medium text-admin-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors",
                    !isSidebarOpen && "justify-center aspect-square h-auto"
                  )}
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  {isSidebarOpen && <span>Изход</span>}
                </Button>
              </TooltipTrigger>
              {!isSidebarOpen && (
                <TooltipContent side="right" sideOffset={5} className="bg-card text-card-foreground">
                  <p>Изход</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="h-16 flex items-center justify-between px-6 border-b shrink-0 bg-admin-topbar-background shadow-sm">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label={isSidebarOpen ? "Затвори страничната лента" : "Отвори страничната лента"}
                className="text-muted-foreground hover:text-foreground"
              >
                {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
              </Button>
              <h1 className="text-xl font-semibold text-foreground">{currentPageTitle}</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Input 
                  type="search" 
                  placeholder="Търсене..." 
                  className="bg-input border-border pl-10" 
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Bell size={20} />
                <span className="sr-only">Известия</span>
              </Button>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/40x40.png" alt={adminName} data-ai-hint="admin avatar" />
                  <AvatarFallback>{adminName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{adminName}</p>
                  <p className="text-xs text-muted-foreground">Администратор</p>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <ChevronDown size={16} />
                </Button>
              </div>
            </div>
          </header>
          
          {/* Page Content */}
          <main className="flex-1 p-6 overflow-y-auto bg-admin-content-background">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
