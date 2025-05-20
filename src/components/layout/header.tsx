
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, Search, Sparkles as AppIcon, UserCircle, LogOut } from 'lucide-react'; 

const navItems = [
  { href: '/', label: 'Салони' },
  { href: '/recommendations', label: 'AI Препоръки' },
  // "Моят Акаунт" will be handled conditionally below
];

export function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check login status from localStorage on component mount
    const userLoggedIn = localStorage.getItem('isUserLoggedIn') === 'true';
    setIsLoggedIn(userLoggedIn);
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isUserLoggedIn');
    setIsLoggedIn(false);
    router.push('/login');
  };

  const accountLinkOrAction = isLoggedIn ? (
    <Button variant="ghost" asChild>
      <Link href="/account">Моят Акаунт</Link>
    </Button>
  ) : (
    <Button variant="ghost" onClick={() => router.push('/login')}>
      Моят Акаунт
    </Button>
  );

  const accountLinkOrActionMobile = isLoggedIn ? (
     <Button variant="ghost" asChild className="justify-start">
        <Link href="/account">Моят Акаунт</Link>
    </Button>
  ) : (
    <Button variant="ghost" onClick={() => router.push('/login')} className="justify-start">
        Моят Акаунт
    </Button>
  );


  if (isLoading) {
    // You can return a skeleton loader for the header here if desired
    // For simplicity, just rendering a minimal header or null during loading
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
          {accountLinkOrAction}
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
                {accountLinkOrActionMobile}
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
