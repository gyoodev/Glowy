
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-6">
      <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
      <h1 className="text-6xl font-bold text-destructive">404</h1>
      <h2 className="mt-4 text-3xl font-semibold text-foreground">Страницата не е намерена</h2>
      <p className="mt-3 text-lg text-muted-foreground max-w-md">
        Изглежда, че страницата, която търсите, не съществува или е била преместена.
      </p>

      <div className="mt-8 w-full max-w-lg bg-muted/50 p-4 rounded-lg shadow-md border border-border">
        <p className="text-sm font-semibold text-muted-foreground mb-2 text-left">Developer Tip:</p>
        <pre className="text-xs text-left bg-card p-3 rounded-md overflow-x-auto border border-border/50 text-foreground/80">
          <code>
            {`// Common checks for 404 errors:\n` +
             `// 1. Verify the URL path is correct and matches your file structure.\n` +
             `//    (e.g., /admin/dashboard corresponds to app/(admin)/dashboard/page.tsx)\n` +
             `// 2. Ensure the corresponding page file (page.tsx) exists.\n` +
             `// 3. Check deployment logs (e.g., Netlify build logs) for errors \n` +
             `//    that might prevent the page from being built.\n` +
             `// 4. For dynamic routes [slug], ensure data fetching is successful;\n`+
             `//    a failure to fetch data might lead to a notFound() call.`}
          </code>
        </pre>
      </div>

      <Button asChild className="mt-8 text-lg py-3 px-6">
        <Link href="/home">Обратно към Началната страница</Link>
      </Button>
    </div>
  );
}
