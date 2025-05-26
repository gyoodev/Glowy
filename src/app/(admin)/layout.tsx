
'use client';

import type { ReactNode } from 'react';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserProfile } from '../../lib/firebase'; // Corrected relative path
import { Button } from '@/components/ui/button';
import { Home, Users, Briefcase, CalendarCheck, MessageSquare, Newspaper, LogOut, LayoutDashboard, Menu } from 'lucide-react'; // Added Menu
import { useToast } from '../../hooks/use-toast';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const { toast } = useToast(); // useToast hook

  useEffect(() => {
    console.log('AdminLayout: useEffect for auth check triggered.');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('AdminLayout: User is authenticated with UID:', user.uid);
        try {
          const profile = await getUserProfile(user.uid);
          if (profile && profile.role === 'admin') {
            console.log('AdminLayout: User is authorized as admin.');
            setIsAuthorized(true);
            // toast({ title: 'Достъп разрешен', description: 'Вие сте в административния панел.' });
          } else {
            console.log('AdminLayout: User is not an admin or profile not found. Role:', profile?.role);
            toast({ title: 'Достъп отказан', description: 'Нямате необходимите права. Пренасочване...', variant: 'destructive' });
            router.push('/'); // Redirect to homepage if not admin
            setIsAuthorized(false);
          }
        } catch (error) {
          console.error('AdminLayout: Error fetching user profile:', error);
          toast({ title: 'Грешка при проверка на профила', description: 'Възникна грешка. Пренасочване...', variant: 'destructive' });
          router.push('/'); // Redirect on error
          setIsAuthorized(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log('AdminLayout: No user authenticated. Redirecting to login.');
        toast({ title: 'Необходимо е удостоверяване', description: 'Пренасочване към страницата за вход...', variant: 'default' });
        router.push('/login');
        setIsAuthorized(false);
        setIsLoading(false); // Make sure loading is set to false here too
      }
    });

    return () => unsubscribe();
  }, [router, toast]); // Added toast to dependency array

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary text-foreground">
        <div className="text-center p-8">
          <LayoutDashboard className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-xl font-semibold">Зареждане на административния панел...</p>
          <p className="text-muted-foreground">Моля, изчакайте.</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    // This state should ideally not be reached for long if redirects are working,
    // but it's a fallback. Or, it can be a brief screen before redirect.
    return (
      <div className="flex items-center justify-center min-h-screen bg-destructive/10 text-destructive-foreground">
        <div className="text-center p-8 max-w-md">
          <Users className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Достъп отказан</h1>
          <p className="mb-4">Нямате необходимите права за достъп до тази секция. Пренасочване...</p>
          <Button variant="outline" onClick={() => router.push('/')}>
            <Home className="mr-2 h-4 w-4" />
            Към Начална страница
          </Button>
        </div>
      </div>
    );
  }

  // If authorized, render the admin layout
  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="w-64 bg-card text-card-foreground p-6 shadow-lg hidden md:flex flex-col justify-between">
        <div>
          <div className="mb-8">
            <Link href="/admin" className="flex items-center space-x-2 text-primary hover:text-primary/80 mb-6">
                <LayoutDashboard className="h-7 w-7" />
                <span className="font-bold text-xl">Админ Панел</span>
            </Link>
          </div>
          <nav className="space-y-2">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/admin">
                <LayoutDashboard className="mr-2 h-5 w-5" /> Табло
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/admin/users">
                <Users className="mr-2 h-5 w-5" /> Потребители
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/admin/business">
                <Briefcase className="mr-2 h-5 w-5" /> Бизнеси
              </Link>
            </Button>
             <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/admin/bookings">
                <CalendarCheck className="mr-2 h-5 w-5" /> Резервации
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/admin/contacts">
                <MessageSquare className="mr-2 h-5 w-5" /> Запитвания
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/admin/newsletter">
                <Newspaper className="mr-2 h-5 w-5" /> Бюлетин
              </Link>
            </Button>
          </nav>
        </div>
        <div>
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/">
              <Home className="mr-2 h-5 w-5" /> Към сайта
            </Link>
          </Button>
           <Button variant="ghost" className="w-full justify-start mt-2 text-destructive hover:text-destructive-foreground hover:bg-destructive" onClick={() => auth.signOut().then(() => router.push('/login'))}>
            <LogOut className="mr-2 h-5 w-5" /> Изход
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* Mobile Menu Trigger - consider adding a sheet for mobile */}
        <div className="md:hidden mb-4">
             <Button variant="outline" size="icon" onClick={() => alert("Мобилното меню е в процес на разработка")}>
                <Menu className="h-6 w-6" />
             </Button>
        </div>
        {children}
      </main>
    </div>
  );
}
