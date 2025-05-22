
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, Search, Sparkles as AppIcon, User, LogOut } from 'lucide-react';
import { auth, getUserProfile } from '@/lib/firebase';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';

const navItems = [
  { href: '/', label: 'Салони' },
  { href: '/recommendations', label: 'AI Препоръки' },
];

export function Header() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const profile = await getUserProfile(user.uid);
        setUserRole(profile?.role || null);
        if (typeof window !== 'undefined') {
          localStorage.setItem('isUserLoggedIn', 'true');
        }
      } else {
        setUserRole(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('isUserLoggedIn');
        }
      }
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const isLoggedIn = !!currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('isUserLoggedIn');
      }
      setUserRole(null); // Explicitly set role to null on logout
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

 const businessManageLinkMobile = (
    <Button variant="ghost" asChild className="justify-start text-base py-3">
      <Link href="/business/manage">Управление на Бизнеса</Link>
    </Button>
  );

 const adminPanelLinkMobile = (
 <Button variant="ghost" asChild className="justify-start text-base py-3">
 <Link href="/admin/dashboard">Админ панел</Link>
 </Button>
 );


  const adminPanelLinkDesktop = (
     <Button variant="ghost" asChild>
      <Link href="/admin/dashboard">Админ панел</Link>
    </Button>
  )
 const businessManageLinkDesktop = (
    <Button variant="ghost" asChild>
      <Link href="/business/manage">Управление на Бизнеса</Link>
    </Button>
  );

  const myAccountLinkMobile = (
    <Button variant="outline" asChild className="justify-start text-base py-3">
        <Link href="/account">
            <User className="mr-2 h-4 w-4" /> Профил
        </Link>
    </Button>
  );

  const logoutButtonMobile = (
    <Button variant="ghost" onClick={handleLogout} className="justify-start text-base py-3 text-destructive hover:text-destructive">
        <LogOut className="mr-2 h-4 w-4" /> Изход
    </Button>
  );


  if (isLoading) {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center">
                 <div className="mr-6 flex items-center space-x-2">
                    <AppIcon className="h-6 w-6 text-primary" />
                    <span className="font-bold sm:inline-block text-lg">Glowy</span>
                </div>
                <div className="flex-1"></div>
            </div>
        </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <AppIcon className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block text-lg">Glowy</span>
        </Link>

        <nav className="hidden flex-1 items-center space-x-1 md:flex">
          {navItems.map((item) => (
            <Button key={item.label} variant="ghost" asChild>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
          {isLoggedIn && userRole === 'admin' && adminPanelLinkDesktop}
          {isLoggedIn && userRole === 'business' && businessManageLinkDesktop}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-2 md:flex-none">
          <Button variant="ghost" size="icon" aria-label="Търсене">
            <Search className="h-5 w-5" />
          </Button>

          {isLoggedIn ? (
            <>
              <Button variant="outline" asChild>
                <Link href="/account">
                  <User className="mr-2 h-4 w-4" /> Профил
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href="/login">Вход</Link>
              </Button>
              <Button variant="default" asChild className="hidden sm:inline-flex">
                <Link href="/register">Регистрация</Link>
              </Button>
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Отвори менюто">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle className="sr-only">Меню за навигация</SheetTitle>
              <nav className="flex flex-col space-y-2 mt-6">
                {navItems.map((item) => (
                  <Button key={item.label} variant="ghost" asChild className="justify-start text-base py-3">
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
                {isLoggedIn && userRole === 'business' && businessManageLinkMobile}
                {isLoggedIn && userRole === 'admin' && adminPanelLinkMobile}
                
                <hr className="my-2"/>
                
                {isLoggedIn ? (
                  <>
                    {myAccountLinkMobile}
                    {logoutButtonMobile} 
                  </>
                ) : (
                  <>
                    <Button variant="outline" asChild className="justify-start text-base py-3">
                        <Link href="/login">Вход</Link>
                    </Button>
                    <Button variant="default" asChild className="justify-start text-base py-3">
                        <Link href="/register">Регистрация</Link>
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
