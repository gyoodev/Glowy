import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Search, Sparkles as AppIcon, User } from 'lucide-react'; // Using Sparkles as AppIcon

const navItems = [
  { href: '/', label: 'Salons' },
  { href: '/recommendations', label: 'AI Picks' },
  { href: '/account', label: 'Account' },
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
          <Button variant="ghost" size="icon" aria-label="Search">
            <Search className="h-5 w-5" />
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col space-y-4 mt-6">
                {navItems.map((item) => (
                  <Button key={item.label} variant="ghost" asChild className="justify-start">
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
