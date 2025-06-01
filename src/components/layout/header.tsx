
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, Sparkles as AppIcon, User, LogOut, Bell, LogIn, Sun, Moon, LayoutDashboard } from 'lucide-react';
import { auth, getUserProfile, getUserNotifications, markAllUserNotificationsAsRead, markNotificationAsRead } from '@/lib/firebase';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import type { Notification } from '@/types';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { bg } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { setCookie, getCookie } from '@/lib/cookies';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

const navItems = [
  { href: '/salons', label: 'Салони' },
  { href: '/recommendations', label: 'Glowy Препоръка' },
  { href: '/contact', label: 'Контакти' },
];

const THEME_COOKIE_KEY = 'glowy-theme';

export function Header() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);

  useEffect(() => {
    // Theme initialization
    if (typeof window !== 'undefined') {
      const savedTheme = getCookie(THEME_COOKIE_KEY);
      if (savedTheme) {
        setCurrentTheme(savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      } else {
        // Default to light theme if no cookie is set or if system prefers dark
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = prefersDark ? 'dark' : 'light';
        setCurrentTheme(initialTheme);
        document.documentElement.classList.toggle('dark', initialTheme === 'dark');
        // Optionally set the cookie here for the default theme
        // setCookie(THEME_COOKIE_KEY, initialTheme, 365);
      }
    }

    // Auth initialization
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserRole(profile?.role || null);
          if (typeof window !== 'undefined') {
            localStorage.setItem('isUserLoggedIn', 'true');
          }
          fetchNotificationsContent(user.uid); // fetch notifications
        } catch (error) {
            console.error("Error fetching user profile in Header:", error);
            setUserRole(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('isUserLoggedIn');
            }
        }
      } else {
        setUserRole(null);
        setNotifications([]);
        setUnreadCount(0);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('isUserLoggedIn');
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  const fetchNotificationsContent = async (userId: string) => {
    if (!userId) return;
    try {
        const userNotifications = await getUserNotifications(userId);
        setNotifications(userNotifications);
        setUnreadCount(userNotifications.filter(n => !n.read).length);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
        setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (currentUser?.uid) {
      fetchNotificationsContent(currentUser.uid);
    }
  }, [currentUser?.uid]);


  const isLoggedIn = !!currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
      setNotifications([]);
      setUnreadCount(0);
      setIsMobileMenuOpen(false);
      setIsPopoverOpen(false);
      if (typeof window !== 'undefined') {
          localStorage.removeItem('isUserLoggedIn');
      }
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const handleOpenPopover = async () => {
    setIsPopoverOpen(true);
    if (unreadCount > 0 && currentUser?.uid) {
      try {
        await markAllUserNotificationsAsRead(currentUser.uid);
        fetchNotificationsContent(currentUser.uid);
      } catch (error) {
          console.error("Error marking notifications as read:", error);
      }
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!currentUser?.uid) return;
    if (!notification.read) {
        try {
            await markNotificationAsRead(notification.id);
            fetchNotificationsContent(currentUser.uid);
        } catch (error) {
            console.error("Error marking single notification as read:", error);
        }
    }
    if (notification.link) {
      if (notification.type === 'new_contact_admin') {
        notification.link = '/admin/contacts';
      }
      router.push(notification.link);
    }
    setIsPopoverOpen(false);
    setIsMobileMenuOpen(false);
  };

  const toggleTheme = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setCookie(THEME_COOKIE_KEY, newTheme, 365);
    setCurrentTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    toast({
      title: 'Темата е променена',
      description: `Темата е успешно сменена на ${newTheme === 'dark' ? 'тъмна' : 'светла'}.`,
    });
  };

  if (isLoading) {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center px-6">
                 <div className="mr-6 flex items-center space-x-2">
                    <AppIcon className="h-6 w-6 text-primary" />
                    <span className="font-bold sm:inline-block text-lg">Glowy</span>
                </div>
                <div className="flex-1"></div>
                <div className="flex items-center space-x-2">
                    {/* Placeholder for buttons or remove if not needed */}
                </div>
            </div>
        </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-6">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <AppIcon className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block text-lg">Glowy</span>
        </Link>

        <nav className="hidden flex-1 items-center space-x-1 md:flex">
          {navItems.map((item) => {
             if (item.label === 'Glowy Препоръка' && !isLoggedIn) {
              return null;
            }
            return (
              <Button key={item.label} variant="ghost" asChild>
                <Link href={item.href}>{item.label}</Link>
              </Button>
            );
          })}
          {isLoggedIn && userRole === 'business' && (
            <Button variant="ghost" asChild>
              <Link href="/business/manage">Управление на Бизнеса</Link>
            </Button>
          )}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-2 md:flex-initial">
          {currentTheme !== null && (
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Смяна на тема">
              {currentTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}

          {isLoggedIn && userRole === 'admin' && (
            <Button variant="ghost" size="icon" asChild className="hidden md:inline-flex">
              <Link href="/admin" aria-label="Админ панел">
                <LayoutDashboard className="h-5 w-5" />
              </Link>
            </Button>
          )}

          {isLoggedIn && (
             <Popover open={isPopoverOpen} onOpenChange={(open) => {
                if (open) {
                  handleOpenPopover();
                } else {
                  setIsPopoverOpen(false);
                }
              }}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs rounded-full"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                  <span className="sr-only">Отвори известия</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 font-medium border-b">Известия</div>
                <ScrollArea className="h-[300px]">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">Няма нови известия.</p>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-3 hover:bg-muted cursor-pointer ${
                            !notification.read ? 'font-semibold bg-secondary/50' : ''
                          }`}
                        >
                          <p className="text-sm leading-tight">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.createdAt
                              ? (notification.createdAt as any).seconds
                                ? formatDistanceToNow(new Date((notification.createdAt as any).seconds * 1000), { addSuffix: true, locale: bg })
                                : formatDistanceToNow(new Date(notification.createdAt as string), { addSuffix: true, locale: bg })
                              : 'Преди малко'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                 {notifications.length > 0 && (
                    <div className="p-2 border-t text-center">
                        <Button variant="link" size="sm" onClick={() => {setIsPopoverOpen(false); router.push('/notifications')}}>
                            Виж всички
                        </Button>
                    </div>
                )}
              </PopoverContent>
            </Popover>
          )}

          {isLoggedIn ? (
             <div className="hidden md:inline-flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <User className="mr-2 h-4 w-4" /> Профил
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="flex items-center w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Моят Профил</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive-foreground cursor-pointer flex items-center w-full"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Изход</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Button variant="outline" asChild className="hidden md:inline-flex">
                <Link href="/login"><LogIn className="mr-2 h-4 w-4" />Вход</Link>
              </Button>
              <Button variant="default" asChild className="hidden md:inline-flex">
                <Link href="/register">Регистрация</Link>
              </Button>
            </>
          )}

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Отвори менюто">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetTitle className="sr-only">Меню за навигация</SheetTitle>
              <nav className="flex flex-col space-y-2 mt-6">
                {navItems.map((item) => {
                  if (item.label === 'Glowy Препоръка' && !isLoggedIn) {
                    return null;
                  }
                  return (
                    <Button key={item.label} variant="ghost" asChild className="justify-start text-base py-3" onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href={item.href}>{item.label}</Link>
                    </Button>
                  );
                })}
                {isLoggedIn && userRole === 'business' && (
                   <Button variant="ghost" asChild className="justify-start text-base py-3" onClick={() => setIsMobileMenuOpen(false)}>
                    <Link href="/business/manage">Управление на Бизнеса</Link>
                  </Button>
                )}
                {isLoggedIn && userRole === 'admin' && (
                  <Button variant="ghost" asChild className="justify-start text-base py-3" onClick={() => setIsMobileMenuOpen(false)}>
                    <Link href="/admin">Админ панел</Link>
                  </Button>
                )}

                <hr className="my-2"/>

                {isLoggedIn ? (
                  <>
                    <Button variant="outline" asChild className="justify-start text-base py-3" onClick={() => setIsMobileMenuOpen(false)}>
                        <Link href="/account">
                            <User className="mr-2 h-4 w-4" /> Профил
                        </Link>
                    </Button>
                    <Button variant="ghost" onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="justify-start text-base py-3 text-destructive hover:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" /> Изход
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" asChild className="justify-start text-base py-3" onClick={() => setIsMobileMenuOpen(false)}>
                        <Link href="/login"><LogIn className="mr-2 h-4 w-4" />Вход</Link>
                    </Button>
                    <Button variant="default" asChild className="justify-start text-base py-3" onClick={() => setIsMobileMenuOpen(false)}>
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
