
'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, getUserProfile } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Home, Users, Briefcase, Mail, LogOut, Newspaper, CalendarCheck } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    console.log('AdminLayout: useEffect triggered for auth check.');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('AdminLayout: User is authenticated. UID:', user.uid);
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            console.log('AdminLayout: User profile fetched:', profile);
            if (profile.role === 'admin') {
              console.log('AdminLayout: User is admin. Authorizing access.');
              toast({
                title: 'Достъп разрешен',
                description: 'Вие сте влезли като администратор.',
                variant: 'default',
              });
              setIsAuthorized(true);
            } else {
              const roleDetected = profile.role || 'неопределена';
              console.log('AdminLayout: User is NOT admin. Role:', roleDetected, 'Redirecting to home.');
              toast({
                title: 'Достъп отказан',
                description: `Нямате права за достъп до административния панел. Вашата роля е: ${roleDetected}.`,
                variant: 'destructive',
              });
              router.push('/');
              setIsAuthorized(false);
            }
          } else {
            console.error('AdminLayout: User profile not found in Firestore for UID:', user.uid, 'Redirecting to home.');
            toast({
              title: 'Грешка при проверка на права',
              description: 'Потребителският Ви профил не беше намерен в базата данни или нямате зададена роля.',
              variant: 'destructive',
            });
            router.push('/');
            setIsAuthorized(false);
          }
        } catch (error: any) {
          console.error('AdminLayout: Error fetching user profile:', error);
          toast({
            title: 'Грешка при проверка на права',
            description: `Неуспешно извличане на потребителски данни: ${error.message}`,
            variant: 'destructive',
          });
          router.push('/');
          setIsAuthorized(false);
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
        setIsAuthorized(false); // Explicitly set isAuthorized to false
        console.log('AdminLayout: Setting isLoading to false in no user path.');
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
    console.log('AdminLayout: Rendering loading state...');
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <p className="text-lg">Зареждане на административен панел...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    // This state should ideally not be reached for long if redirects are working.
    // It serves as a fallback or if there's a delay in redirect.
    console.log('AdminLayout: Rendering unauthorized state (should be redirecting or access denied)...');
    return (
      <div className="flex h-screen items-center justify-center bg-background text-destructive">
        <p className="text-lg">Нямате достъп до тази страница или се пренасочвате...</p>
      </div>
    );
  }

  console.log('AdminLayout: Rendering authorized admin content.');
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
