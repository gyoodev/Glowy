'use client';
import React, { useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, getUserProfile } from '@/lib/firebase'; // Using @ alias
import { useToast } from '@/hooks/use-toast'; // Using @ alias
import { Home, Users, Briefcase, CalendarCheck, MessageSquare as IconMessageSquare, Newspaper, LogOut, Menu as IconMenu, Settings } from 'lucide-react'; // Renamed to avoid conflict
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { onAuthStateChanged } from 'firebase/auth';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    console.log('AdminLayout: Auth check effect triggered.');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('AdminLayout: User authenticated. UID:', user.uid);
        try {
          const profile = await getUserProfile(user.uid);
          if (profile && profile.role === 'admin') {
            console.log('AdminLayout: User is_AUTHORIZED_ as admin.');
            setIsAuthorized(true);
          } else {
            console.log('AdminLayout: User NOT an admin. Role:', profile?.role);
            toast({ title: 'Достъп отказан', description: 'Нямате администраторски права за достъп до тази страница.', variant: 'destructive' });
            router.push('/');
          }
        } catch (error) {
          console.error('AdminLayout: Error fetching user profile:', error);
          toast({ title: 'Грешка при проверка', description: 'Неуспешно извличане на потребителски профил. Моля, опитайте да влезете отново.', variant: 'destructive' });
          router.push('/login');
        }
      } else {
        console.log('AdminLayout: User not authenticated.');
        toast({ title: 'Необходимо е удостоверяване', description: 'Моля, влезте, за да достъпите административния панел.', variant: 'default' });
        router.push('/login');
      }
      setIsLoading(false);
    });

    return () => {
      console.log('AdminLayout: Unsubscribing auth listener.');
      unsubscribe();
    };
  }, [router, toast]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen bg-background text-foreground">Зареждане на административен панел... Моля, изчакайте.</div>;
  }

  if (!isAuthorized) {
    // This state should ideally not be visible for long due to redirects.
    return <div className="flex justify-center items-center min-h-screen bg-background text-foreground">Проверка на оторизация... Ако това съобщение остане, може да нямате достъп.</div>;
  }

  const adminNavItems = [
    { href: '/admin', label: 'Табло', icon: Home },
    { href: '/admin/users', label: 'Потребители', icon: Users },
    { href: '/admin/business', label: 'Бизнеси', icon: Briefcase },
    { href: '/admin/bookings', label: 'Резервации', icon: CalendarCheck },
    { href: '/admin/contacts', label: 'Запитвания', icon: IconMessageSquare },
    { href: '/admin/newsletter', label: 'Бюлетин', icon: Newspaper },
    // { href: '/admin/settings', label: 'Настройки', icon: Settings }, // Example for future
  ];

  const NavLinks = () => (
    <>
      {adminNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <item.icon className="mr-3 h-5 w-5" />
          {item.label}
        </Link>
      ))}
    </>
  );

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    try {
      await auth.signOut();
      toast({ title: 'Изход успешен', description: 'Вие излязохте от своя акаунт.' });
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: 'Грешка при изход', description: 'Възникна грешка при опита за изход.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex min-h-screen bg-muted/40 text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border fixed inset-y-0">
        <div className="flex items-center h-16 px-6 border-b border-sidebar-border shrink-0">
          <Link href="/admin" className="text-xl font-bold text-sidebar-primary">
            Админ Панел
          </Link>
        </div>
        <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
          <NavLinks />
        </nav>
        <div className="p-4 mt-auto border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Изход
          </Button>
        </div>
      </aside>

      {/* Mobile Header and Sheet Menu */}
      <div className="md:ml-64 flex-1 flex flex-col min-w-0"> {/* Added min-w-0 for flex child */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 border-b bg-background shadow-sm md:hidden shrink-0">
          <Link href="/admin" className="text-lg font-semibold text-primary">
            Админ Панел
          </Link>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <IconMenu className="h-6 w-6" />
                <span className="sr-only">Отвори менюто</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-xs bg-sidebar text-sidebar-foreground p-0 flex flex-col">
              <SheetTitle className="sr-only">Admin Menu</SheetTitle>
              <div className="flex items-center h-16 px-6 border-b border-sidebar-border shrink-0">
                <Link href="/admin" className="text-xl font-bold text-sidebar-primary" onClick={() => setIsMobileMenuOpen(false)}>
                  Админ Панел
                </Link>
              </div>
              <nav className="py-6 space-y-1 px-2 flex-1 overflow-y-auto">
                <NavLinks />
              </nav>
              <div className="p-4 mt-auto border-t border-sidebar-border">
                 <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Изход
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
