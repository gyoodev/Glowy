'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import type { Salon } from '@/types'; // Assuming you have a Salon type
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toaster';
import { Skeleton } from '@/components/ui/skeleton'; // Keep this import

export default function EditBusinessPage() {
  const router = useRouter();
  const params = useParams();
  const businessId = params.businessId as string; // Get the businessId from URL

  const [business, setBusiness] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Salon>>({});
  const firestore = getFirestore();
  const { toast } = useToast();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/login');
      } else {
        // User is authenticated, fetch business data
        fetchBusiness(user.uid);
      }
    });

    return () => unsubscribe();
  }, [businessId, router, auth]);

  const fetchBusiness = async (userId: string) => {
    if (!businessId) {
      setLoading(false);
      toast({
        title: 'Error',
        description: 'Business ID is missing.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const businessRef = doc(firestore, 'salons', businessId);
      const docSnap = await getDoc(businessRef);

      if (docSnap.exists()) {
        const businessData = { id: docSnap.id, ...docSnap.data() } as Salon;

        // Check if the logged-in user is the owner of the business
        if (businessData.ownerId !== userId) {
          toast({
            title: 'Unauthorized',
            description: 'You do not have permission to edit this business.',
            variant: 'destructive',
          });
          router.push('/business/manage'); // Redirect back to manage page
          return;
        }

        setBusiness(businessData);
        setFormData(businessData); // Initialize form data with fetched data
      } else {
        toast({
          title: 'Not Found',
          description: 'Business not found.',
          variant: 'destructive',
        });
        router.push('/business/manage'); // Redirect if business doesn't exist
      }
    } catch (error) {
      console.error('Error fetching business:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch business data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!businessId || !business) return;

    setSaving(true);

    try {
      const businessRef = doc(firestore, 'salons', businessId);
      // Update only the fields that have been changed
      const updatedData: Partial<Salon> = {};
      for (const key in formData) {
        if (formData[key as keyof Partial<Salon>] !== business[key as keyof Salon] && key !== 'id') {
           // Simple check, might need more sophisticated diffing for complex objects
           updatedData[key as keyof Partial<Salon>] = formData[key as keyof Partial<Salon>];
        }
      }

      if (Object.keys(updatedData).length > 0) {
         await updateDoc(businessRef, updatedData);
         toast({
           title: 'Success',
           description: 'Business updated successfully.',
         });
      } else {
        toast({
           title: 'No Changes',
           description: 'No changes detected to save.',
           variant: 'neutral', // Consider a neutral variant if you have one
        });
      }


      router.push('/business/manage'); // Redirect after successful update

    } catch (error) {
      console.error('Error updating business:', error);
      toast({
        title: 'Error',
        description: 'Failed to update business data.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-6">
        <Skeleton className="h-10 w-1/4 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </CardHeader>
          <CardContent className="grid gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!business) {
    // This case is handled in fetchBusiness with redirects and toasts
    return null;
  }

  return (
    <div className="container mx-auto py-10 px-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Редактирай Бизнес</CardTitle>
          <CardDescription>Променете информацията за Вашия салон.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Име на Салона</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                required
                rows={6}
              />
            </div>
            {/* Add other fields as needed, e.g., address, phone, email, etc. */}
            <div className="grid gap-2">
              <Label htmlFor="address">Адрес</Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={handleInputChange}
              />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
              />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="email">Имейл</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={handleInputChange}
              />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="website">Уебсайт</Label>
              <Input
                id="website"
                value={formData.website || ''}
                onChange={handleInputChange}
              />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="heroImage">URL на Основно Изображение</Label>
              <Input
                id="heroImage"
                value={formData.heroImage || ''}
                onChange={handleInputChange}
              />
            </div>


            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Записване...' : 'Запази Промените'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}