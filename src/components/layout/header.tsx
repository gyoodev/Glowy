
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, Search, Sparkles as AppIcon } from 'lucide-react'; // Using Sparkles as AppIcon

const navItems = [
  { href: '/', label: 'Салони' },
  { href: '/recommendations', label: 'AI Препоръки' },
  { href: '/account', label: 'Моят Акаунт' }, // Changed from 'Акаунт' to 'Моят Акаунт' for consistency
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <AppIcon className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block text-lg">Glowy</span>
        </Link>
        
        <nav className="hidden flex-1 items-center space-x-4 md:flex">
          {navItems.map((item) => (
            <Button key={item.label} variant="ghost" asChild>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-2 md:flex-none">
          <Button variant="ghost" size="icon" aria-label="Търсене">
            <Search className="h-5 w-5" />
          </Button>
          {/* Placeholder for future user auth button/dropdown - for now, direct link to login */}
          <Button variant="outline" asChild>
            <Link href="/login">Вход</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Отвори менюто">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle className="sr-only">Меню за навигация</SheetTitle>
              <nav className="flex flex-col space-y-4 mt-6">
                {navItems.map((item) => (
                  <Button key={item.label} variant="ghost" asChild className="justify-start">
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
                 <Button variant="outline" asChild className="justify-start">
                    <Link href="/login">Вход / Регистрация</Link>
                  </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
