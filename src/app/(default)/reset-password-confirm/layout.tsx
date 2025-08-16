
import { type ReactNode } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Sparkles } from 'lucide-react'; // Using Sparkles as AppIcon
import Link from 'next/link';

interface AuthLayoutProps {
  children: ReactNode;
}

// This layout wraps the reset-password-confirm page with the same
// visual style as the other authentication pages (login, register).
export default function ResetPasswordConfirmLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
        <div className="absolute top-6 left-6">
            <Link href="/" className="flex items-center space-x-2 text-primary hover:text-primary/80">
                <Sparkles className="h-7 w-7" />
                <span className="font-bold text-xl">Glowy</span>
            </Link>
        </div>
      <main className="w-full max-w-md">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
