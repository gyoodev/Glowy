'use client';

import React, { useEffect, useState, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, getUserProfile } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Home, Users, Briefcase, Mail, LogOut, Newspaper, CalendarCheck } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

interface UserProfile {
  role: string;
  [key: string]: any;
}

// Constants for better maintainability
const MESSAGES = {
  LOADING: 'Зареждане на административен панел...',
  ACCESS_DENIED: 'Нямате достъп до тази страница.',
  ACCESS_GRANTED: 'Достъп разрешен',
  ACCESS_GRANTED_DESC: 'Вие сте влезли като администратор.',
  ACCESS_DENIED_TITLE: 'Достъп отказан',
  ACCESS_DENIED_DESC: 'Нямате права за достъп до административния панел.',
  AUTH_REQUIRED: 'Необходимо е удостоверяване',
  AUTH_REQUIRED_DESC: 'Моля, влезте, за да достъпите административния панел.',
  PROFILE_ERROR: 'Грешка при проверка на права',
  PROFILE_NOT_FOUND: 'Потребителският Ви профил не беше намерен в базата данни.',
  LOGOUT_SUCCESS: 'Успешен изход',
  LOGOUT_SUCCESS_DESC: 'Излязохте от системата.',
  LOGOUT_ERROR: 'Грешка при изход'
} as const;

const MIN_LOADING_TIME = 500; // Prevent loading flicker

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const isMountedRef = useRef(true);
  const loadingStartTime = useRef(Date.now());

  const setLoadingWithMinTime = async (loading: boolean) => {
    if (!loading) {
      const elapsed = Date.now() - loadingStartTime.current;
      if (elapsed < MIN_LOADING_TIME) {
        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
      }
    }
    if (isMountedRef.current) {
      setIsLoading(loading);
    }
  };

  const handleAuthError = (message: string, error?: Error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('AdminLayout Auth Error:', message, error);
    }
    
    if (isMountedRef.current) {
      toast({
        title: MESSAGES.PROFILE_ERROR,
        description: message,
        variant: 'destructive',
      });
    }
  };

  const redirectToHome = () => {
    try {
      router.push('/');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('AdminLayout: Error redirecting to home:', error);
      }
    }
  };

  const redirectToLogin = () => {
    try {
      router.push('/login');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('AdminLayout: Error redirecting to login:', error);
      }
    }
  };

  const checkUserAuthorization = async (user: User): Promise<void> => {
    try {
      const profile: UserProfile | null = await getUserProfile(user.uid);
      
      if (!isMountedRef.current) return;

      if (!profile) {
        handleAuthError(MESSAGES.PROFILE_NOT_FOUND);
        redirectToHome();
        return;
      }

      if (profile.role === 'admin') {
        setIsAuthorized(true);
        toast({
          title: MESSAGES.ACCESS_GRANTED,
          description: MESSAGES.ACCESS_GRANTED_DESC,
          variant: 'default',
        });
      } else {
        const roleDetected = profile.role || 'неопределена';
        toast({
          title: MESSAGES.ACCESS_DENIED_TITLE,
          description: `${MESSAGES.ACCESS_DENIED_DESC} Вашата роля е: ${roleDetected}.`,
          variant: 'destructive',
        });
        redirectToHome();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестна грешка';
      handleAuthError(`Неуспешно извличане на потребителски данни: ${errorMessage}`, error as Error);
      redirectToHome();
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    loadingStartTime.current = Date.now();

    if (process.env.NODE_ENV === 'development') {
      console.log('AdminLayout: Starting auth check');
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMountedRef.current) return;

      if (user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('AdminLayout: User authenticated, checking authorization');
        }
        await checkUserAuthorization(user);
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('AdminLayout: User not authenticated, redirecting to login');
        }
        toast({
          title: MESSAGES.AUTH_REQUIRED,
          description: MESSAGES.AUTH_REQUIRED_DESC,
        });
        redirectToLogin();
      }

      await setLoadingWithMinTime(false);
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [router, toast]);

  const handleLogout = async (): Promise<void> => {
    try {
      await auth.signOut();
      toast({ 
        title: MESSAGES.LOGOUT_SUCCESS, 
        description: MESSAGES.LOGOUT_SUCCESS_DESC 
      });
      redirectToLogin();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('AdminLayout: Error signing out:', error);
      }
      toast({ 
        title: MESSAGES.LOGOUT_ERROR, 
        variant: 'destructive' 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-lg">{MESSAGES.LOADING}</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-destructive">
        <div className="text-center">
          <p className="text-lg mb-4">{MESSAGES.ACCESS_DENIED}</p>
          <button 
            onClick={redirectToHome}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Към началната страница
          </button>
        </div>
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
            <Link 
              href="/admin" 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors font-medium"
            >
              <Home size={20} />
              <span>Табло</span>
            </Link>
            <Link 
              href="/admin/users" 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors font-medium"
            >
              <Users size={20} />
              <span>Потребители</span>
            </Link>
            <Link 
              href="/admin/business" 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors font-medium"
            >
              <Briefcase size={20} />
              <span>Бизнеси</span>
            </Link>
            <Link 
              href="/admin/bookings" 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors font-medium"
            >
              <CalendarCheck size={20} />
              <span>Резервации</span>
            </Link>
            <Link 
              href="/admin/contacts" 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors font-medium"
            >
              <Mail size={20} />
              <span>Запитвания</span>
            </Link>
            <Link 
              href="/admin/newsletter" 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors font-medium"
            >
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