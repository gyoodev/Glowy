'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, getUserProfile } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Home, Users, Briefcase, Mail, LogOut, Newspaper, CalendarCheck, FileText, Clock, Image as ImageIcon, Gift, Sparkles, MapPin, Phone, Star, MessageSquareText, Edit3, Eye, List } from 'lucide-react'; // Added more icons for sidebar

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  // const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null); // CurrentUser state might not be needed if only used in effect

  useEffect(() => {
    console.log('AdminLayout: useEffect triggered for auth check.');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // setCurrentUser(user); // Update currentUser state
      if (user) {
        console.log('AdminLayout: User is authenticated. UID:', user.uid);
        try {
          const profile = await getUserProfile(user.uid);
          console.log('AdminLayout: User profile fetched:', profile);
          if (profile && profile.role === 'admin') {
            console.log('AdminLayout: User is admin. Authorizing access.');
            setIsAuthorized(true);
          } else {
            console.log('AdminLayout: User is NOT admin or profile missing. Role:', profile?.role, 'Redirecting to home.');
            toast({
              title: 'Достъп отказан',
              description: 'Нямате права за достъп до административния панел.',
              variant: 'destructive',
            });
            router.push('/'); // Redirect to public homepage
            setIsAuthorized(false);
          }
        } catch (error) {
          console.error('AdminLayout: Error fetching user profile:', error);
          toast({
            title: 'Грешка при проверка на права',
            description: 'Неуспешно извличане на потребителски данни.',
            variant: 'destructive',
          });
          router.push('/'); // Redirect to public homepage on error
          setIsAuthorized(false);
        } finally {
          console.log('AdminLayout: Setting isLoading to false.');
          setIsLoading(false);
        }
      } else {
        console.log('AdminLayout: User is not authenticated. Redirecting to login.');
        toast({
          title: 'Необходимо е удостоверяване',
          description: 'Моля, влезте, за да достъпите административния панел.',
        });
        router.push('/login');
        setIsAuthorized(false);
        setIsLoading(false);
      }
    });

    return () => {
      console.log('AdminLayout: Unsubscribing from onAuthStateChanged.');
      unsubscribe();
    };
  }, [router, toast]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({ title: 'Успешен изход', description: 'Излязохте от системата.' });
      router.push('/login');
    } catch (error) {
      console.error('AdminLayout: Error signing out:', error);
      toast({ title: 'Грешка при изход', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <p className="text-lg">Зареждане на административен панел...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    // This state should ideally not be reached for long if redirects work.
    // It's a fallback or if user somehow bypasses initial redirect logic.
    return (
      <div className="flex h-screen items-center justify-center bg-background text-destructive">
        <p className="text-lg">Нямате достъп до тази страница или се пренасочвате...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-card text-card-foreground">
      <aside className="w-64 bg-muted/40 p-5 shadow-md flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-10 text-primary text-center">
            Glowy Админ
          </h1>
          <nav className="space-y-2">
            <Link href="/admin" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors font-medium">
              <Home size={20} />
              <span>Табло</span>
            </Link>
            <Link href="/admin/users" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors font-medium">
              <Users size={20} />
              <span>Потребители</span>
            </Link>
            <Link href="/admin/business" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors font-medium">
              <Briefcase size={20} />
              <span>Бизнеси</span>
            </Link>
            <Link href="/admin/bookings" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors font-medium">
              <CalendarCheck size={20} />
              <span>Резервации</span>
            </Link>
            <Link href="/admin/contacts" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors font-medium">
              <Mail size={20} />
              <span>Запитвания</span>
            </Link>
            <Link href="/admin/newsletter" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors font-medium">
              <Newspaper size={20} />
              <span>Бюлетин</span>
            </Link>
            {/* Add more links as needed */}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 p-3 rounded-lg w-full text-left hover:bg-destructive/80 hover:text-destructive-foreground transition-colors font-medium mt-auto"
        >
          <LogOut size={20} />
          <span>Изход</span>
        </button>
      </aside>
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto bg-background text-foreground">
        {children}
      </main>
    </div>
  );
}
