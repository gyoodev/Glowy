
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, Search, Sparkles as AppIcon, LogOut } from 'lucide-react';
import { auth, getUserProfile } from '@/lib/firebase';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';

const navItems = [
  { href: '/', label: 'Салони' },
  { href: '/recommendations', label: 'AI Препоръки' },
];

export function Header() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Initialize to true
  const [userRole, setUserRole] = useState<string | null>(null); // State for user role

  useEffect(() => {
    // setIsLoading(true); // Not needed here as it's initialized to true
    const unsubscribe = onAuthStateChanged(auth, async (user) => { // Make the callback async
      setCurrentUser(user);
      if (user) {
        const profile = await getUserProfile(user.uid);
        setUserRole(profile?.role || null); // Set user role
      } else {
        setUserRole(null); // Clear role if no user
      }
      // Ensure localStorage is only accessed on the client
      if (typeof window !== 'undefined') {
        if (user) {
          localStorage.setItem('isUserLoggedIn', 'true');
        } else {
          localStorage.removeItem('isUserLoggedIn');
        }
      }
      setIsLoading(false); // Set loading to false after auth state is determined
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array means this runs once on mount and cleanup on unmount

  const isLoggedIn = !!currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
      // Optionally, show a toast error
    }
  };

  const myAccountLinkDesktop = (
    <Button variant="ghost" asChild>
      <Link href="/account">Моят Акаунт</Link>
    </Button>
  );

  const myAccountLinkMobile = (
     <Button variant="ghost" asChild className="justify-start">
        <Link href="/account">Моят Акаунт</Link>
    </Button>
  );

  const adminPanelLinkDesktop = (
     <Button variant="ghost" asChild>
      <Link href="/admin/dashboard">Admin Panel</Link>
    </Button>
  )

  // Render loading skeleton if isLoading is true
  // This will be the case on initial server render and initial client render before useEffect runs
  if (isLoading) {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center">
                 <div className="mr-6 flex items-center space-x-2">
                    <AppIcon className="h-6 w-6 text-primary" />
                    <span className="font-bold sm:inline-block text-lg">Glowy</span>
                </div>
                <div className="flex-1"></div> {/* Spacer */}
            </div>
        </header>
    );
  }

  // Render actual header content once loading is false
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
          {isLoggedIn && myAccountLinkDesktop}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-2 md:flex-none">
          <Button variant="ghost" size="icon" aria-label="Търсене">
            <Search className="h-5 w-5" />
          </Button>

          {isLoggedIn ? (
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Изход
            </Button>
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
                {isLoggedIn && myAccountLinkMobile}
                <hr className="my-2"/>
                {isLoggedIn ? (
                  <Button variant="outline" onClick={handleLogout} className="justify-start text-base py-3">
                     <LogOut className="mr-2 h-4 w-4" /> Изход
                  </Button>
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
