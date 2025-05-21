'use client';

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserProfile } from '@/lib/firebase';
import Link from 'next/link';
import type { UserProfile } from '@/types'; // Assuming UserProfile type is in types/index.ts

export default function BusinessManagePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Not logged in, redirect to homepage
        router.push('/');
      } else {
        // Logged in, fetch profile to check role
        const profile = await getUserProfile(user.uid);
        if (!profile || profile.role !== 'business') {
          // Not a business user, redirect to homepage
          router.push('/');
        } else {
          // Business user, set profile and stop loading
          setUserProfile(profile);
          setIsLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 text-center">
        Loading user data...
      </div>
    );
  }

  // userProfile is guaranteed to be a business user profile here
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Business Management Page</h1>
      {/* Placeholder content for business management form */}
      <p>Welcome, {userProfile?.name}! You can manage your business here.</p>
      {/* TODO: Replace 'your-business-id' with the actual business ID */}
      <Link href="/business/your-business-id" className="text-blue-600 hover:underline">
        View Your Business Profile
      </Link>

      {/* Add your business management form and content here */}
    </div>
  );
}