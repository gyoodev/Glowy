// This file is intentionally made to trigger a notFound()
// to resolve a parallel route conflict.
// The main salon directory is now at /home.
import { notFound } from 'next/navigation';

export default function OldRootPage() {
  notFound();
  // Next.js will not render anything below notFound() in a Server Component
  // but to be explicit for linters or if this were a client component:
  return null;
}
